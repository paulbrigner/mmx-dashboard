# Security Notes

MMX is a display client. It does not authenticate users by itself.

## Local Dashboard Access

The sample config binds MagicMirror to localhost:

```sh
XMONITOR_MM_ADDRESS=127.0.0.1
```

Keep that setting unless you intentionally want other LAN devices to access the
dashboard and controls page.

## API Keys

If your X Monitor read API requires a key, put it in:

```sh
SECRET_XMONITOR_MM_API_KEY=
```

The key is read by `node_helper.js` and sent server-side as `x-api-key`. Do not
put secrets in browser-visible module options.

## Public Repositories

Do not commit:

- `config/config.xmonitor.env`
- real API endpoints if they are private
- API keys or cookies
- screenshots containing private posts or internal handles
- AWS account IDs, ARNs, or operational details

## Cost Controls

If you make the backing X Monitor API public, protect it with rate limits,
logging, alarms, and budget alerts. CORS is not an abuse-control mechanism.
