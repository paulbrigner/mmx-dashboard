# API Contract

`MMM-XMonitor` reads JSON from three endpoints under `XMONITOR_MM_API_BASE_URL`.

## Feed

```text
GET /feed
```

Query parameters may include:

- `limit`
- `significant`
- `handle`
- `location`
- `q`
- `since`
- `until`
- `min_followers`
- `max_followers`
- `min_account_age_days`
- `max_account_age_days`
- repeated `tier`
- repeated `theme`
- repeated `debate_issue`

The UI uses:

```json
{
  "items": [
    {
      "author_handle": "example",
      "body_text": "Post text",
      "watch_tier": "other",
      "discovered_at": "2026-01-01T12:00:00Z",
      "is_significant": true,
      "classification_status": "classified",
      "likes": 0,
      "reposts": 0,
      "replies": 0,
      "views": 0
    }
  ]
}
```

## Trends

```text
GET /trends
```

The UI uses:

```json
{
  "scope": {
    "range_key": "24h"
  },
  "activity": {
    "totals": {
      "post_count": 0,
      "significant_count": 0,
      "watchlist_count": 0,
      "unique_handle_count": 0
    },
    "buckets": [
      {
        "bucket_start": "2026-01-01T12:00:00Z",
        "bucket_end": "2026-01-01T13:00:00Z",
        "post_count": 0,
        "significant_count": 0
      }
    ]
  },
  "summary": {
    "theme_mix": {
      "labels": ["Governance / strategy"],
      "buckets": [
        {
          "counts": {
            "Governance / strategy": 1
          }
        }
      ]
    },
    "debate_trends": {
      "labels": ["Governance legitimacy"],
      "buckets": [
        {
          "issues": {
            "Governance legitimacy": {
              "mentions": 1,
              "pro": 1,
              "contra": 0
            }
          }
        }
      ]
    }
  }
}
```

## Latest Window Summaries

```text
GET /window-summaries/latest
```

The UI accepts either an array payload or an object with `items`.

```json
{
  "items": [
    {
      "window_type": "rolling_2h",
      "window_start": "2026-01-01T10:00:00Z",
      "window_end": "2026-01-01T12:00:00Z",
      "post_count": 0,
      "significant_count": 0,
      "summary_text": "Brief summary."
    }
  ]
}
```
