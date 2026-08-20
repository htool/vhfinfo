#!/usr/bin/env node
/**
 * Write data/{CC}.json FeatureCollections from public.vhf_features.
 *
 * The website map reads the table directly. This keeps the git copy in
 * sync for the SignalK plugin and as a GitHub fallback.
 *
 * Skips *_map.json, *_12Nm.json, countries.json, and countries_bbox.json.
 * Does not call commit.vhfinfo.org.
 *
 * Usage:
 *   node scripts/sync-vhf-to-git.js --dry-run
 *   node scripts/sync-vhf-to-git.js
 */

const fs = require("fs")
const path = require("path")
const db = require("../website/features-db.js")

const ROOT = path.resolve(__dirname, "..")
const DATA_DIR = path.join(ROOT, "data")
const SKIP_FILES = new Set(["countries.json", "countries_bbox.json"])

function parseArgs(argv) {
  const args = { dryRun: false }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--dry-run") args.dryRun = true
    else {
      console.error("Unknown argument: " + a)
      process.exit(2)
    }
  }
  return args
}

function shouldSkipFile(name) {
  if (!name.endsWith(".json")) return true
  if (SKIP_FILES.has(name)) return true
  if (name.endsWith("_map.json") || name.endsWith("_12Nm.json")) return true
  return false
}

function countryFromFilename(name) {
  return name.replace(/\.json$/, "")
}

function readPublicSupabaseConfig() {
  const src = fs.readFileSync(
    path.join(ROOT, "website", "supabase-config.js"),
    "utf8"
  )
  const url = (src.match(/url:\s*"([^"]+)"/) || [])[1]
  const anonKey = (src.match(/anonKey:\s*"([^"]+)"/) || [])[1]
  return { url, anonKey }
}

function featureKey(feature) {
  return JSON.stringify({
    id: feature && feature.properties && feature.properties.id,
    properties: feature && feature.properties,
    geometry: feature && feature.geometry,
  })
}

function sameCollection(a, b) {
  const aa = ((a && a.features) || []).map(featureKey).sort()
  const bb = ((b && b.features) || []).map(featureKey).sort()
  if (aa.length !== bb.length) return false
  for (let i = 0; i < aa.length; i++) {
    if (aa[i] !== bb[i]) return false
  }
  return true
}

function toFeatureCollection(features) {
  const sorted = (features || []).slice().sort(function (a, b) {
    const idA = (a.properties && a.properties.id) || ""
    const idB = (b.properties && b.properties.id) || ""
    return idA < idB ? -1 : idA > idB ? 1 : 0
  })
  return { type: "FeatureCollection", features: sorted }
}

function stringifyCollection(collection) {
  return JSON.stringify(collection, null, 2) + "\n"
}

async function fetchAllRows(url, anonKey) {
  const pageSize = 1000
  const all = []
  let offset = 0
  while (true) {
    const res = await fetch(
      url.replace(/\/$/, "") +
        "/rest/v1/vhf_features?select=id,country,name,type,channel,properties,geometry&order=country,id&limit=" +
        pageSize +
        "&offset=" +
        offset,
      {
        headers: {
          apikey: anonKey,
          Authorization: "Bearer " + anonKey,
        },
      }
    )
    const text = await res.text()
    if (!res.ok) {
      throw new Error("Fetch failed HTTP " + res.status + ": " + text)
    }
    const rows = text ? JSON.parse(text) : []
    if (!Array.isArray(rows)) {
      throw new Error("Unexpected feature response")
    }
    all.push.apply(all, rows)
    if (rows.length < pageSize) break
    offset += pageSize
  }
  return all
}

function groupFeatures(rows) {
  const byCountry = {}
  ;(rows || []).forEach(function (row) {
    if (!row || !row.country) return
    const features = db.rowsToFeatures([row])
    if (!features.length) return
    if (!byCountry[row.country]) byCountry[row.country] = []
    byCountry[row.country].push(features[0])
  })
  return byCountry
}

function existingCountryFiles() {
  return fs
    .readdirSync(DATA_DIR)
    .filter(function (name) {
      return !shouldSkipFile(name)
    })
    .sort()
}

function syncFiles(byCountry, dryRun) {
  const files = existingCountryFiles()
  const known = new Set(
    files.map(function (name) {
      return countryFromFilename(name)
    })
  )
  Object.keys(byCountry).forEach(function (country) {
    if (!known.has(country)) {
      files.push(country + ".json")
      known.add(country)
    }
  })
  files.sort()

  const changed = []
  const unchanged = []
  for (let i = 0; i < files.length; i++) {
    const name = files[i]
    const country = countryFromFilename(name)
    const dest = path.join(DATA_DIR, name)
    const next = toFeatureCollection(byCountry[country] || [])
    let prev = { type: "FeatureCollection", features: [] }
    if (fs.existsSync(dest)) {
      try {
        prev = JSON.parse(fs.readFileSync(dest, "utf8"))
      } catch (err) {
        prev = { type: "FeatureCollection", features: [] }
      }
    }
    if (sameCollection(prev, next)) {
      unchanged.push(country)
      continue
    }
    changed.push({
      country: country,
      before: ((prev && prev.features) || []).length,
      after: next.features.length,
    })
    if (!dryRun) {
      fs.writeFileSync(dest, stringifyCollection(next))
    }
  }
  return { changed: changed, unchanged: unchanged.length }
}

async function main() {
  const args = parseArgs(process.argv)
  const cfg = readPublicSupabaseConfig()
  if (!cfg.url || !cfg.anonKey) {
    throw new Error("Missing public Supabase config")
  }
  const rows = await fetchAllRows(cfg.url, cfg.anonKey)
  const byCountry = groupFeatures(rows)
  const result = syncFiles(byCountry, args.dryRun)
  const summary = {
    dryRun: args.dryRun,
    rows: rows.length,
    countriesInDb: Object.keys(byCountry).length,
    filesUnchanged: result.unchanged,
    filesChanged: result.changed.length,
    changed: result.changed,
  }
  console.log(JSON.stringify(summary, null, 2))
}

module.exports = {
  toFeatureCollection: toFeatureCollection,
  sameCollection: sameCollection,
  stringifyCollection: stringifyCollection,
  groupFeatures: groupFeatures,
}

if (require.main === module) {
  main().catch(function (err) {
    console.error(err.stack || err.message || err)
    process.exit(1)
  })
}
