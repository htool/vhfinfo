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

console.log("mfd nearby merge: ok")
