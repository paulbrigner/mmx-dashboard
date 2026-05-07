/* X Monitor MagicMirror config.
 *
 * Copy this file to config/config.xmonitor.js inside a MagicMirror checkout.
 * Runtime values are loaded from config/config.xmonitor.env by MagicMirror.
 */

const runtimeEnv = typeof process !== "undefined" && process.env ? process.env : {};
const envValue = (name, fallback = "") => {
  const value = runtimeEnv[name];
  return value === undefined || value === null || String(value).trim() === "" ? fallback : String(value).trim();
};
const csv = (name) => envValue(name)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const optionalNumber = (name) => {
  const parsed = Number(envValue(name));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const xmonitorFilters = {
  significant: envValue("XMONITOR_MM_SIGNIFICANT", "true"),
  trendRange: envValue("XMONITOR_MM_TREND_RANGE", "24h"),
  tiers: csv("XMONITOR_MM_TIERS"),
  themes: csv("XMONITOR_MM_THEMES"),
  debateIssues: csv("XMONITOR_MM_DEBATE_ISSUES"),
  handle: envValue("XMONITOR_MM_HANDLES"),
  location: envValue("XMONITOR_MM_LOCATION"),
  q: envValue("XMONITOR_MM_QUERY"),
  since: envValue("XMONITOR_MM_SINCE"),
  until: envValue("XMONITOR_MM_UNTIL"),
  min_followers: optionalNumber("XMONITOR_MM_MIN_FOLLOWERS"),
  max_followers: optionalNumber("XMONITOR_MM_MAX_FOLLOWERS"),
  min_account_age_days: optionalNumber("XMONITOR_MM_MIN_ACCOUNT_AGE_DAYS"),
  max_account_age_days: optionalNumber("XMONITOR_MM_MAX_ACCOUNT_AGE_DAYS")
};

const tickerStocks = [
  { name: "ZEC", symbol: "ZEC-USD" },
  { name: "ZCSH", symbol: "ZCSH" },
  { name: "CYPH", symbol: "CYPH" },
  { name: "BTC", symbol: "BTC-USD" }
];

const electronBounds = ["X", "Y", "WIDTH", "HEIGHT"].reduce((bounds, key) => {
  const value = Number(runtimeEnv[`MM_ELECTRON_${key}`]);
  if (Number.isFinite(value)) {
    bounds[key.toLowerCase()] = value;
  }
  return bounds;
}, {});

let config = {
  address: envValue("XMONITOR_MM_ADDRESS", "127.0.0.1"),
  port: Number(envValue("XMONITOR_MM_PORT", "8091")),
  basePath: "/",
  ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"],

  useHttps: false,
  httpsPrivateKey: "",
  httpsCertificate: "",

  language: "en",
  locale: "en-US",
  logLevel: ["WARN", "ERROR"],
  timeFormat: 12,
  units: "imperial",
  hideConfigSecrets: true,
  customCss: "config/custom.css",
  electronOptions: electronBounds,

  modules: [
    {
      module: "alert"
    },
    {
      module: "MMM-Jast",
      position: "top_bar",
      config: {
        displayMode: "horizontal",
        fadeSpeedInSeconds: 60,
        updateIntervalInSeconds: 120,
        maxWidth: "100%",
        showColors: true,
        showCurrency: true,
        showChangePercent: true,
        showChangeValue: false,
        showLastUpdate: true,
        numberDecimalsValues: 2,
        numberDecimalsPercentages: 1,
        stocks: tickerStocks
      }
    },
    {
      module: "updatenotification",
      position: "top_bar"
    },
    {
      module: "MMM-XMonitor",
      position: "fullscreen_below",
      classes: "mmx-dashboard-module",
      config: {
        mode: "xmonitor",
        title: envValue("XMONITOR_MM_TITLE", "X Monitor"),
        apiBaseUrl: envValue("XMONITOR_MM_API_BASE_URL"),
        feedPath: envValue("XMONITOR_MM_FEED_PATH"),
        trendsPath: envValue("XMONITOR_MM_TRENDS_PATH"),
        summariesPath: envValue("XMONITOR_MM_SUMMARIES_PATH"),
        apiKeyEnvVar: "SECRET_XMONITOR_MM_API_KEY",
        enableLocalControls: envValue("XMONITOR_MM_LOCAL_CONTROLS", "true") !== "false",
        feedLimit: Number(envValue("XMONITOR_MM_FEED_LIMIT", "14")),
        feedOnlyMaxFeedItems: Number(envValue("XMONITOR_MM_FEED_ONLY_MAX_FEED_ITEMS", "18")),
        filters: xmonitorFilters,
        maxFeedItems: Number(envValue("XMONITOR_MM_MAX_FEED_ITEMS", "14")),
        refreshInterval: Number(envValue("XMONITOR_MM_REFRESH_INTERVAL_MS", String(2 * 60 * 1000))),
        requestTimeoutMs: Number(envValue("XMONITOR_MM_REQUEST_TIMEOUT_MS", "12000")),
        summaryWindowType: "rolling_2h",
        trendRange: envValue("XMONITOR_MM_TREND_RANGE", "24h")
      }
    }
  ]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") { module.exports = config; }
