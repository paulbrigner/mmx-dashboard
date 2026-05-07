# MMX Dashboard

MMX is a MagicMirror dashboard module and sample configuration for an X Monitor
read API. It renders a dedicated display with:

- latest rolling 2-hour summary
- recent signal feed
- window metrics and activity trend
- theme mix and debate intensity
- a local controls page for filters and section toggles

This repository is intentionally separate from any private family dashboard or
personal MagicMirror setup. Bring your own X Monitor API endpoint.

## Quick Start

Install MagicMirror first, then copy this repository into that MagicMirror
checkout:

```sh
git clone https://github.com/MagicMirrorOrg/MagicMirror.git MagicMirror
cd MagicMirror
npm install
git clone https://github.com/paulbrigner/mmx-dashboard.git ../mmx-dashboard
../mmx-dashboard/scripts/install-into-magicmirror.sh "$PWD"
cp config/config.xmonitor.env.example config/config.xmonitor.env
```

Edit `config/config.xmonitor.env` and set:

```sh
XMONITOR_MM_API_BASE_URL=https://your-api.example.com/v1
```

Run the dashboard in browser/server mode:

```sh
scripts/start-xmonitor-dashboard.sh --server-only
```

Open:

```text
http://localhost:8091
http://localhost:8091/MMM-XMonitor/xmonitor-control
```

For a dedicated display:

```sh
scripts/start-xmonitor-dashboard.sh --list-displays
scripts/start-xmonitor-dashboard.sh --display 1
```

## API Contract

`MMM-XMonitor` reads these endpoints under `XMONITOR_MM_API_BASE_URL`:

- `GET /feed`
- `GET /trends`
- `GET /window-summaries/latest`

The module expects JSON shaped like the current X Monitor read API. See
[docs/api-contract.md](docs/api-contract.md) for the fields used by the UI.

## Docs

- [Setup](docs/setup.md)
- [Teammate setup](docs/teammate-setup.md)
- [Configuration](docs/configuration.md)
- [API contract](docs/api-contract.md)
- [Security notes](docs/security.md)

## Local Controls

The controls page is local to the MagicMirror server:

```text
http://localhost:8091/MMM-XMonitor/xmonitor-control
```

It can adjust filters and toggle these dashboard sections at runtime:

- Summary
- Window metrics + activity trend
- Theme mix + debate intensity

Runtime changes reset when MagicMirror restarts. Persistent defaults belong in
`config/config.xmonitor.env`.

## Security

Keep `XMONITOR_MM_ADDRESS=127.0.0.1` unless you intentionally want LAN access.
If your read API requires a key, set `SECRET_XMONITOR_MM_API_KEY` in
`config/config.xmonitor.env`; the node helper sends it server-side.

Do not commit `config/config.xmonitor.env`.

## License Options

All code in this workspace is licensed under either of:

- Apache License, Version 2.0 (see `LICENSE-APACHE` or <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT license (see `LICENSE-MIT` or <http://opensource.org/licenses/MIT>)

at your option.
