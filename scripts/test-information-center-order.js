#!/usr/bin/env node
const assert = require("assert")
const turf = require("@turf/turf")

function distanceToCenterNm(ship, feature) {
  const center = turf.centroid(feature)
  return turf.distance(ship, center, { units: "nauticalmiles" })
}

function orderInformationalInside(ship, features) {
  return features
    .filter(function (feature) {
      return turf.booleanPointInPolygon(ship, feature)
    })
    .sort(function (a, b) {
      return distanceToCenterNm(ship, a) - distanceToCenterNm(ship, b)
    })
    .map(function (feature) {
      return feature.properties.name
    })
}

const ship = turf.point([11.9, 57.7])
const near = turf.circle([11.95, 57.72], 11, {
  units: "nauticalmiles",
  properties: { name: "near-info", type: "information" },
})
const far = turf.circle([12.4, 57.9], 22, {
  units: "nauticalmiles",
  properties: { name: "far-info", type: "information" },
})
const outside = turf.circle([10.0, 56.0], 11, {
  units: "nauticalmiles",
  properties: { name: "outside-info", type: "information" },
})

assert.ok(turf.booleanPointInPolygon(ship, near), "ship is inside the near coverage")
assert.ok(turf.booleanPointInPolygon(ship, far), "ship is inside the far coverage")
assert.ok(
  !turf.booleanPointInPolygon(ship, outside),
  "ship is outside the distant coverage"
)
assert.ok(
  distanceToCenterNm(ship, near) < distanceToCenterNm(ship, far),
  "near information centre is closer than far information centre"
)
assert.deepStrictEqual(orderInformationalInside(ship, [far, outside, near]), [
  "near-info",
  "far-info",
])

console.log("information inside + center order: ok")
