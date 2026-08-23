# Sign-in setup

The map editor lives in **[htool/VHFinfoSite](https://github.com/htool/VHFinfoSite)**.
Follow `AUTH_SETUP.md` there.

This repo keeps the public anon URL/key in `lib/supabase-config.js` so
`scripts/sync-vhf-to-git.js` can refresh `data/{CC}.json`.
