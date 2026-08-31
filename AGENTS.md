# AGENTS.md

## Cursor Cloud specific instructions

This repository is the maritime VHF GeoJSON dataset (`data/*.json`) and the
SignalK plugin (`plugin/index.js`). The vhfinfo.org website lives in
[`htool/VHFinfoSite`](https://github.com/htool/VHFinfoSite).

- **Map / Nearby / editor**: do not add site files here. Change
  [htool/VHFinfoSite](https://github.com/htool/VHFinfoSite) and SFTP from that
  repo’s root (docroot = repo root). Live jail:
  `stu175515244@52922741.ssh.w1.strato.hosting:22`. Do **not** use
  `stu24273589` or `stu475512247`. The Cursor GitHub App must be installed on
  `htool/VHFinfoSite` or agents cannot push there.
- **SignalK plugin** (`plugin/index.js`): npm `main`. It runs inside an
  external SignalK server and exposes `/plugins/vhfinfo/nearby` +
  `/plugins/vhfinfo/options`.
- Live map reads Supabase `public.vhf_features` first. GitHub
  `data/{CC}.json` in **this** repo is the fallback (and what the plugin
  reads). Country outlines / 12 Nm files stay here.

### Data sync

`scripts/sync-vhf-to-git.js` writes `data/{CC}.json` from the table. The
15-minute Action `.github/workflows/sync-vhf-from-db.yml` is a backup.
On-save updates are dispatched from VHFinfoSite (`sync-git.php` → Action
that checks out this repo and **pushes**). Do not delete VTS / lock /
marina polygons or existing Norwegian `Kystradio Arbeidskanal` areas.

`.github/workflows/npm-publish-geojson.yml` patch-bumps and `npm publish`es
at most once per UTC day when `data/{CC}.json` (or `*_12Nm.json` /
`countries_bbox.json`) or `plugin/` changed since the last npm release.
Auth is npm trusted publishing (OIDC), not a token. On npmjs.com → `vhfinfo` →
Settings → Trusted Publisher → GitHub Actions, set org `htool`, repo
`vhfinfo`, workflow `npm-publish-geojson.yml`, allow `npm publish`.
Dry-run locally: `npm run check:npm-geojson-publish`.

### Setup / run notes (non-obvious)

- `npm install` is the only dependency step; there is **no website build**.
  The npm `format` script is Prettier on `plugin/*`.
- **Lint** = Prettier: `npx prettier --check --no-semi --single-quote 'plugin/*'`.
  The committed `plugin/index.js` does **not** currently match this style, so
  `--check` reports a warning by design. `npm run format` rewrites files —
  only run it if you intend to reformat.
- **Tests:** `node scripts/test-features-db.js` and
  `node scripts/test-sync-vhf-to-git.js`. `npm run sync:vhf:dry-run` compares
  git `data/` to the live table (drift is possible; do not commit a country
  overwrite unless that is the intent).
- **Run the SignalK plugin end-to-end without a full SignalK server**:
  `signalk-server` is the external host and is *not* a dependency of this
  repo. Load `plugin/index.js` with a mock `app` that implements
  `app.streambundle.getSelfStream(path).forEach(cb)`, `app.handleMessage`,
  `app.debug`, `app.error`, and `app.config.configPath`. The plugin reads
  `path.join(app.config.configPath, "node_modules/vhfinfo/data/")`, so point
  `configPath` at a dir containing `node_modules/vhfinfo` → this repo (a
  symlink works). Emit a `navigation.position` (`{longitude, latitude}`),
  then wait ~11s: features load **10s after start** and recompute every 5s.
  Read results via the captured `/nearby` handler. No heading = omnidirectional
  bbox; with a heading it uses `options.angle` / `options.distance`.
