# AGENTS

Durable instructions for future Codex sessions in this repository:

- This is the public, standalone MMX dashboard project.
- Keep it separate from private family-dashboard or personal MagicMirror repos.
- Do not commit real X Monitor API endpoints, API keys, cookies, account IDs,
  private handles, local paths, screenshots with private data, or AWS details.
- Keep `XMONITOR_MM_API_BASE_URL` configurable and blank in committed examples.
- Preserve MagicMirror compatibility; this repo provides a MagicMirror module,
  sample config, and helper scripts rather than replacing MagicMirror.
- Keep module code under `modules/MMM-XMonitor/`.
- Keep teammate/user instructions in `README.md` and `docs/`.
- Prefer local server-side fetching through `node_helper.js` for API keys or
  other non-browser-visible settings.
