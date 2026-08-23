#!/usr/bin/env node
const assert = require("assert")
const db = require("../lib/features-db.js")

const userId = "11111111-1111-4111-8111-111111111111"
const addId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const changeId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
const deleteId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc"

const changes = {
  [addId]: {
    name: "Test marina",
    action: "Add",
    type: "marina",
    feature: {
      type: "Feature",
      properties: {
        id: addId,
        name: "Test marina",
        type: "marina",
        channel: 16,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [4.0, 52.0],
            [4.1, 52.0],
            [4.1, 52.1],
            [4.0, 52.0],
          ],
        ],
      },
    },
  },
  [changeId]: {
    name: "Changed lock",
    action: "Change",
    type: "lock",
    feature: {
      type: "Feature",
      properties: {
        id: changeId,
        name: "Changed lock",
        type: "lock",
        channel: "12/16",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [4.2, 52.0],
            [4.3, 52.0],
            [4.3, 52.1],
            [4.2, 52.0],
          ],
        ],
      },
    },
  },
  [deleteId]: { name: "Gone", action: "Delete", type: "bridge" },
  "dddddddd-dddd-4ddd-8ddd-dddddddddddd": {
    name: "Missing geometry",
    action: "Change",
    type: "vts",
  },
}

const ops = db.changesToDbOps("NLD", changes, userId)
assert.strictEqual(ops.upserts.length, 2)
assert.strictEqual(ops.deletes.length, 1)
assert.deepStrictEqual(ops.deletes, [deleteId])
assert.strictEqual(ops.skipped.length, 1)

const addRow = ops.upserts.find((row) => row.id === addId)
assert.strictEqual(addRow.country, "NLD")
assert.strictEqual(addRow.channel, "16")
assert.strictEqual(addRow.created_by, userId)
assert.strictEqual(addRow.updated_by, userId)
assert.strictEqual(addRow.geometry.type, "Polygon")

const changeRow = ops.upserts.find((row) => row.id === changeId)
assert.strictEqual(changeRow.channel, "12/16")
assert.strictEqual(changeRow.created_by, undefined)
assert.strictEqual(changeRow.updated_by, userId)

const rebuilt = db.rowsToFeatures([
  {
    id: addId,
    country: "NLD",
    name: "Test marina",
    type: "marina",
    channel: "16",
    properties: { id: addId, name: "Test marina", type: "marina", channel: 16 },
    geometry: addRow.geometry,
  },
])
assert.strictEqual(rebuilt.length, 1)
assert.strictEqual(rebuilt[0].properties.id, addId)
assert.strictEqual(rebuilt[0].properties.channel, 16)
assert.strictEqual(rebuilt[0].geometry.type, "Polygon")
assert.strictEqual(db.rowsToFeatures([{ id: addId, properties: {} }]).length, 0)

const fs = require("fs")
const path = require("path")
const src = fs.readFileSync(
  path.join(__dirname, "..", "lib", "supabase-config.js"),
  "utf8"
)
const supabaseUrl = (src.match(/url:\s*"([^"]+)"/) || [])[1]
const anonKey = (src.match(/anonKey:\s*"([^"]+)"/) || [])[1]

const mockCalls = []
const mockClient = {
  from: function (table) {
    assert.strictEqual(table, "vhf_features")
    return {
      upsert: function (rows, opts) {
        mockCalls.push({ op: "upsert", rows: rows, opts: opts })
        return Promise.resolve({ error: null })
      },
      delete: function () {
        return {
          in: function (col, ids) {
            mockCalls.push({ op: "delete", col: col, ids: ids })
            return Promise.resolve({ error: null })
          },
        }
      },
    }
  },
}

db.publishFeaturesToDb("NLD", changes, {
  client: mockClient,
  user: { id: userId },
})
  .then(function (result) {
    assert.strictEqual(result.ok, true)
    assert.strictEqual(result.upserts, 2)
    assert.strictEqual(result.deletes, 1)
    assert.strictEqual(mockCalls[0].op, "upsert")
    assert.strictEqual(mockCalls[1].op, "delete")
    return db.fetchCountryFeatures("NLD", {
      url: supabaseUrl,
      anonKey: anonKey,
    })
  })
  .then(function (features) {
    assert.ok(features.length >= 200, "expected NLD areas from the database")
    var scheveningen = features.find(function (f) {
      return f.properties && f.properties.id === "549b42cd-e7ed-40e8-b38a-6adf49f629c8"
    })
    assert.ok(scheveningen, "Jachtclub Scheveningen should be in the DB copy")
    assert.strictEqual(scheveningen.properties.name, "Jachtclub Scheveningen")
    assert.strictEqual(scheveningen.geometry.type, "Polygon")
    console.log("features-db unit tests ok")
    console.log("NLD from database: " + features.length + " areas")
  })
  .catch(function (err) {
    console.error(err)
    process.exit(1)
  })
