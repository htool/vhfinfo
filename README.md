# VHFinfoSite

Source for [vhfinfo.org](https://vhfinfo.org): the map, nearby list, and editor.

Maritime VHF GeoJSON and the SignalK plugin live in
[`htool/vhfinfo`](https://github.com/htool/vhfinfo). This repo is the website
only. Publishing an area writes Supabase, then this repo pushes the updated
`data/{CC}.json` file into `htool/vhfinfo`.

## Local

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080/map.html?mapPosition=51.95/4.05/11`.

## Deploy

The live docroot is the **root of this repo** (`index.html` at `/`). After a
change, SFTP the changed files to the Strato jail for vhfinfo.org. See
`AGENTS.md`.

## Data sync

Map publish → `public.vhf_features` → `sync-git.php` → this repo’s
`Push VHF data to vhfinfo` Action with that country code → commit
`data/{CC}.json` on `htool/vhfinfo`. There is no timer.

The Action needs repo secret `VHFINFO_DATA_PUSH_TOKEN` (a PAT that can push
to `htool/vhfinfo`). Live `sync-git.token` is a PAT that can dispatch this
repo; do not commit it. Manual catch-up: Actions → Run workflow.
