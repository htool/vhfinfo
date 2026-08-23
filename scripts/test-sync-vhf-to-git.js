#!/usr/bin/env node
const assert = require("assert")
const sync = require("./sync-vhf-to-git.js")

const a = {
  type: "Feature",
  properties: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "A" },
  geometry: { type: "Point", coordinates: [1, 2] },
}
const b = {
  type: "Feature",
  properties: { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", name: "B" },
  geometry: { type: "Point", coordinates: [3, 4] },
}

const col = sync.toFeatureCollection([b, a])
assert.strictEqual(col.features[0].properties.id, a.properties.id)
assert.strictEqual(col.features[1].properties.id, b.properties.id)
assert.ok(
  sync.sameCollection(col, { type: "FeatureCollection", features: [a, b] })
)
assert.ok(
  !sync.sameCollection(col, { type: "FeatureCollection", features: [a] })
)

const grouped = sync.groupFeatures([
  {
    id: a.properties.id,
    country: "NLD",
    name: "A",
    properties: a.properties,
    geometry: a.geometry,
  },
  {
    id: b.properties.id,
    country: "DEU",
    name: "B",
    properties: b.properties,
    geometry: b.geometry,
  },
])
assert.strictEqual(grouped.NLD.length, 1)
assert.strictEqual(grouped.DEU.length, 1)
assert.ok(sync.stringifyCollection(col).endsWith("\n"))

assert.strictEqual(sync.normalizeCountry("nld"), "NLD")
assert.strictEqual(sync.normalizeCountry("NLD.json"), "")
assert.deepStrictEqual(sync.parseArgs(["node", "sync", "--country", "nld", "--dry-run"]), {
  dryRun: true,
  country: "NLD",
})
assert.ok(
  sync.featuresQueryPath("NLD", 0, 1000).indexOf("country=eq.NLD") !== -1
)
assert.ok(sync.featuresQueryPath("", 0, 1000).indexOf("country=eq.") === -1)

const fs = require("fs")
const os = require("os")
const path = require("path")
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vhf-sync-"))
const nldPrev = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: "old", name: "Old" },
      geometry: { type: "Point", coordinates: [0, 0] },
    },
  ],
}
fs.writeFileSync(path.join(tmp, "NLD.json"), JSON.stringify(nldPrev))
fs.writeFileSync(
  path.join(tmp, "BEL.json"),
  JSON.stringify({ type: "FeatureCollection", features: [] })
)
const oneCountry = sync.syncFiles(
  { NLD: [a], BEL: [b] },
  false,
  { dataDir: tmp, countries: ["NLD"] }
)
assert.strictEqual(oneCountry.changed.length, 1)
assert.strictEqual(oneCountry.changed[0].country, "NLD")
const wroteNld = JSON.parse(fs.readFileSync(path.join(tmp, "NLD.json"), "utf8"))
assert.strictEqual(wroteNld.features[0].properties.id, a.properties.id)
const belUnchanged = JSON.parse(fs.readFileSync(path.join(tmp, "BEL.json"), "utf8"))
assert.strictEqual(belUnchanged.features.length, 0)

console.log("sync-vhf-to-git unit tests ok")
