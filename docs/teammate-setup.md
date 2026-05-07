# Teammate Setup

This is the shortest path for someone who already has the MMX repository URL
and private X Monitor API settings.

## Commands

```sh
git clone https://github.com/MagicMirrorOrg/MagicMirror.git MagicMirror
cd MagicMirror
npm install
cd ..
git clone https://github.com/paulbrigner/mmx-dashboard.git mmx-dashboard
mmx-dashboard/scripts/install-into-magicmirror.sh MagicMirror
cd MagicMirror
cp config/config.xmonitor.env.example config/config.xmonitor.env
```

Edit `config/config.xmonitor.env` with the private API values supplied to you:

```sh
XMONITOR_MM_API_BASE_URL=
XMONITOR_MM_FEED_PATH=
XMONITOR_MM_TRENDS_PATH=
XMONITOR_MM_SUMMARIES_PATH=
```

Run it:

```sh
scripts/start-xmonitor-dashboard.sh --server-only
```

Open:

```text
http://localhost:8091
http://localhost:8091/MMM-XMonitor/xmonitor-control
```

For a second monitor:

```sh
scripts/start-xmonitor-dashboard.sh --list-displays
scripts/start-xmonitor-dashboard.sh --display 1
```

## Notes

- Control-page changes are temporary and reset when MagicMirror restarts.
- Persistent defaults go in `config/config.xmonitor.env`.
- Keep `XMONITOR_MM_ADDRESS=127.0.0.1` unless LAN access is deliberate.
- Do not share `config/config.xmonitor.env` publicly.
