const NodeHelper = require("node_helper");

const DEFAULT_API_BASE_URL = "";
const DEFAULT_TIMEOUT_MS = 12 * 1000;

module.exports = NodeHelper.create({
	start() {
		this.controlFilters = {};
		this.lastConfig = {};
		this.routesRegistered = false;
		this.registerRoutes();
	},

	registerRoutes() {
		if (!this.expressApp || this.routesRegistered) return;
		this.routesRegistered = true;

		this.expressApp.get(`/${this.name}/xmonitor-control`, (_request, response) => {
			response.set("Content-Type", "text/html; charset=utf-8");
			response.send(this.renderControlPage());
		});

		this.expressApp.post(`/${this.name}/xmonitor-control`, (request, response) => {
			this.readRequestBody(request, (error, body) => {
				if (!error) {
					this.controlFilters = this.parseControlFilters(new URLSearchParams(body || ""));
					this.sendSocketNotification("XMONITOR_DASHBOARD_FILTERS_UPDATED", {
						filters: this.controlFilters
					});
				}
				response.writeHead(303, { Location: `/${this.name}/xmonitor-control` });
				response.end();
			});
		});

		this.expressApp.post(`/${this.name}/xmonitor-control/reset`, (_request, response) => {
			this.controlFilters = {};
			this.sendSocketNotification("XMONITOR_DASHBOARD_FILTERS_UPDATED", {
				filters: this.controlFilters
			});
			response.writeHead(303, { Location: `/${this.name}/xmonitor-control` });
			response.end();
		});

		this.expressApp.post(`/${this.name}/xmonitor-control/refresh`, (_request, response) => {
			this.sendSocketNotification("XMONITOR_DASHBOARD_REFRESH_REQUESTED", {});
			response.writeHead(303, { Location: `/${this.name}/xmonitor-control` });
			response.end();
		});

		this.expressApp.post(`/${this.name}/xmonitor-control/reload`, (_request, response) => {
			this.sendSocketNotification("XMONITOR_DASHBOARD_RELOAD_REQUESTED", {});
			response.writeHead(303, { Location: `/${this.name}/xmonitor-control` });
			response.end();
		});
	},

	socketNotificationReceived(notification, payload) {
		if (notification !== "XMONITOR_DASHBOARD_FETCH") return;
		this.fetchXMonitor(payload.identifier, payload.config);
	},

	async fetchXMonitor(identifier, config) {
		this.lastConfig = config || {};
		const apiBaseUrl = this.resolveApiBaseUrl(config);
		const apiPaths = this.resolveApiPaths(config);
		if (!apiBaseUrl || !apiPaths.feed || !apiPaths.trends || !apiPaths.summaries) {
			this.sendSocketNotification("XMONITOR_DASHBOARD_RESULT", {
				identifier,
				status: "setup",
				error: "Set the private X Monitor API settings"
			});
			return;
		}

		const filters = this.mergeFilters(config.filters || {}, config.enableLocalControls ? this.controlFilters : {});
		const queryParams = this.buildQueryParams(filters, config);
		const trendParams = new URLSearchParams(queryParams);
		trendParams.delete("limit");
		trendParams.set("trend_range", filters.trendRange || config.trendRange || "24h");

		const requests = {
			feed: this.fetchJson(this.buildApiUrl(apiBaseUrl, apiPaths.feed, queryParams), config),
			trends: this.fetchJson(this.buildApiUrl(apiBaseUrl, apiPaths.trends, trendParams), config),
			summaries: this.fetchJson(this.buildApiUrl(apiBaseUrl, apiPaths.summaries), config)
		};

		const [feed, trends, summaries] = await Promise.allSettled([
			requests.feed,
			requests.trends,
			requests.summaries
		]);

		const errors = [];
		const payload = { filters };
		this.applySettled("feed", feed, payload, errors);
		this.applySettled("trends", trends, payload, errors);
		this.applySettled("summaries", summaries, payload, errors);
		if (payload.summaries?.items) payload.summaries = payload.summaries.items;

		if (!payload.feed && !payload.trends && !payload.summaries) {
			this.sendSocketNotification("XMONITOR_DASHBOARD_RESULT", {
				identifier,
				status: "error",
				error: errors[0] || "X Monitor unavailable",
				errors,
				payload,
				filters,
				fetchedAt: new Date().toISOString()
			});
			return;
		}

		this.sendSocketNotification("XMONITOR_DASHBOARD_RESULT", {
			identifier,
			status: errors.length > 0 ? "partial" : "ok",
			errors,
			payload,
			filters,
			fetchedAt: new Date().toISOString()
		});
	},

	applySettled(name, result, payload, errors) {
		if (result.status === "fulfilled") {
			payload[name] = result.value;
			return;
		}
		errors.push(`${name}: ${this.safeError(result.reason)}`);
	},

	resolveApiBaseUrl(config) {
		const configured = String(config?.apiBaseUrl || "").trim();
		const base = configured || DEFAULT_API_BASE_URL;
		return base.replace(/\/+$/, "");
	},

	resolveApiPaths(config) {
		return {
			feed: this.cleanApiPath(config?.feedPath),
			trends: this.cleanApiPath(config?.trendsPath),
			summaries: this.cleanApiPath(config?.summariesPath)
		};
	},

	cleanApiPath(value) {
		return String(value || "").trim();
	},

	buildApiUrl(apiBaseUrl, apiPath, params) {
		const normalizedPath = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
		const query = params ? params.toString() : "";
		return query ? `${apiBaseUrl}${normalizedPath}?${query}` : `${apiBaseUrl}${normalizedPath}`;
	},

	buildQueryParams(filters, config) {
		const params = new URLSearchParams();
		const defaultLimit = this.isFeedOnly(filters)
			? Number(config?.feedOnlyMaxFeedItems || config?.feedLimit || 18)
			: Number(config?.feedLimit || 12);
		const limit = Number(filters.limit || defaultLimit || 12);
		params.set("limit", String(Math.min(Math.max(limit, 1), 50)));

		this.appendParam(params, "significant", filters.significant || "true");
		this.appendParam(params, "handle", filters.handle || filters.handles);
		this.appendParam(params, "location", filters.location);
		this.appendParam(params, "q", filters.q);
		this.appendParam(params, "since", filters.since);
		this.appendParam(params, "until", filters.until);
		this.appendParam(params, "min_followers", filters.min_followers);
		this.appendParam(params, "max_followers", filters.max_followers);
		this.appendParam(params, "min_account_age_days", filters.min_account_age_days);
		this.appendParam(params, "max_account_age_days", filters.max_account_age_days);
		this.appendMultiParam(params, "tier", filters.tiers || filters.tier);
		this.appendMultiParam(params, "theme", filters.themes || filters.theme);
		this.appendMultiParam(params, "debate_issue", filters.debateIssues || filters.debate_issue);

		return params;
	},

	appendParam(params, key, value) {
		if (value === undefined || value === null) return;
		const text = String(value).trim();
		if (!text || text === "any" || text === "either") return;
		params.set(key, text);
	},

	appendMultiParam(params, key, value) {
		for (const item of this.toArray(value)) {
			if (!item || item === "any" || item === "either") continue;
			params.append(key, item);
		}
	},

	toArray(value) {
		if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
		if (value === undefined || value === null) return [];
		return String(value)
			.split(",")
			.map((item) => item.trim())
			.filter(Boolean);
	},

	mergeFilters(baseFilters, overrideFilters) {
		const merged = { ...baseFilters };
		for (const [key, value] of Object.entries(overrideFilters || {})) {
			if (Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && String(value).trim()) {
				merged[key] = value;
			}
		}
		return merged;
	},

	async fetchJson(url, config) {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), Number(config?.requestTimeoutMs) || DEFAULT_TIMEOUT_MS);
		try {
			const response = await fetch(url, {
				headers: this.buildHeaders(config),
				signal: controller.signal
			});
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			return await response.json();
		} finally {
			clearTimeout(timeout);
		}
	},

	buildHeaders(config) {
		const headers = { accept: "application/json" };
		const envName = String(config?.apiKeyEnvVar || "").trim();
		const value = envName ? String(process.env[envName] || "").trim() : "";
		if (value) {
			headers[String(config?.apiKeyHeader || "x-api-key")] = value;
		}
		return headers;
	},

	readRequestBody(request, callback) {
		let body = "";
		request.setEncoding("utf8");
		request.on("data", (chunk) => {
			body += chunk;
			if (body.length > 64 * 1024) {
				request.destroy();
			}
		});
		request.on("end", () => callback(null, body));
		request.on("error", (error) => callback(error));
	},

	parseControlFilters(params) {
		const filters = {};
		const setText = (key) => {
			const value = String(params.get(key) || "").trim();
			if (value) filters[key] = value;
		};
		const setMulti = (key) => {
			const value = params.getAll(key).map((item) => item.trim()).filter(Boolean);
			if (value.length > 0) filters[key] = value;
		};

		setText("significant");
		setText("trendRange");
		setText("handle");
		setText("location");
		setText("q");
		setText("limit");
		setText("min_followers");
		setText("max_followers");
		setMulti("tiers");
		setMulti("themes");
		setMulti("debateIssues");
		filters.displaySections = {
			summary: params.has("display_summary"),
			metricsActivity: params.has("display_metrics_activity"),
			themeDebate: params.has("display_theme_debate")
		};
		return filters;
	},

	isFeedOnly(filters) {
		const displaySections = this.resolveDisplaySections(filters);
		return !displaySections.summary && !displaySections.metricsActivity && !displaySections.themeDebate;
	},

	resolveDisplaySections(filters) {
		const defaults = {
			summary: true,
			metricsActivity: true,
			themeDebate: true
		};
		const configured = this.lastConfig?.displaySections || {};
		const overrides = filters?.displaySections || {};
		return Object.fromEntries(Object.keys(defaults).map((key) => [
			key,
			this.booleanValue(overrides[key], this.booleanValue(configured[key], defaults[key]))
		]));
	},

	booleanValue(value, fallback) {
		if (typeof value === "boolean") return value;
		if (value === undefined || value === null) return fallback !== false;
		const text = String(value).trim().toLowerCase();
		if (["1", "true", "yes", "on"].includes(text)) return true;
		if (["0", "false", "no", "off"].includes(text)) return false;
		return fallback !== false;
	},

	renderControlPage() {
		const configFilters = this.lastConfig?.filters || {};
		const filters = this.mergeFilters(configFilters, this.controlFilters);
		const displaySections = this.resolveDisplaySections(filters);
		const selected = (key, value) => this.toArray(filters[key]).includes(value) ? " selected" : "";
		const checked = (key) => displaySections[key] ? " checked" : "";
		const significantValue = String(filters.significant || "true");
		const checkedSignificant = (value) => significantValue === value ? " selected" : "";
		return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>X Monitor Dashboard Controls</title>
<style>
body{background:#070a0f;color:#edf5ff;font:18px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;padding:32px}
main{margin:0 auto;max-width:840px}
h1{font-size:42px;font-weight:650;margin:0 0 8px}
p{color:#aebccc;margin:0 0 24px}
form{display:grid;gap:18px}
label{display:grid;gap:7px;font-weight:650}
fieldset{border:1px solid #334155;border-radius:6px;margin:0;padding:16px}
legend{color:#edf5ff;font-weight:750;padding:0 8px}
input,select,textarea{background:#111823;border:1px solid #334155;border-radius:6px;color:#edf5ff;font:inherit;padding:10px 12px}
select[multiple]{min-height:134px}
.grid{display:grid;gap:18px;grid-template-columns:repeat(2,minmax(0,1fr))}
.toggle-grid{display:grid;gap:12px;grid-template-columns:repeat(3,minmax(0,1fr))}
.switch-row{align-items:center;background:#111823;border:1px solid #334155;border-radius:6px;display:flex;font-weight:700;gap:14px;justify-content:space-between;min-height:58px;padding:12px}
.switch-row input{height:1px;opacity:0;position:absolute;width:1px}
.switch-control{background:#334155;border-radius:999px;display:inline-flex;flex:0 0 auto;height:28px;padding:3px;transition:background .18s ease;width:52px}
.switch-control::after{background:#edf5ff;border-radius:50%;content:"";height:22px;transition:transform .18s ease;width:22px}
.switch-row input:checked + .switch-control{background:#53b7f8}
.switch-row input:checked + .switch-control::after{transform:translateX(24px)}
.actions,.action-strip{display:flex;flex-wrap:wrap;gap:12px;margin-top:8px}
.action-strip{margin:0 0 18px}
.action-strip form{display:block}
button,.button-link{background:#53b7f8;border:0;border-radius:6px;color:#06111c;cursor:pointer;display:inline-block;font:inherit;font-weight:750;padding:11px 16px;text-decoration:none}
button.secondary,.button-link.secondary{background:#1f2937;color:#edf5ff}
@media(max-width:720px){.grid,.toggle-grid{grid-template-columns:1fr}body{padding:22px}}
</style>
</head>
<body>
<main>
<h1>X Monitor Dashboard Controls</h1>
<p>Changes apply to the running MagicMirror dashboard and reset when MagicMirror restarts.</p>
<div class="action-strip" aria-label="Dashboard actions">
<a class="button-link secondary" href="/" target="_blank" rel="noreferrer">Open dashboard</a>
<form method="post" action="/${this.name}/xmonitor-control/refresh"><button type="submit">Refresh data</button></form>
<form method="post" action="/${this.name}/xmonitor-control/reload"><button class="secondary" type="submit">Reload display</button></form>
</div>
<form method="post" action="/${this.name}/xmonitor-control">
<fieldset>
<legend>Dashboard sections</legend>
<div class="toggle-grid">
<label class="switch-row"><span>Summary</span><input type="checkbox" name="display_summary"${checked("summary")}><span class="switch-control"></span></label>
<label class="switch-row"><span>Window metrics + activity trend</span><input type="checkbox" name="display_metrics_activity"${checked("metricsActivity")}><span class="switch-control"></span></label>
<label class="switch-row"><span>Theme mix + debate intensity</span><input type="checkbox" name="display_theme_debate"${checked("themeDebate")}><span class="switch-control"></span></label>
</div>
</fieldset>
<div class="grid">
<label>Significant
<select name="significant">
<option value="any"${checkedSignificant("any")}>Either</option>
<option value="true"${checkedSignificant("true")}>True</option>
<option value="false"${checkedSignificant("false")}>False</option>
</select>
</label>
<label>Trend range
<select name="trendRange">
<option value="24h"${String(filters.trendRange || this.lastConfig?.trendRange || "24h") === "24h" ? " selected" : ""}>24H</option>
<option value="7d"${String(filters.trendRange || this.lastConfig?.trendRange || "") === "7d" ? " selected" : ""}>7D</option>
<option value="30d"${String(filters.trendRange || this.lastConfig?.trendRange || "") === "30d" ? " selected" : ""}>30D</option>
</select>
</label>
<label>Tiers
<select multiple name="tiers">
<option value="teammate"${selected("tiers", "teammate")}>Teammate</option>
<option value="investor"${selected("tiers", "investor")}>Investor</option>
<option value="influencer"${selected("tiers", "influencer")}>Influencer</option>
<option value="ecosystem"${selected("tiers", "ecosystem")}>Ecosystem</option>
<option value="other"${selected("tiers", "other")}>Other</option>
</select>
</label>
<label>Themes
<select multiple name="themes">
${this.themeOptions().map((item) => `<option value="${this.escapeHtml(item)}"${selected("themes", item)}>${this.escapeHtml(item)}</option>`).join("")}
</select>
</label>
</div>
<label>Debate topics
<select multiple name="debateIssues">
${this.debateOptions().map((item) => `<option value="${this.escapeHtml(item)}"${selected("debateIssues", item)}>${this.escapeHtml(item)}</option>`).join("")}
</select>
</label>
<div class="grid">
<label>Handles <input name="handle" value="${this.escapeHtml(filters.handle || filters.handles || "")}" placeholder="alice bob"></label>
<label>Location <input name="location" value="${this.escapeHtml(filters.location || "")}" placeholder="singapore"></label>
<label>Min followers <input name="min_followers" inputmode="numeric" value="${this.escapeHtml(filters.min_followers || "")}"></label>
<label>Max followers <input name="max_followers" inputmode="numeric" value="${this.escapeHtml(filters.max_followers || "")}"></label>
</div>
<label>Keyword query <textarea name="q" rows="4">${this.escapeHtml(filters.q || "")}</textarea></label>
<label>Feed limit <input name="limit" inputmode="numeric" value="${this.escapeHtml(filters.limit || "")}" placeholder="${this.escapeHtml(this.lastConfig?.feedLimit || 12)}"></label>
<div class="actions">
<button type="submit">Apply filters</button>
</div>
</form>
<form class="reset-form" method="post" action="/${this.name}/xmonitor-control/reset"><button class="secondary" type="submit">Reset</button></form>
</main>
</body>
</html>`;
	},

	themeOptions() {
		return [
			"Governance / strategy",
			"Privacy / freedom narrative",
			"Market / price",
			"Product / ecosystem",
			"Community / memes"
		];
	},

	debateOptions() {
		return [
			"ZSA direction",
			"Governance legitimacy",
			"Execution readiness"
		];
	},

	escapeHtml(value) {
		return String(value || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	},

	safeError(error) {
		if (error?.name === "AbortError") return "request timed out";
		return error?.message || "request failed";
	}
});
