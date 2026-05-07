# Setup

MMX is designed to be installed into an existing MagicMirror checkout.

## 1. Install MagicMirror

```sh
git clone https://github.com/MagicMirrorOrg/MagicMirror.git MagicMirror
cd MagicMirror
npm install
```

## 2. Install MMX

Clone this repository next to your MagicMirror checkout, then run the installer:

```sh
cd ..
git clone <this-repo-url> mmx-dashboard
mmx-dashboard/scripts/install-into-magicmirror.sh MagicMirror
```

The installer copies:

- `modules/MMM-XMonitor/`
- `config/config.xmonitor.js`
- `config/config.xmonitor.env.example`
- `config/custom-debug.css`
- `scripts/start-xmonitor-dashboard.sh`
- `scripts/electron-display-info.cjs`

It preserves existing files by default. Pass `--force` only when you intend to
replace an existing MMX install.

## 3. Configure The API

```sh
cd MagicMirror
cp config/config.xmonitor.env.example config/config.xmonitor.env
```

Edit `config/config.xmonitor.env`:

```sh
XMONITOR_MM_API_BASE_URL=https://your-api.example.com/v1
```

## 4. Run In Browser Mode

```sh
scripts/start-xmonitor-dashboard.sh --server-only
```

Open:

```text
http://localhost:8091
http://localhost:8091/MMM-XMonitor/xmonitor-control
```

## 5. Run On A Dedicated Display

```sh
scripts/start-xmonitor-dashboard.sh --list-displays
scripts/start-xmonitor-dashboard.sh --display 1
```

Use the display index that matches your monitor arrangement.
