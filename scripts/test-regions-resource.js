#!/usr/bin/env node
const assert = require("assert")
const turf = require("@turf/turf")
const regions = require("../plugin/regions")

const ship = [5.3, 52.64]
const beamMeters = 4000
const stamp = "2026-09-15T12:00:00.000Z"
const meta = { timestamp: stamp, $source: "vhfinfo" }

const nearLock = turf.circle([5.31, 52.641], 0.2, {
  units: "kilometers",
  properties: {
    id: "lock-near",
    name: "Near lock",
    type: "lock",
    channel: "22",
    callname: "Lock",
    vhfdata: { generic: { mode: "announce", note: "Call on approach" } },
  },
})
const farVts = turf.circle([4.5, 52.0], 5, {
  units: "kilometers",
  properties: {
    id: "vts-far",
    name: "Far VTS",
    type: "vts",
    channel: "14",
    vhfdata: { generic: { mode: "listen" } },
  },
})
const noId = turf.circle([5.3, 52.64], 0.1, {
  units: "kilometers",
  properties: { name: "no-id", type: "marina" },
})

const mapped = regions.featureToRegion(nearLock, meta)
assert.equal(mapped.id, "lock-near")
assert.equal(mapped.name, "Near lock")
assert.equal(mapped.description, "Call on approach")
assert.equal(mapped.feature.geometry.type, "Polygon")
assert.equal(mapped.feature.properties.type, "lock")
assert.equal(mapped.feature.properties.channel, "22")
assert.equal(mapped.$source, "vhfinfo")
assert.ok(!("distance" in mapped), "catalog region has no live distance")

const bbox = regions.bboxFromBeam(ship[0], ship[1], beamMeters)
assert.ok(bbox[0] < ship[0] && bbox[2] > ship[0], "beam bbox spans east-west")
assert.ok(bbox[1] < ship[1] && bbox[3] > ship[1], "beam bbox spans north-south")
const widthM = turf.distance([bbox[0], ship[1]], [bbox[2], ship[1]], {
  units: "meters",
})
const heightM = turf.distance([ship[0], bbox[1]], [ship[0], bbox[3]], {
  units: "meters",
})
assert.ok(
  Math.abs(widthM - 2 * beamMeters) / (2 * beamMeters) < 0.02,
  "bbox edge is 2× beam length (east-west)",
)
assert.ok(
  Math.abs(heightM - 2 * beamMeters) / (2 * beamMeters) < 0.02,
  "bbox edge is 2× beam length (north-south)",
)

const listed = regions.listRegions([nearLock, farVts, noId], {}, {
  position: ship,
  beamMeters: beamMeters,
  timestamp: stamp,
  $source: "vhfinfo",
})
assert.deepStrictEqual(Object.keys(listed).sort(), ["lock-near"])
assert.equal(listed["lock-near"].name, "Near lock")
assert.ok(!listed["vts-far"], "far VTS is outside the search-beam bbox")
assert.ok(!listed["no-id"], "features without id are omitted")

const empty = regions.listRegions([nearLock, farVts], {}, { beamMeters: beamMeters })
assert.deepStrictEqual(empty, {}, "no position and no bbox → empty catalog")

const byBbox = regions.listRegions([nearLock, farVts], { bbox: [4.3, 51.8, 4.8, 52.2] }, {
  timestamp: stamp,
  $source: "vhfinfo",
})
assert.deepStrictEqual(Object.keys(byBbox).sort(), ["vts-far"])

const limited = regions.listRegions([nearLock, farVts], { bbox: [-10, 40, 20, 70], limit: 1 }, meta)
assert.equal(Object.keys(limited).length, 1)

const one = regions.getRegion([nearLock, farVts], "lock-near", null, meta)
assert.equal(one.name, "Near lock")
const channel = regions.getRegion(
  [nearLock],
  "lock-near",
  "feature.properties.channel",
  meta,
)
assert.equal(channel.value, "22")
assert.equal(regions.getRegion([nearLock], "missing", null, meta), null)

console.log("regions resource mapping: ok")
