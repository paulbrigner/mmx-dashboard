Module.register("MMM-XMonitor", {
	defaults: {
		animationSpeed: 1000,
		apiBaseUrl: "",
		apiKeyEnvVar: "",
		apiKeyHeader: "x-api-key",
		enableLocalControls: false,
		feedLimit: 12,
		feedOnlyMaxFeedItems: 18,
		filters: {},
		displaySections: {
			summary: true,
			metricsActivity: true,
			themeDebate: true
		},
		maxActivityBuckets: 28,
		maxFeedItems: 7,
		maxSummaryCharacters: 520,
		message: "X Monitor dashboard placeholder",
		mode: "message",
		refreshInterval: 2 * 60 * 1000,
		summaryWindowType: "rolling_2h",
		title: "X Monitor",
		trendRange: "24h"
	},

	getStyles() {
		return ["MMM-XMonitor.css"];
	},

	start() {
		if (this.config.mode !== "xmonitor") return;

		this.status = "loading";
		this.error = null;
		this.errors = [];
		this.payload = null;
		this.lastUpdated = null;
		this.activeFilters = this.config.filters || {};
		this.fetchXMonitor();
		this.scheduleUpdate();
	},

	scheduleUpdate() {
		const interval = Math.max(Number(this.config.refreshInterval) || this.defaults.refreshInterval, 60 * 1000);
		this.updateTimer = setInterval(() => this.fetchXMonitor(), interval);
	},

	fetchXMonitor() {
		this.sendSocketNotification("XMONITOR_DASHBOARD_FETCH", {
			identifier: this.identifier,
			config: this.config
		});
	},

	socketNotificationReceived(notification, payload) {
		if (this.config.mode !== "xmonitor") return;

		if (notification === "XMONITOR_DASHBOARD_FILTERS_UPDATED") {
			this.status = "loading";
			this.activeFilters = payload?.filters || this.activeFilters;
			this.updateDom(this.config.animationSpeed);
			this.fetchXMonitor();
			return;
		}

		if (notification !== "XMONITOR_DASHBOARD_RESULT" || payload.identifier !== this.identifier) {
			return;
		}

		this.status = payload.status;
		this.error = payload.error || null;
		this.errors = payload.errors || [];
		this.payload = payload.payload || null;
		this.lastUpdated = payload.fetchedAt || null;
		this.activeFilters = payload.filters || this.activeFilters;
		this.updateDom(this.config.animationSpeed);
	},

	getDom() {
		if (this.config.mode === "xmonitor") {
			return this.getXMonitorDom();
		}

		const wrapper = document.createElement("div");
		wrapper.className = "mmx-dashboard-message";
		wrapper.textContent = this.config.message;
		return wrapper;
	},

	getXMonitorDom() {
		const wrapper = document.createElement("div");
		wrapper.className = "mmx-dashboard-message mmx-dashboard";

		if (this.status === "loading" && !this.payload) {
			return this.renderState(wrapper, "Loading X Monitor");
		}

		if (this.status === "setup") {
			return this.renderState(wrapper, this.error || "Set X Monitor API base URL");
		}

		if (this.status === "error" && !this.payload) {
			return this.renderState(wrapper, this.error || "X Monitor unavailable");
		}

		const payload = this.payload || {};
		const effectiveFilters = this.activeFilters || payload.filters || {};
		const displaySections = this.resolveDisplaySections(effectiveFilters);
		const feedOnly = this.isFeedOnly(displaySections);
		if (feedOnly) wrapper.classList.add("xmonitor-feed-only");
		wrapper.appendChild(this.renderHeader(payload, effectiveFilters));

		const main = document.createElement("div");
		main.className = "xmonitor-layout";
		if (feedOnly) main.classList.add("xmonitor-layout-feed-only");

		const left = document.createElement("section");
		left.className = "xmonitor-column xmonitor-column-primary";
		if (displaySections.summary) {
			left.appendChild(this.renderSummary(payload.summaries || []));
		} else {
			main.classList.add("xmonitor-layout-summary-hidden");
		}
		left.appendChild(this.renderFeed(payload.feed?.items || [], { feedOnly }));

		const right = document.createElement("section");
		right.className = "xmonitor-column xmonitor-column-secondary";
		if (displaySections.metricsActivity) {
			right.appendChild(this.renderStats(payload.trends));
			right.appendChild(this.renderActivity(payload.trends));
		}
		if (displaySections.themeDebate) {
			right.appendChild(this.renderThemeTrends(payload.trends));
			right.appendChild(this.renderDebateTrends(payload.trends));
		}

		main.appendChild(left);
		if (right.children.length > 0) {
			main.appendChild(right);
		} else {
			main.classList.add("xmonitor-layout-single");
		}
		wrapper.appendChild(main);

		if (this.errors.length > 0) {
			const notice = document.createElement("div");
			notice.className = "xmonitor-footer-warning";
			notice.textContent = this.errors.join(" | ");
			wrapper.appendChild(notice);
		}

		return wrapper;
	},

	isFeedOnly(displaySections) {
		return !displaySections.summary && !displaySections.metricsActivity && !displaySections.themeDebate;
	},

	resolveDisplaySections(filters) {
		const defaults = {
			summary: true,
			metricsActivity: true,
			themeDebate: true
		};
		const configured = this.config.displaySections || {};
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

	renderState(wrapper, message) {
		const state = document.createElement("div");
		state.className = "xmonitor-state";
		state.textContent = message;
		wrapper.appendChild(state);
		return wrapper;
	},

	renderHeader(payload, filtersOverride) {
		const header = document.createElement("header");
		header.className = "xmonitor-header";

		const titleGroup = document.createElement("div");
		titleGroup.className = "xmonitor-title-group";

		const eyebrow = document.createElement("div");
		eyebrow.className = "xmonitor-eyebrow";
		eyebrow.textContent = "X Monitor Dashboard";
		titleGroup.appendChild(eyebrow);

		const title = document.createElement("h1");
		title.textContent = this.config.title || "X Monitor";
		titleGroup.appendChild(title);

		const meta = document.createElement("div");
		meta.className = "xmonitor-meta";
		meta.textContent = this.buildHeaderMeta(payload);
		titleGroup.appendChild(meta);
		header.appendChild(titleGroup);

		const filters = this.renderFilterChips(filtersOverride || payload.filters || this.activeFilters || {});
		header.appendChild(filters);

		return header;
	},

	buildHeaderMeta(payload) {
		const parts = [];
		if (this.lastUpdated) parts.push(`Updated ${this.formatTime(this.lastUpdated)}`);
		if (payload?.trends?.scope?.range_key) parts.push(`Range ${String(payload.trends.scope.range_key).toUpperCase()}`);
		if (this.status === "partial") parts.push("Partial data");
		return parts.join(" | ");
	},

	renderFilterChips(filters) {
		const wrap = document.createElement("div");
		wrap.className = "xmonitor-filter-chips";
		const chips = this.filterChips(filters);

		if (chips.length === 0) {
			const chip = document.createElement("span");
			chip.className = "xmonitor-chip";
			chip.textContent = "All captured posts";
			wrap.appendChild(chip);
			return wrap;
		}

		for (const chipText of chips.slice(0, 8)) {
			const chip = document.createElement("span");
			chip.className = "xmonitor-chip";
			chip.textContent = chipText;
			wrap.appendChild(chip);
		}

		return wrap;
	},

	filterChips(filters) {
		const chips = [];
		const add = (label, value) => {
			if (Array.isArray(value) && value.length > 0) {
				chips.push(`${label}: ${value.join(", ")}`);
			} else if (value !== undefined && value !== null && String(value).trim()) {
				chips.push(`${label}: ${String(value).trim()}`);
			}
		};

		add("Significant", filters.significant || "true");
		add("Tier", filters.tiers || filters.tier);
		add("Theme", filters.themes || filters.theme);
		add("Debate", filters.debateIssues || filters.debate_issue);
		add("Handles", filters.handle || filters.handles);
		add("Location", filters.location);
		add("Search", filters.q);
		add("Followers", this.rangeText(filters.min_followers, filters.max_followers));
		return chips.filter((chip) => !chip.endsWith(": any") && !chip.endsWith(": either"));
	},

	rangeText(min, max) {
		if (min && max) return `${min}-${max}`;
		if (min) return `>${min}`;
		if (max) return `<${max}`;
		return "";
	},

	renderSummary(summaries) {
		const section = this.panel("Latest 2-hour summary", "xmonitor-summary-panel");
		const summary = summaries.find((item) => item.window_type === this.config.summaryWindowType) || summaries[0];

		if (!summary) {
			section.appendChild(this.emptyText("No rolling summary is available yet."));
			return section;
		}

		const meta = document.createElement("div");
		meta.className = "xmonitor-section-meta";
		meta.textContent = `${this.formatDateTime(summary.window_start)} to ${this.formatDateTime(summary.window_end)} | ${this.formatNumber(summary.post_count)} posts | ${this.formatNumber(summary.significant_count)} significant`;
		section.appendChild(meta);

		const text = document.createElement("p");
		text.className = "xmonitor-summary-text";
		text.textContent = this.truncate(summary.summary_text || "", this.config.maxSummaryCharacters);
		section.appendChild(text);

		return section;
	},

	renderFeed(items, options = {}) {
		const section = this.panel("Recent signal", "xmonitor-feed-panel");
		if (items.length === 0) {
			section.appendChild(this.emptyText("No posts match the current filter."));
			return section;
		}

		const list = document.createElement("div");
		list.className = "xmonitor-feed-list";
		const maxItems = options.feedOnly
			? Number(this.config.feedOnlyMaxFeedItems) || this.defaults.feedOnlyMaxFeedItems
			: Number(this.config.maxFeedItems) || this.defaults.maxFeedItems;
		for (const item of items.slice(0, maxItems)) {
			list.appendChild(this.renderFeedItem(item));
		}
		section.appendChild(list);
		return section;
	},

	renderFeedItem(item) {
		const article = document.createElement("article");
		article.className = "xmonitor-feed-item";

		const top = document.createElement("div");
		top.className = "xmonitor-feed-item-top";

		const author = document.createElement("span");
		author.className = "xmonitor-author";
		author.textContent = `@${item.author_handle || "unknown"}`;
		top.appendChild(author);

		const meta = document.createElement("span");
		meta.className = "xmonitor-feed-meta";
		meta.textContent = [
			item.watch_tier || "other",
			this.formatRelativeTime(item.discovered_at),
			item.is_significant ? "significant" : item.classification_status || "pending"
		].filter(Boolean).join(" | ");
		top.appendChild(meta);
		article.appendChild(top);

		const body = document.createElement("div");
		body.className = "xmonitor-feed-body";
		body.textContent = this.truncate(item.body_text || "", 230);
		article.appendChild(body);

		const metrics = document.createElement("div");
		metrics.className = "xmonitor-feed-metrics";
		metrics.textContent = [
			`${this.formatNumber(item.likes)} likes`,
			`${this.formatNumber(item.reposts)} reposts`,
			`${this.formatNumber(item.replies)} replies`,
			`${this.formatNumber(item.views)} views`
		].join(" | ");
		article.appendChild(metrics);

		return article;
	},

	renderStats(trends) {
		const section = this.panel("Window metrics", "xmonitor-stats-panel");
		const totals = trends?.activity?.totals;
		if (!totals) {
			section.appendChild(this.emptyText("Trend metrics are unavailable."));
			return section;
		}

		const grid = document.createElement("div");
		grid.className = "xmonitor-stat-grid";
		const cards = [
			["Posts", totals.post_count],
			["Significant", totals.significant_count],
			["Watchlist", totals.watchlist_count],
			["Unique handles", totals.unique_handle_count]
		];

		for (const [label, value] of cards) {
			const card = document.createElement("div");
			card.className = "xmonitor-stat-card";
			const number = document.createElement("div");
			number.className = "xmonitor-stat-value";
			number.textContent = this.formatNumber(value);
			const text = document.createElement("div");
			text.className = "xmonitor-stat-label";
			text.textContent = label;
			card.appendChild(number);
			card.appendChild(text);
			grid.appendChild(card);
		}
		section.appendChild(grid);
		return section;
	},

	renderActivity(trends) {
		const section = this.panel("Activity trend", "xmonitor-activity-panel");
		const buckets = trends?.activity?.buckets || [];
		if (buckets.length === 0) {
			section.appendChild(this.emptyText("No activity buckets are available."));
			return section;
		}

		const compressed = this.compressBuckets(buckets, Number(this.config.maxActivityBuckets) || 28);
		const maxPosts = Math.max(1, ...compressed.map((bucket) => Number(bucket.post_count || 0)));
		const chart = document.createElement("div");
		chart.className = "xmonitor-activity-chart";
		chart.style.gridTemplateColumns = `repeat(${compressed.length}, minmax(0, 1fr))`;

		for (const bucket of compressed) {
			const col = document.createElement("div");
			col.className = "xmonitor-activity-col";

			const bar = document.createElement("span");
			bar.className = "xmonitor-activity-bar";
			bar.style.height = `${Math.max(8, Math.round((Number(bucket.post_count || 0) / maxPosts) * 100))}%`;
			bar.title = `${this.formatDateTime(bucket.bucket_start)} | ${this.formatNumber(bucket.post_count)} posts | ${this.formatNumber(bucket.significant_count)} significant`;
			col.appendChild(bar);
			chart.appendChild(col);
		}

		section.appendChild(chart);
		return section;
	},

	renderThemeTrends(trends) {
		const section = this.panel("Theme mix", "xmonitor-theme-panel");
		const themeMix = trends?.summary?.theme_mix;
		const totals = this.sumMixTotals(themeMix?.labels || [], themeMix?.buckets || []);
		const rows = Object.entries(totals)
			.filter(([, value]) => value > 0)
			.sort((left, right) => right[1] - left[1])
			.slice(0, 5);

		if (rows.length === 0) {
			section.appendChild(this.emptyText("No summary theme coverage yet."));
			return section;
		}

		section.appendChild(this.renderRankedBars(rows));
		return section;
	},

	renderDebateTrends(trends) {
		const section = this.panel("Debate intensity", "xmonitor-debate-panel");
		const debate = trends?.summary?.debate_trends;
		const totals = this.sumDebateTotals(debate?.labels || [], debate?.buckets || []);
		const rows = Object.entries(totals)
			.filter(([, value]) => value.mentions > 0)
			.sort((left, right) => right[1].mentions - left[1].mentions)
			.slice(0, 4)
			.map(([label, value]) => [label, value.mentions, `${this.formatNumber(value.pro)} pro | ${this.formatNumber(value.contra)} contra`]);

		if (rows.length === 0) {
			section.appendChild(this.emptyText("No tracked debate topics are active."));
			return section;
		}

		section.appendChild(this.renderRankedBars(rows));
		return section;
	},

	renderRankedBars(rows) {
		const wrap = document.createElement("div");
		wrap.className = "xmonitor-ranked-bars";
		const max = Math.max(1, ...rows.map((row) => Number(row[1] || 0)));

		for (const row of rows) {
			const item = document.createElement("div");
			item.className = "xmonitor-ranked-row";

			const label = document.createElement("div");
			label.className = "xmonitor-ranked-label";
			label.textContent = row[0];
			item.appendChild(label);

			const track = document.createElement("div");
			track.className = "xmonitor-ranked-track";
			const bar = document.createElement("span");
			bar.className = "xmonitor-ranked-fill";
			bar.style.width = `${Math.max(8, Math.round((Number(row[1] || 0) / max) * 100))}%`;
			track.appendChild(bar);
			item.appendChild(track);

			const value = document.createElement("div");
			value.className = "xmonitor-ranked-value";
			value.textContent = row[2] || this.formatNumber(row[1]);
			item.appendChild(value);
			wrap.appendChild(item);
		}

		return wrap;
	},

	panel(title, className) {
		const section = document.createElement("section");
		section.className = `xmonitor-panel ${className || ""}`;
		const heading = document.createElement("h2");
		heading.textContent = title;
		section.appendChild(heading);
		return section;
	},

	emptyText(message) {
		const text = document.createElement("p");
		text.className = "xmonitor-empty";
		text.textContent = message;
		return text;
	},

	compressBuckets(buckets, maxBuckets) {
		if (buckets.length <= maxBuckets) return buckets;
		const groupSize = Math.ceil(buckets.length / maxBuckets);
		const compressed = [];
		for (let start = 0; start < buckets.length; start += groupSize) {
			const slice = buckets.slice(start, start + groupSize);
			const first = slice[0];
			const last = slice[slice.length - 1];
			compressed.push({
				bucket_start: first.bucket_start,
				bucket_end: last.bucket_end,
				post_count: slice.reduce((sum, item) => sum + Number(item.post_count || 0), 0),
				significant_count: slice.reduce((sum, item) => sum + Number(item.significant_count || 0), 0)
			});
		}
		return compressed;
	},

	sumMixTotals(labels, buckets) {
		const totals = {};
		for (const label of labels) totals[label] = 0;
		for (const bucket of buckets) {
			for (const label of labels) {
				totals[label] += Number(bucket.counts?.[label] || 0);
			}
		}
		return totals;
	},

	sumDebateTotals(labels, buckets) {
		const totals = {};
		for (const label of labels) totals[label] = { mentions: 0, pro: 0, contra: 0 };
		for (const bucket of buckets) {
			for (const label of labels) {
				const issue = bucket.issues?.[label] || {};
				totals[label].mentions += Number(issue.mentions || 0);
				totals[label].pro += Number(issue.pro || 0);
				totals[label].contra += Number(issue.contra || 0);
			}
		}
		return totals;
	},

	truncate(value, maxLength) {
		const text = String(value || "").replace(/\s+/g, " ").trim();
		const limit = Math.max(80, Number(maxLength) || 240);
		return text.length > limit ? `${text.slice(0, limit - 3).trim()}...` : text;
	},

	formatNumber(value) {
		return new Intl.NumberFormat(this.config.locale || config.locale || "en-US").format(Number(value || 0));
	},

	formatTime(value) {
		const date = new Date(value);
		if (!Number.isFinite(date.getTime())) return "";
		return new Intl.DateTimeFormat(this.config.locale || config.locale || "en-US", {
			hour: "numeric",
			minute: "2-digit"
		}).format(date);
	},

	formatDateTime(value) {
		const date = new Date(value);
		if (!Number.isFinite(date.getTime())) return "";
		return new Intl.DateTimeFormat(this.config.locale || config.locale || "en-US", {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit"
		}).format(date);
	},

	formatRelativeTime(value) {
		const date = new Date(value);
		if (!Number.isFinite(date.getTime())) return "";
		const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
		if (diffMinutes < 60) return `${diffMinutes}m ago`;
		const hours = Math.round(diffMinutes / 60);
		if (hours < 48) return `${hours}h ago`;
		return this.formatDateTime(value);
	}
});
