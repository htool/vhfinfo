# AGENTS.md

## Cursor Cloud specific instructions

This repository is **only the vhfinfo.org website**. GeoJSON + the SignalK
plugin stay in [`htool/vhfinfo`](https://github.com/htool/vhfinfo).

The live map reads Supabase `public.vhf_features` first (`features-db.js`).
GitHub `htool/vhfinfo` `data/{CC}.json` is the fallback. Country outlines and
12 Nm files still come from that data repo.

### Live site deploy

https://vhfinfo.org is Apache on Strato. The docroot is this repo’s root.

**Every time site files change, SFTP them to the live docroot** with the same
relative paths (`index.html` → `/index.html`, `nearby.html` → `/nearby.html`).

- SFTP only: `stu175515244@52922741.ssh.w1.strato.hosting:22`
- Do **not** use `stu24273589` or `stu475512247`
- Never commit SFTP passwords, Supabase service-role keys, or `sync-git.token`

### Data push into htool/vhfinfo

On map publish, `features-db.js` asks `sync-git.php` to dispatch this repo.
The Action checks out `htool/vhfinfo`, runs
`node scripts/sync-vhf-to-git.js --country CC`, and **pushes** the country
file. Secret `VHFINFO_DATA_PUSH_TOKEN` must be able to write `htool/vhfinfo`.

Direct REST/SQL upserts still get the 15-minute scheduled push as a backup.

### Run / test

- Serve with `python3 -m http.server 8080` from the repo root.
- `node scripts/test-features-db.js` and `node scripts/test-sync-vhf-to-git.js`
- There is no website build step.
- Editor sign-in is email magic-link only.
