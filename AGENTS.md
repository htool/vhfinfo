# AGENTS.md

## Cursor Cloud specific instructions

VHFinfo is a maritime VHF-channel dataset (`data/*.json` GeoJSON) plus two consumers:

- **Map website** (`website/`): a static Leaflet map (`website/map.html`, `website/index.html`) plus the Nearby list at `website/nearby.html` (legacy `website/info.html` is a query-preserving redirect). It has no build step and pulls its GeoJSON at runtime from `https://raw.githubusercontent.com/htool/vhfinfo/main/data/...` (needs outbound internet), not from the local `data/` dir.
- **SignalK plugin** (`plugin/index.js`): the npm package itself (`main` in `package.json`). It runs inside an external SignalK server host and exposes `/plugins/vhfinfo/nearby` + `/plugins/vhfinfo/options`.

### Live site deploy (non-obvious)

https://vhfinfo.org is Apache on Strato. The docroot is the **contents** of `website/` (`index.html` at `/`, not `/website/`).

**Every time files under `website/` change, SFTP those changed pages/assets to the live docroot** with the same relative paths (`website/index.html` → `/index.html`, `website/nearby.html` → `/nearby.html`, `website/info.js` → `/info.js`, images/fonts/`HELP.md` likewise). Upload only what changed unless a full sync is clearly needed.

- SFTP only (no SSH shell): `stu175515244@52922741.ssh.w1.strato.hosting:22`
- Do **not** use `stu24273589` or `stu475512247` — those are the wrong jails and do not map to vhfinfo.org.
- Never commit SFTP passwords, Supabase service-role keys, or other secrets. Use env secrets `STRATO_SFTP_PASSWORD` or `VHFINFO_SFTP_PASSWORD` (copy into `SSHPASS` for `sshpass -e`).
- OpenSSH may warn about RSA host-key signatures; `sshpass` / `expect` work.

Example (password already in `SSHPASS`):

```bash
sshpass -e sftp -oPubKeyAuthentication=no \
  -oPreferredAuthentications=password \
  -oHostKeyAlgorithms=+ssh-rsa \
  -P 22 stu175515244@52922741.ssh.w1.strato.hosting
```

Then `put localfile remotefile` for each changed path. Verify with `curl -I https://vhfinfo.org/` and the specific URLs you uploaded.

### Setup / run notes (non-obvious)

- `npm install` is the only dependency step; there is **no build and no test suite**. The only npm script is `format` (Prettier). Running `npm install` may re-sync `package-lock.json` to `package.json` (version/pins) — that lockfile churn is unrelated to your change; discard it unless intended.
- **Lint** = Prettier with repo-specific flags: `npx prettier --check --no-semi --single-quote 'plugin/*'`. The committed `plugin/index.js` does **not** currently match this style, so `--check` reports a warning by design. `npm run format` rewrites files in place — only run it if you intend to reformat.
- **Serve the map website** as static files, e.g. `python3 -m http.server 8080` from inside `website/`, then open `http://localhost:8080/map.html`. VHF polygons only load at **zoom ≥ 6** while the map is centered over a country that has data. Jump straight to a dense area with the `mapPosition` URL param, which is **slash-separated** `lat/lon/zoom` (not comma), e.g. `http://localhost:8080/map.html?mapPosition=51.95/4.05/11` (Rotterdam). Clicking a polygon opens a popup with name/callsign/channel/type.
- **Map page layout:** `map.html` uses the same `site-header` / `site.css` / `site.js` nav as Home and Nearby. Leaflet lives in `.map-shell` *below* that header (not under it). Splitview JS still sets `#map` / `#panel` heights as percentages — those percentages are of `.map-shell`, not the full viewport. After changing the header height, call `m.invalidateSize()`.
- **Popup vs map bottom info blocks:** `vhfFeatureInfo.buildInfoTable` is only the Leaflet popup table. The map’s `#panel` bottom blocks (`#nearby_0` / `#nearby_1`, shown when splitview is on) and the Nearby page cards share `vhfFeatureInfo.fillInfoBlock` / `infoBlockElement`: huge channel, `TYPE ▶ MODE ▶ INSIDE|Nm`, callname-or-name, note, phone/url icons. Distance is `Math.round` meters; negative (point in polygon) renders as `INSIDE`. Do not put the popup table on Nearby cards, and do not fork a second block layout.
- **Editor sign-in:** email magic-link only. Google was not used and is not offered.
- **Run the SignalK plugin end-to-end without a full SignalK server**: `signalk-server` is the external host and is *not* a dependency of this repo (it has heavy native deps), so it is intentionally not in the update script. To exercise the real plugin code with only this repo's deps, load `plugin/index.js` with a mock `app` that implements `app.streambundle.getSelfStream(path).forEach(cb)`, `app.handleMessage`, `app.debug`, `app.error`, and `app.config.configPath`. The plugin reads data from `path.join(app.config.configPath, "node_modules/vhfinfo/data/")`, so point `configPath` at a dir containing `node_modules/vhfinfo` → this repo (a symlink works). Emit a `navigation.position` (`{longitude, latitude}`) value, then wait ~11s: the plugin only loads features into memory **10s after start** and recomputes nearby features every 5s. Read results by calling the captured `/nearby` router handler. Providing no heading makes the search omnidirectional (bbox); with a heading it uses a directional beam (`options.angle` / `options.distance`). When running inside a real SignalK server, install this package into the server's config dir (`<configdir>/node_modules/vhfinfo`) and feed it a position via a data connection or a stream delta.
