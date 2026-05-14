# Configuration

Persistent local settings live in `config/config.xmonitor.env` inside the
MagicMirror checkout. The committed `config/config.xmonitor.env.example` is a
safe template and intentionally contains no private API values.

## Required

```sh
XMONITOR_MM_API_BASE_URL=
XMONITOR_MM_FEED_PATH=
XMONITOR_MM_TRENDS_PATH=
XMONITOR_MM_SUMMARIES_PATH=
```

Use the values supplied to you privately.

## Server

```sh
XMONITOR_MM_ADDRESS=127.0.0.1
XMONITOR_MM_PORT=8091
XMONITOR_MM_TITLE=X Monitor
XMONITOR_MM_REFRESH_INTERVAL_MS=120000
XMONITOR_MM_REQUEST_TIMEOUT_MS=12000
XMONITOR_MM_LOCAL_CONTROLS=true
```

Keep `XMONITOR_MM_ADDRESS=127.0.0.1` unless you deliberately want the dashboard
available from other devices on the LAN.

## Feed Display

```sh
XMONITOR_MM_FEED_LIMIT=14
XMONITOR_MM_MAX_FEED_ITEMS=14
XMONITOR_MM_FEED_ONLY_MAX_FEED_ITEMS=18
```

`XMONITOR_MM_FEED_LIMIT` controls the normal API request size.
`XMONITOR_MM_MAX_FEED_ITEMS` controls the normal display cap. When the right-side
dashboard sections are toggled off, the single-column Recent Signal view uses
`XMONITOR_MM_FEED_ONLY_MAX_FEED_ITEMS`.

## Ticker

The default dashboard includes `MMM-Jast` in the top bar with these symbols:

```js
[
  { name: "ZEC", symbol: "ZEC-USD" },
  { name: "ZCSH", symbol: "ZCSH" },
  { name: "CYPH", symbol: "CYPH" },
  { name: "BTC", symbol: "BTC-USD" }
]
```

Ticker defaults live in `config/config.xmonitor.js`. The installer fetches the
pinned upstream `MMM-Jast` release and installs its runtime dependencies.

## Filters

```sh
XMONITOR_MM_SIGNIFICANT=true
XMONITOR_MM_TREND_RANGE=24h
XMONITOR_MM_TIERS=
XMONITOR_MM_THEMES=
XMONITOR_MM_DEBATE_ISSUES=
XMONITOR_MM_HANDLES=
XMONITOR_MM_LOCATION=
XMONITOR_MM_QUERY=
XMONITOR_MM_SINCE=
XMONITOR_MM_UNTIL=
XMONITOR_MM_MIN_FOLLOWERS=
XMONITOR_MM_MAX_FOLLOWERS=
XMONITOR_MM_MIN_ACCOUNT_AGE_DAYS=
XMONITOR_MM_MAX_ACCOUNT_AGE_DAYS=
```

Comma-separate multi-value filters such as tiers, themes, debate issues, and
handles. `XMONITOR_MM_TREND_RANGE` accepts `24h`, `7d`, `30d`, or `90d`.

## Optional API Key

```sh
SECRET_XMONITOR_MM_API_KEY=
```

If set, the node helper sends the value as `x-api-key` when calling the private
API. Because this is server-side, the key is not included in browser module
configuration.

## Local Control Actions

The controls page can open the dashboard, request an immediate data refresh,
reload the dashboard display, show/hide/toggle MagicMirror modules, adjust
display appearance, and show or hide a dashboard alert.

These are dashboard-scoped controls. MMX intentionally does not expose
host-level shutdown, reboot, monitor power, minimize, devtools, install, update,
or persistent config-edit controls.
