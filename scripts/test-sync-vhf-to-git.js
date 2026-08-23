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

const shuffled = {
  type: "Feature",
  geometry: { coordinates: [1, 2], type: "Point" },
  properties: {
    vhfdata: {
      cargo: { url: "https://ex", mode: "listen" },
      generic: { mode: "listen", note: "n" },
    },
    name: "A",
    id: a.properties.id,
    type: "vts",
    channel: "16",
  },
}
assert.ok(
  sync.sameCollection(
    { type: "FeatureCollection", features: [shuffled] },
    {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            id: a.properties.id,
            name: "A",
            type: "vts",
            channel: "16",
            vhfdata: {
              generic: { mode: "listen", note: "n" },
              cargo: { mode: "listen", url: "https://ex" },
            },
          },
          geometry: { type: "Point", coordinates: [1, 2] },
        },
      ],
    }
  )
)
const stableText = sync.stringifyCollection(
  sync.toFeatureCollection([shuffled])
)
const parsed = JSON.parse(stableText)
assert.deepStrictEqual(Object.keys(parsed.features[0].properties), [
  "id",
  "name",
  "type",
  "channel",
  "vhfdata",
])
assert.deepStrictEqual(Object.keys(parsed.features[0].properties.vhfdata), [
  "generic",
  "cargo",
])
assert.deepStrictEqual(
  Object.keys(parsed.features[0].properties.vhfdata.cargo),
  ["mode", "url"]
)
assert.deepStrictEqual(Object.keys(parsed.features[0]), [
  "type",
  "properties",
  "geometry",
])
const renamed = {
  type: "Feature",
  properties: Object.assign({}, shuffled.properties, { name: "B" }),
  geometry: shuffled.geometry,
}
assert.ok(
  !sync.sameCollection(
    { type: "FeatureCollection", features: [shuffled] },
    { type: "FeatureCollection", features: [renamed] }
  )
)

console.log("sync-vhf-to-git unit tests ok")
