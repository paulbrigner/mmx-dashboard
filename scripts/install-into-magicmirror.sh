#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/install-into-magicmirror.sh /path/to/MagicMirror [--force]

Copies MMM-XMonitor, the sample X Monitor config, and helper scripts into an
existing MagicMirror checkout. Existing files are preserved unless --force is
passed.
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 64
fi

MAGICMIRROR_DIR="$1"
FORCE=false
if [[ "${2:-}" == "--force" ]]; then
  FORCE=true
elif [[ $# -gt 1 ]]; then
  echo "Unknown option: $2"
  usage
  exit 64
fi

SOURCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ ! -f "${MAGICMIRROR_DIR}/package.json" || ! -d "${MAGICMIRROR_DIR}/modules" ]]; then
  echo "This does not look like a MagicMirror checkout: ${MAGICMIRROR_DIR}"
  exit 1
fi

copy_file() {
  local source="$1"
  local target="$2"
  if [[ -e "${target}" && "${FORCE}" != "true" ]]; then
    echo "Keeping existing ${target}"
    return
  fi
  mkdir -p "$(dirname "${target}")"
  cp "${source}" "${target}"
  echo "Copied ${target}"
}

MODULE_TARGET="${MAGICMIRROR_DIR}/modules/MMM-XMonitor"
if [[ -e "${MODULE_TARGET}" && "${FORCE}" != "true" ]]; then
  echo "Keeping existing ${MODULE_TARGET}"
else
  rm -rf "${MODULE_TARGET}"
  mkdir -p "${MODULE_TARGET}"
  cp -R "${SOURCE_DIR}/modules/MMM-XMonitor/." "${MODULE_TARGET}/"
  echo "Copied ${MODULE_TARGET}"
fi

copy_file "${SOURCE_DIR}/config/config.xmonitor.js" "${MAGICMIRROR_DIR}/config/config.xmonitor.js"
copy_file "${SOURCE_DIR}/config/config.xmonitor.env.example" "${MAGICMIRROR_DIR}/config/config.xmonitor.env.example"
copy_file "${SOURCE_DIR}/config/custom.css" "${MAGICMIRROR_DIR}/config/custom.css"
copy_file "${SOURCE_DIR}/config/custom-debug.css" "${MAGICMIRROR_DIR}/config/custom-debug.css"
copy_file "${SOURCE_DIR}/scripts/start-xmonitor-dashboard.sh" "${MAGICMIRROR_DIR}/scripts/start-xmonitor-dashboard.sh"
copy_file "${SOURCE_DIR}/scripts/electron-display-info.cjs" "${MAGICMIRROR_DIR}/scripts/electron-display-info.cjs"

chmod +x "${MAGICMIRROR_DIR}/scripts/start-xmonitor-dashboard.sh"
echo
echo "Next:"
echo "  cd ${MAGICMIRROR_DIR}"
echo "  cp config/config.xmonitor.env.example config/config.xmonitor.env"
echo "  edit config/config.xmonitor.env"
echo "  scripts/start-xmonitor-dashboard.sh --server-only"
