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
console.log("sync-vhf-to-git unit tests ok")
