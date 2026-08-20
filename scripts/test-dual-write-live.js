#!/usr/bin/env node
/**
 * Live check: signed-in RLS can upsert/delete vhf_features (the dual-write path).
 * Does not call commit.vhfinfo.org.
 *
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/test-dual-write-live.js
 */
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const db = require("../website/features-db.js")

const ROOT = path.resolve(__dirname, "..")
const src = fs.readFileSync(path.join(ROOT, "website", "supabase-config.js"), "utf8")
const url = (process.env.SUPABASE_URL || (src.match(/url:\s*"([^"]+)"/) || [])[1] || "").replace(/\/$/, "")
const anonKey = (src.match(/anonKey:\s*"([^"]+)"/) || [])[1]
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const TEST_ID = "e1780000-0000-4000-a000-000000000001"

if (!url || !anonKey) {
  console.error("Missing public Supabase config")
  process.exit(1)
}
if (!serviceKey) {
  console.error("Set SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

function adminHeaders() {
  return {
    apikey: serviceKey,
    Authorization: "Bearer " + serviceKey,
    "Content-Type": "application/json",
  }
}

async function rest(pathname, opts) {
  const res = await fetch(url + pathname, opts)
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch (err) {
    json = { raw: text }
  }
  if (!res.ok) {
    const err = new Error("HTTP " + res.status + " " + pathname + " " + text)
    err.status = res.status
    err.body = json
    throw err
  }
  return json
}

function userRestClient(accessToken) {
  const headers = {
    apikey: anonKey,
    Authorization: "Bearer " + accessToken,
    "Content-Type": "application/json",
  }
  return {
    from: function (table) {
      const base = url + "/rest/v1/" + table
      return {
        upsert: function (rows) {
          return fetch(base, {
            method: "POST",
            headers: Object.assign({}, headers, {
              Prefer: "resolution=merge-duplicates,return=minimal",
            }),
            body: JSON.stringify(rows),
          }).then(async function (res) {
            const text = await res.text()
            if (!res.ok) {
              return { error: { message: text || "HTTP " + res.status } }
            }
            return { error: null }
          })
        },
        delete: function () {
          return {
            in: function (col, ids) {
              return fetch(
                base + "?" + col + "=in.(" + ids.join(",") + ")",
                { method: "DELETE", headers: headers }
              ).then(async function (res) {
                const text = await res.text()
                if (!res.ok) {
                  return { error: { message: text || "HTTP " + res.status } }
                }
                return { error: null }
              })
            },
          }
        },
      }
    },
  }
}

async function countPublic() {
  const res = await fetch(url + "/rest/v1/vhf_features?select=id", {
    headers: {
      apikey: anonKey,
      Authorization: "Bearer " + anonKey,
      Prefer: "count=exact",
      Range: "0-0",
    },
  })
  const range = res.headers.get("content-range") || ""
  const total = range.split("/")[1]
  return total == null ? null : Number(total)
}

async function fetchTestRow() {
  return rest(
    "/rest/v1/vhf_features?id=eq." + TEST_ID + "&select=id,country,name,channel,updated_by",
    {
      headers: {
        apikey: anonKey,
        Authorization: "Bearer " + anonKey,
      },
    }
  )
}

async function main() {
  const before = await countPublic()
  const email =
    "dualwrite-" + Date.now() + "@example.invalid"
  const password = crypto.randomBytes(18).toString("base64url")
  let userId = null

  try {
    const created = await rest("/auth/v1/admin/users", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        email: email,
        password: password,
        email_confirm: true,
      }),
    })
    userId = created.id
    const token = await rest("/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: "Bearer " + anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email, password: password }),
    })
    const access = token.access_token
    if (!access) {
      throw new Error("No access token")
    }

    const changes = {
      [TEST_ID]: {
        name: "Dual-write test marina",
        action: "Add",
        type: "marina",
        feature: {
          type: "Feature",
          properties: {
            id: TEST_ID,
            name: "Dual-write test marina",
            type: "marina",
            channel: 9,
          },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [4.01, 52.01],
                [4.02, 52.01],
                [4.02, 52.02],
                [4.01, 52.01],
              ],
            ],
          },
        },
      },
    }

    const addResult = await db.publishFeaturesToDb("TST", changes, {
      client: userRestClient(access),
      user: { id: userId },
    })
    if (addResult.error) {
      throw new Error("upsert failed: " + addResult.error)
    }

    const rows = await fetchTestRow()
    if (!rows.length || rows[0].name !== "Dual-write test marina") {
      throw new Error("anon SELECT did not see upserted test row")
    }
    if (rows[0].channel !== "9") {
      throw new Error("channel not stored as text: " + rows[0].channel)
    }
    if (rows[0].updated_by !== userId) {
      throw new Error("updated_by mismatch")
    }

    const delChanges = {
      [TEST_ID]: { name: "Dual-write test marina", action: "Delete", type: "marina" },
    }
    const delResult = await db.publishFeaturesToDb("TST", delChanges, {
      client: userRestClient(access),
      user: { id: userId },
    })
    if (delResult.error) {
      throw new Error("delete failed: " + delResult.error)
    }
    const gone = await fetchTestRow()
    if (gone.length) {
      throw new Error("test row still present after delete")
    }

    const after = await countPublic()
    console.log(
      JSON.stringify(
        {
          ok: true,
          publicCountBefore: before,
          publicCountAfter: after,
          signedInWrite: true,
          signedInDelete: true,
          gitApiCalled: false,
        },
        null,
        2
      )
    )
  } finally {
    await fetch(url + "/rest/v1/vhf_features?id=eq." + TEST_ID, {
      method: "DELETE",
      headers: adminHeaders(),
    })
    if (userId) {
      await fetch(url + "/auth/v1/admin/users/" + userId, {
        method: "DELETE",
        headers: adminHeaders(),
      })
    }
  }
}

main().catch(function (err) {
  console.error(err.stack || err.message || err)
  process.exit(1)
})
