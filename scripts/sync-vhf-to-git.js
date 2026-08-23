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
 *   node scripts/sync-vhf-to-git.js --country NLD
 */

const fs = require("fs")
const path = require("path")
const db = require("../lib/features-db.js")

const ROOT = path.resolve(__dirname, "..")
const DATA_DIR = path.join(ROOT, "data")
const SKIP_FILES = new Set(["countries.json", "countries_bbox.json"])

function normalizeCountry(value) {
  const country = String(value || "")
    .trim()
    .toUpperCase()
  if (!/^[A-Z]{2,3}$/.test(country)) {
    return ""
  }
  return country
}

function parseArgs(argv) {
  const args = { dryRun: false, country: "" }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--dry-run") {
      args.dryRun = true
      continue
    }
    if (a === "--country") {
      args.country = normalizeCountry(argv[i + 1])
      if (!args.country) {
        console.error("Expected a country code after --country")
        process.exit(2)
      }
      i += 1
      continue
    }
    if (a.indexOf("--country=") === 0) {
      args.country = normalizeCountry(a.slice("--country=".length))
      if (!args.country) {
        console.error("Expected a country code after --country=")
        process.exit(2)
      }
      continue
    }
    console.error("Unknown argument: " + a)
    process.exit(2)
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
    path.join(ROOT, "lib", "supabase-config.js"),
    "utf8"
  )
  const url = (src.match(/url:\s*"([^"]+)"/) || [])[1]
  const anonKey = (src.match(/anonKey:\s*"([^"]+)"/) || [])[1]
  return { url, anonKey }
}

const COLLECTION_KEY_ORDER = ["type", "features"]
const FEATURE_KEY_ORDER = ["type", "properties", "geometry"]
const PROPERTY_KEY_ORDER = [
  "id",
  "name",
  "callname",
  "type",
  "channel",
  "update",
  "url",
  "phone",
  "vhfdata",
]
const VHFDATA_KEY_ORDER = [
  "generic",
  "pleasure",
  "passenger",
  "fishing",
  "cargo",
  "emergency",
]
const MODE_KEY_ORDER = ["mode", "note", "url", "phone"]
const GEOMETRY_KEY_ORDER = ["type", "coordinates", "geometries"]

function keyOrderFor(parentKey) {
  if (parentKey === "collection") return COLLECTION_KEY_ORDER
  if (parentKey === "feature") return FEATURE_KEY_ORDER
  if (parentKey === "properties") return PROPERTY_KEY_ORDER
  if (parentKey === "vhfdata") return VHFDATA_KEY_ORDER
  if (parentKey === "geometry") return GEOMETRY_KEY_ORDER
  if (
    parentKey === "generic" ||
    parentKey === "pleasure" ||
    parentKey === "passenger" ||
    parentKey === "fishing" ||
    parentKey === "cargo" ||
    parentKey === "emergency"
  ) {
    return MODE_KEY_ORDER
  }
  return []
}

function stableClone(value, parentKey) {
  if (Array.isArray(value)) {
    return value.map(function (item) {
      return stableClone(item)
    })
  }
  if (!value || typeof value !== "object") {
    return value
  }
  const preferred = keyOrderFor(parentKey)
  const seen = {}
  const ordered = []
  preferred.forEach(function (key) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      ordered.push(key)
      seen[key] = true
    }
  })
  Object.keys(value)
    .sort()
    .forEach(function (key) {
      if (!seen[key]) ordered.push(key)
    })
  const out = {}
  ordered.forEach(function (key) {
    if (parentKey === "collection" && key === "features") {
      out[key] = (value[key] || []).map(function (feature) {
        return stableClone(feature, "feature")
      })
      return
    }
    let childParent = key
    if (parentKey === "feature" && key === "properties") childParent = "properties"
    else if (parentKey === "feature" && key === "geometry") childParent = "geometry"
    else if (parentKey === "properties" && key === "vhfdata") childParent = "vhfdata"
    out[key] = stableClone(value[key], childParent)
  })
  return out
}

function featureKey(feature) {
  return JSON.stringify(stableClone(feature, "feature"))
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
  return stableClone(
    { type: "FeatureCollection", features: sorted },
    "collection"
  )
}

function stringifyCollection(collection) {
  return (
    JSON.stringify(stableClone(collection, "collection"), null, 2) + "\n"
  )
}

function featuresQueryPath(country, offset, pageSize) {
  let path =
    "/rest/v1/vhf_features?select=id,country,name,type,channel,properties,geometry&order=country,id&limit=" +
    pageSize +
    "&offset=" +
    offset
  if (country) {
    path += "&country=eq." + encodeURIComponent(country)
  }
  return path
}

async function fetchAllRows(url, anonKey, country) {
  const pageSize = 1000
  const all = []
  let offset = 0
  while (true) {
    const res = await fetch(
      url.replace(/\/$/, "") + featuresQueryPath(country, offset, pageSize),
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

function syncFiles(byCountry, dryRun, options) {
  options = options || {}
  const dataDir = options.dataDir || DATA_DIR
  const onlyCountries = (options.countries || [])
    .map(normalizeCountry)
    .filter(Boolean)
  let files
  if (onlyCountries.length) {
    files = onlyCountries.map(function (country) {
      return country + ".json"
    })
  } else {
    files = existingCountryFiles()
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
  }

  const changed = []
  const unchanged = []
  for (let i = 0; i < files.length; i++) {
    const name = files[i]
    const country = countryFromFilename(name)
    const dest = path.join(dataDir, name)
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
  const rows = await fetchAllRows(cfg.url, cfg.anonKey, args.country || "")
  const byCountry = groupFeatures(rows)
  const result = syncFiles(byCountry, args.dryRun, {
    countries: args.country ? [args.country] : [],
  })
  const summary = {
    dryRun: args.dryRun,
    country: args.country || null,
    rows: rows.length,
    countriesInDb: Object.keys(byCountry).length,
    filesUnchanged: result.unchanged,
    filesChanged: result.changed.length,
    changed: result.changed,
  }
  console.log(JSON.stringify(summary, null, 2))
}

module.exports = {
  normalizeCountry: normalizeCountry,
  parseArgs: parseArgs,
  featuresQueryPath: featuresQueryPath,
  toFeatureCollection: toFeatureCollection,
  sameCollection: sameCollection,
  stringifyCollection: stringifyCollection,
  groupFeatures: groupFeatures,
  syncFiles: syncFiles,
  stableClone: stableClone,
}

if (require.main === module) {
  main().catch(function (err) {
    console.error(err.stack || err.message || err)
    process.exit(1)
  })
}
