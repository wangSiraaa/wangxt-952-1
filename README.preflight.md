# Trae Preflight

This folder is prepared for `wangxt-952-1`.

Use `.env` for stable local ports and compose project identity:

- APP_PORT: 18252
- API_PORT: 19252
- WEB_PORT: 20252
- DB_PORT: 21252
- REDIS_PORT: 22252

Smoke entry:

```bash
bash scripts/smoke.sh
```

The preflight files are environment scaffolding only. The generated business
project can replace or extend them when needed.
