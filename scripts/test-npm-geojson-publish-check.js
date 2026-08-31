#!/usr/bin/env node
const assert = require("assert")
const check = require("./npm-geojson-publish-check.js")

assert.strictEqual(check.isPublishableGeoJson("data/NLD.json"), true)
assert.strictEqual(check.isPublishableGeoJson("data/NLD_12Nm.json"), true)
assert.strictEqual(check.isPublishableGeoJson("data/countries_bbox.json"), true)
assert.strictEqual(check.isPublishableGeoJson("data/NLD_map.json"), false)
assert.strictEqual(check.isPublishableGeoJson("data/countries.json"), false)
assert.strictEqual(check.isPublishableGeoJson("plugin/index.js"), false)
assert.strictEqual(check.isPublishableGeoJson("data/nested/NLD.json"), false)
assert.strictEqual(check.isPublishablePlugin("plugin/index.js"), true)
assert.strictEqual(check.isPublishablePlugin("plugin/foo.js"), true)
assert.strictEqual(check.isPublishablePlugin("data/NLD.json"), false)
assert.strictEqual(check.isPublishablePath("plugin/index.js"), true)
assert.strictEqual(check.isPublishablePath("data/NLD.json"), true)
assert.strictEqual(check.isPublishablePath("README.md"), false)

assert.strictEqual(check.bumpPatch("0.0.37"), "0.0.38")
assert.strictEqual(check.nextPublishVersion("0.0.37", "0.0.37"), "0.0.38")
assert.strictEqual(check.nextPublishVersion("0.0.37", "0.0.38"), "0.0.39")
assert.strictEqual(check.nextPublishVersion("0.0.40", "0.0.38"), "0.0.41")

const noon = new Date("2026-08-25T12:00:00.000Z")
assert.strictEqual(
  check.alreadyPublishedToday("2026-08-25T01:00:00.000Z", noon),
  true
)
assert.strictEqual(
  check.alreadyPublishedToday("2026-08-24T23:59:59.000Z", noon),
  false
)

const skipToday = check.shouldPublish({
  now: noon,
  lastPublishTime: "2026-08-25T06:00:00.000Z",
  changedFiles: ["data/NLD.json", "plugin/index.js"],
})
assert.strictEqual(skipToday.publish, false)
assert.strictEqual(skipToday.reason, "already published today")

const skipNoChange = check.shouldPublish({
  now: noon,
  lastPublishTime: "2026-08-24T16:00:00.000Z",
  changedFiles: ["data/NLD_map.json", "README.md"],
})
assert.strictEqual(skipNoChange.publish, false)
assert.strictEqual(
  skipNoChange.reason,
  "no GeoJSON or plugin updates since last publish"
)

const publishGeo = check.shouldPublish({
  now: noon,
  lastPublishTime: "2026-03-30T16:21:25.000Z",
  changedFiles: ["data/NLD.json", "data/NLD_map.json", "data/DEU_12Nm.json"],
})
assert.strictEqual(publishGeo.publish, true)
assert.strictEqual(publishGeo.reason, "GeoJSON updated since last publish")
assert.deepStrictEqual(publishGeo.files, ["data/NLD.json", "data/DEU_12Nm.json"])

const publishPlugin = check.shouldPublish({
  now: noon,
  lastPublishTime: "2026-03-30T16:21:25.000Z",
  changedFiles: ["plugin/index.js", "README.md"],
})
assert.strictEqual(publishPlugin.publish, true)
assert.strictEqual(publishPlugin.reason, "plugin updated since last publish")
assert.deepStrictEqual(publishPlugin.files, ["plugin/index.js"])

const publishBoth = check.shouldPublish({
  now: noon,
  lastPublishTime: "2026-03-30T16:21:25.000Z",
  changedFiles: ["data/BEL.json", "plugin/index.js"],
})
assert.strictEqual(publishBoth.publish, true)
assert.strictEqual(
  publishBoth.reason,
  "GeoJSON and plugin updated since last publish"
)

const forced = check.shouldPublish({
  force: true,
  now: noon,
  lastPublishTime: "2026-08-25T06:00:00.000Z",
  changedFiles: [],
})
assert.strictEqual(forced.publish, true)
assert.strictEqual(forced.reason, "forced")

const decided = check.decide({
  force: false,
  now: noon,
  localVersion: "0.0.37",
  npmRelease: { version: "0.0.37", time: "2026-03-30T16:21:25.000Z" },
  changedFiles: ["plugin/index.js"],
})
assert.strictEqual(decided.publish, true)
assert.strictEqual(decided.nextVersion, "0.0.38")
assert.strictEqual(decided.npmVersion, "0.0.37")

console.log("npm-geojson-publish-check tests ok")
