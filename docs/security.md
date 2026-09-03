# Security Notes

MMX is a display client. It does not authenticate users by itself.

## Local Dashboard Access

The sample config binds MagicMirror to localhost:

```sh
XMONITOR_MM_ADDRESS=127.0.0.1
```

Keep that setting unless you intentionally want other LAN devices to access the
dashboard and controls page.

For direct access from a trusted LAN, bind to all interfaces and allow only the
LAN range plus loopback addresses:

```sh
XMONITOR_MM_ADDRESS=0.0.0.0
XMONITOR_MM_IP_WHITELIST=127.0.0.1,::ffff:127.0.0.1,::1,192.168.1.0/24
```

An empty whitelist permits every client that can reach the server. Do not expose
port `8091` directly to the public internet.

## Read-Client Credentials

Give this server-side installation its own read-only client identity:

```sh
XMONITOR_MM_READ_CLIENT_ID=
SECRET_XMONITOR_MM_READ_CLIENT_SECRET=
```

The values are read by `node_helper.js` and sent as `x-xmonitor-client-id` and
`x-xmonitor-client-secret`. Do not put the secret in browser-visible module
options or grant this dashboard ingest or administration capabilities.

## Local Controls

The controls page is intended for local dashboard operation. It includes safe
display actions such as refresh and reload, but it does not provide host-level
shutdown, update, or restart controls.

## Public Repositories

Do not commit:

- `config/config.xmonitor.env`
- private API URLs or path settings
- API keys or cookies
- screenshots containing private posts or internal handles
- AWS account IDs, ARNs, or operational details

## Cost Controls

If you make a backing API public, protect it with rate limits, logging, alarms,
and budget alerts. CORS is not an abuse-control mechanism.
