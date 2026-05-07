#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

usage() {
  cat <<'EOF'
Usage:
  scripts/start-xmonitor-dashboard.sh
  scripts/start-xmonitor-dashboard.sh --server-only
  scripts/start-xmonitor-dashboard.sh --display 1
  scripts/start-xmonitor-dashboard.sh --display 1 --debug-layout
  scripts/start-xmonitor-dashboard.sh --list-displays

Options:
  --server-only     Start only the MagicMirror web server.
  --display N       Open Electron on display index N from --list-displays.
  --debug-layout    Show temporary outlines around MagicMirror regions and modules.
  --list-displays   Print Electron display indexes and exit.
EOF
}

DISPLAY_INDEX=""
DEBUG_LAYOUT=false
LIST_DISPLAYS=false
SERVER_ONLY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --display)
      shift
      if [[ $# -eq 0 ]]; then
        echo "Missing display index after --display."
        usage
        exit 64
      fi
      DISPLAY_INDEX="$1"
      ;;
    --display=*)
      DISPLAY_INDEX="${1#--display=}"
      ;;
    --debug-layout)
      DEBUG_LAYOUT=true
      ;;
    --list-displays)
      LIST_DISPLAYS=true
      ;;
    --server-only)
      SERVER_ONLY=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 64
      ;;
  esac
  shift
done

export MM_CONFIG_FILE="config/config.xmonitor.js"
export XMONITOR_MM_PORT="${XMONITOR_MM_PORT:-8091}"

if [[ "${DEBUG_LAYOUT}" == "true" ]]; then
  export MM_CUSTOMCSS_FILE="config/custom-debug.css"
  echo "Layout debug outlines: on"
fi

echo "Starting X Monitor MagicMirror dashboard with ${MM_CONFIG_FILE}..."
echo "Local URL: http://localhost:${XMONITOR_MM_PORT}"
echo "Controls:  http://localhost:${XMONITOR_MM_PORT}/MMM-XMonitor/xmonitor-control"

if [[ "${LIST_DISPLAYS}" == "true" ]]; then
  echo "Available Electron displays:"
  ./node_modules/.bin/electron scripts/electron-display-info.cjs
  exit 0
fi

if lsof -tiTCP:"${XMONITOR_MM_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port ${XMONITOR_MM_PORT} is already in use."
  exit 1
fi

if [[ "${SERVER_ONLY}" == "true" ]]; then
  node --run server
  exit 0
fi

if [[ "$(uname -s)" == "Darwin" ]]; then
  if [[ -n "${DISPLAY_INDEX}" && ! "${DISPLAY_INDEX}" =~ ^[0-9]+$ ]]; then
    echo "Display index must be a non-negative integer."
    usage
    exit 64
  fi

  if [[ -n "${DISPLAY_INDEX}" ]]; then
    DISPLAY_BOUNDS="$(./node_modules/.bin/electron scripts/electron-display-info.cjs | awk -v display_index="${DISPLAY_INDEX}" '$1 == display_index ":" { for (i = 1; i <= NF; i++) print $i }')"
    if [[ -z "${DISPLAY_BOUNDS}" ]]; then
      echo "No Electron display found for index ${DISPLAY_INDEX}."
      echo "Run scripts/start-xmonitor-dashboard.sh --list-displays to see available indexes."
      exit 1
    fi

    while IFS= read -r token; do
      case "${token}" in
        x=*) export MM_ELECTRON_X="${token#x=}" ;;
        y=*) export MM_ELECTRON_Y="${token#y=}" ;;
        width=*) export MM_ELECTRON_WIDTH="${token#width=}" ;;
        height=*) export MM_ELECTRON_HEIGHT="${token#height=}" ;;
      esac
    done <<< "${DISPLAY_BOUNDS}"

    echo "Targeting Electron display ${DISPLAY_INDEX}: x=${MM_ELECTRON_X} y=${MM_ELECTRON_Y} width=${MM_ELECTRON_WIDTH} height=${MM_ELECTRON_HEIGHT}"
  fi

  ./node_modules/.bin/electron js/electron.js
else
  node --run start
fi
