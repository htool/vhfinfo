#!/usr/bin/env node
const assert = require("assert")
const mfd = require("../public/mfd")

const lock = {
  id: "lock-near",
  name: "Near lock",
  type: "lock",
  channel: "22",
  distance: -12,
  vhfdata: { generic: { mode: "announce" } },
}
const compact = { id: "lock-near", distance: -8, bearing: 0.5 }
const catalog = mfd.catalogFromList([lock])

assert.equal(mfd.needsCatalog([compact], {}), true)
assert.equal(mfd.needsCatalog([compact], catalog), false)
assert.equal(mfd.mergeHit(compact, catalog).channel, "22")
assert.equal(mfd.mergeHit(compact, catalog).distance, -8)
assert.equal(mfd.mergeHit(lock, catalog).name, "Near lock")
assert.deepStrictEqual(mfd.slotsForDisplay([lock, lock, lock], 2).length, 2)
assert.equal(mfd.displayMode(lock), "ANNOUNCE")
assert.equal(mfd.displayMode({}), "")

assert.equal(mfd.formatDistance(-39), "INSIDE")
assert.equal(mfd.formatDistance(39), "39m")
assert.equal(mfd.formatDistance(1852), "1852m")
assert.equal(mfd.formatDistance(1853), "1.0 Nm")
assert.equal(mfd.formatDistance(2000), "1.1 Nm")
assert.equal(mfd.formatDistance(null), "")

assert.equal(mfd.typeLabel("vts radar support"), "VTS RADAR")
assert.equal(mfd.displayName({ callname: "Harbour", name: "Marina X" }), "Harbour")
assert.equal(mfd.displayName({ name: "Marina X" }), "Marina X")
assert.equal(mfd.channelText({ channel: "71/72,73" }), "71 72 73")

const marina = {
  id: "marina-in",
  name: "Jachthaven",
  type: "marina",
  channel: "31",
  distance: -39,
  vhfdata: { pleasure: { mode: "call", note: "Visitors on 31" } },
}
assert.equal(
  mfd.typeLine(marina),
  "MARINA \u25B8 CALL \u25B8 INSIDE"
)
assert.equal(mfd.pickBlockNote(marina), "Visitors on 31")

const radar = {
  id: "radar",
  type: "vts radar support",
  distance: -10,
  name: "Radar",
}
const vts = { id: "vts", type: "vts", distance: -20, name: "VTS" }
const zone = { id: "nm", type: "territorial", distance: -2000, name: "12Nm" }
const farLock = { id: "lock-far", type: "lock", distance: 400, name: "Far" }
const ranked = mfd.slotsForDisplay([radar, vts, zone, farLock], 8)
assert.deepStrictEqual(
  ranked.map(function (item) {
    return item.id
  }),
  ["vts", "radar", "lock-far"]
)
assert.equal(mfd.MAX_RESULTS, 8)

assert.equal(
  mfd.useNearbyLayout({
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    cssGrid: true,
    search: "",
  }),
  true,
)
assert.equal(
  mfd.useNearbyLayout({
    ua: "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko",
    cssGrid: false,
    search: "",
  }),
  false,
)
assert.equal(
  mfd.useNearbyLayout({
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    cssGrid: true,
    search: "?layout=mfd",
  }),
  false,
)
assert.equal(
  mfd.useNearbyLayout({
    ua: "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2)",
    cssGrid: true,
    search: "?layout=nearby",
  }),
  true,
)
assert.equal(
  mfd.isMfdBrowser({ ua: "Navico GO12 Chrome/49.0" }),
  true,
)
assert.equal(
  mfd.useNearbyLayout({
    ua: "Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0.0.0",
    cssGrid: true,
    search: "",
  }),
  false,
)

console.log("mfd nearby merge: ok")
