#!/usr/bin/env node
const assert = require("assert")
const deltas = require("../plugin/deltas")

const lock = {
  id: "lock-near",
  name: "Near lock",
  type: "lock",
  channel: "22",
  callname: "Lock",
  distance: -12,
  relativeBearing: 90,
  vhfdata: { generic: { mode: "announce", note: "Call on approach" } },
}
const vts = {
  id: "vts-1",
  name: "VTS",
  type: "vts",
  channel: "14",
  distance: 800,
  relativeBearing: 0,
  vhfdata: { generic: { mode: "listen" } },
}

const hit = deltas.compactHit(lock)
assert.equal(hit.id, "lock-near")
assert.equal(hit.distance, -12)
assert.ok(Math.abs(hit.bearing - Math.PI / 2) < 1e-10, "90° → π/2 rad")
assert.deepStrictEqual(Object.keys(hit).sort(), ["bearing", "distance", "id"])
assert.equal(deltas.compactHit({ name: "no-id", distance: 1 }), null)

const list = deltas.compactList([lock, vts, { name: "skip" }])
assert.equal(list.length, 2)
assert.equal(list[1].bearing, 0)

const updates = deltas.buildUpdates([lock, vts], {
  path: "vhfdata.nearest",
  pathNr: 5,
  types: { lock: true, vts: true },
})
const byPath = {}
updates.forEach(function (row) {
  byPath[row.path] = row.value
})

assert.deepStrictEqual(byPath[deltas.COMPACT_PATH], list)
assert.equal(typeof byPath["vhfdata.nearest.lock"], "string")
assert.equal(JSON.parse(byPath["vhfdata.nearest.lock"]).channel, "22")
assert.equal(JSON.parse(byPath["vhfdata.nearest.vts"]).id, "vts-1")
assert.equal(byPath["vhfdata.nearest.marina"], null)
assert.equal(byPath["vhfdata.nearest.information"], null)
assert.equal(JSON.parse(byPath["vhfdata.nearest.0"]).id, "lock-near")
assert.equal(JSON.parse(byPath["vhfdata.nearest.1"]).id, "vts-1")
assert.equal(byPath["vhfdata.nearest.2"], null)
assert.equal(byPath["vhfdata.nearest.4"], null)

updates.forEach(function (row) {
  assert.ok(
    !/\.(name|channel|distance|relativeBearing|vhfdata)(\.|$)/.test(row.path),
    "no exploded leaf path: " + row.path,
  )
})

const compactOnly = deltas.buildUpdates([lock], {})
assert.equal(compactOnly.length, 1)
assert.equal(compactOnly[0].path, "vhfinfo.nearby")

const radar = deltas.buildUpdates(
  [{ id: "r1", type: "vts radar support", distance: 50, relativeBearing: 10 }],
  { path: "vhfdata.nearest", pathNr: 1, types: {} },
)
const radarPath = {}
radar.forEach(function (row) {
  radarPath[row.path] = row.value
})
assert.equal(JSON.parse(radarPath["vhfdata.nearest.vtsradar"]).id, "r1")
assert.equal(radarPath["vhfdata.nearest.vts"], null)

console.log("compact deltas: ok")
