#!/usr/bin/env node
/**
 * Rebuild Port of Amsterdam VTS sectors 1-5 as water-only Polygons.
 *
 * Sector IJmuiden: 12 NM from both pier heads, clipped to sea along the
 * OSM coastline (including the official baseline between the pier lights),
 * plus the inner harbour to the locks.
 *
 * Inland sectors: OSM water polygons split at km 14.8 / Coentunnel / IJ10.
 * Never write MultiPolygon; keep Polygon (holes are OK).
 *
 * IJmuiden aanloop (VHF 07) is intentionally not included.
 */

const fs = require("fs")
const path = require("path")
const turf = require("@turf/turf")

const ROOT = path.resolve(__dirname, "..")
const FILE = path.join(ROOT, "data/NLD.json")
const MAIN_FILE = "/tmp/NLD-main.json"
const COAST_FILE = "/tmp/osm-coast-ijmuiden.json"
const CORE_WATER_FILE = "/tmp/osm-core-water.json"
const HARBOUR_WATER_FILE = "/tmp/osm-harbour-water.json"
const IJMUIDEN_HARBOUR_FILE = "/tmp/osm-ijmuiden-harbour.json"

const NEW_URL =
  "https://www.portofamsterdam.com/sites/default/files/2025-09/VTS%20communicatieregeling%202.0%20def.pdf"
const PHONE = "+31205234600"

const IDS = {
  ijmuiden: "aa3f5a23-9e2d-4e85-81b6-6a0708ead5d1",
  nzk: "beb3b92b-6cc6-4ad3-ab89-89bfe7af6ad2",
  amsterdam: "93f9fd5b-7af8-49a0-9d20-dd9745da4e4d",
  schellingwoude: "3093daaa-2f81-4136-a287-92d57de9fce9",
  stad: "399163a7-0af7-482d-b481-5dfca9abe5ca",
}

// Official OSM baseline endpoints (lights on the IJmuiden pier heads).
const PIER_NORTH = [4.54225, 52.46741]
const PIER_SOUTH = [4.53258, 52.4638]
const COENTUNNEL_LON = 4.864
const IJ10_LON = 4.958
const NZK_WEST_LON = 4.615
const NZK_EAST_LON = 4.792

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"))
}

function osmCoords(geom) {
  return geom.map((p) => [p.lon, p.lat])
}

function closeRing(coords) {
  if (!coords.length) return coords
  const a = coords[0]
  const b = coords[coords.length - 1]
  if (a[0] !== b[0] || a[1] !== b[1]) coords = coords.concat([a])
  return coords
}

function wayPolygon(el) {
  if (!el.geometry || el.geometry.length < 4) return null
  const ring = closeRing(osmCoords(el.geometry))
  if (ring.length < 4) return null
  try {
    return turf.rewind(turf.polygon([ring]))
  } catch (e) {
    return null
  }
}

function relationPolygons(el) {
  const outers = []
  const inners = []
  for (const m of el.members || []) {
    if (!m.geometry || m.geometry.length < 2) continue
    const ring = closeRing(osmCoords(m.geometry))
    if (ring.length < 4) continue
    let poly
    try {
      poly = turf.rewind(turf.polygon([ring]))
    } catch (e) {
      continue
    }
    if (m.role === "inner") inners.push(poly)
    else outers.push(poly)
  }
  return outers.map((outer) => {
    let poly = outer
    for (const hole of inners) {
      try {
        const diff = turf.difference(poly, hole)
        if (diff) poly = diff
      } catch (e) {}
    }
    return poly
  })
}

function largestPolygon(feat) {
  if (!feat) return null
  if (feat.geometry.type === "Polygon") return feat
  if (feat.geometry.type !== "MultiPolygon") return null
  let best = null
  let bestArea = -1
  for (const coords of feat.geometry.coordinates) {
    const p = turf.polygon(coords)
    const a = turf.area(p)
    if (a > bestArea) {
      best = p
      bestArea = a
    }
  }
  return best
}

function stripTinyHoles(feat, minM2) {
  if (!feat || feat.geometry.type !== "Polygon") return feat
  const rings = feat.geometry.coordinates
  if (rings.length < 2) return feat
  const kept = [rings[0]]
  for (let i = 1; i < rings.length; i++) {
    const hole = turf.polygon([rings[i]])
    if (turf.area(hole) >= minM2) kept.push(rings[i])
  }
  return turf.polygon(kept)
}

function asPolygon(feat, label) {
  let p = largestPolygon(feat)
  if (!p || p.geometry.type !== "Polygon") {
    throw new Error("expected Polygon for " + label + ", got " + (feat && feat.geometry && feat.geometry.type))
  }
  p = stripTinyHoles(p, 500)
  return turf.truncate(turf.cleanCoords(p), {
    precision: 7,
    coordinates: 2,
    mutate: false,
  })
}

function unionAll(parts) {
  let acc = null
  for (const p of parts) {
    if (!p) continue
    acc = acc ? turf.union(acc, p) : p
  }
  return acc
}

function clipLon(poly, west, east) {
  const bbox = turf.bbox(poly)
  const box = turf.bboxPolygon([
    west,
    bbox[1] - 0.02,
    east,
    bbox[3] + 0.02,
  ])
  return turf.intersect(poly, box)
}

function stitchCoastline(osm) {
  const segs = osm.elements
    .filter((e) => e.type === "way" && e.geometry && e.geometry.length > 1)
    .map((e) => osmCoords(e.geometry))
  const used = new Array(segs.length).fill(false)
  function near(a, b) {
    return Math.abs(a[0] - b[0]) < 1e-5 && Math.abs(a[1] - b[1]) < 1e-5
  }
  function grow(startIdx) {
    used[startIdx] = true
    let line = segs[startIdx].slice()
    let changed = true
    while (changed) {
      changed = false
      for (let i = 0; i < segs.length; i++) {
        if (used[i]) continue
        const s = segs[i]
        if (near(line[line.length - 1], s[0])) {
          line = line.concat(s.slice(1))
          used[i] = true
          changed = true
        } else if (near(line[line.length - 1], s[s.length - 1])) {
          line = line.concat(s.slice(0, -1).reverse())
          used[i] = true
          changed = true
        } else if (near(line[0], s[s.length - 1])) {
          line = s.slice(0, -1).concat(line)
          used[i] = true
          changed = true
        } else if (near(line[0], s[0])) {
          line = s.slice(1).reverse().concat(line)
          used[i] = true
          changed = true
        }
      }
    }
    return line
  }
  const chains = []
  for (let i = 0; i < segs.length; i++) {
    if (!used[i]) chains.push(grow(i))
  }
  chains.sort((a, b) => b.length - a.length)
  return chains[0]
}

function landFromCoast(line) {
  // Land is east of the Holland coast. Close the coastline with an inland box.
  const lats = line.map((c) => c[1])
  const north = Math.max(...lats)
  const south = Math.min(...lats)
  const east = 5.05
  let ring = line.slice()
  const start = ring[0]
  const end = ring[ring.length - 1]
  // Ensure we walk southward along the coast before closing east.
  if (start[1] < end[1]) ring = ring.reverse()
  ring = ring.concat([
    [east, ring[ring.length - 1][1]],
    [east, ring[0][1]],
    ring[0],
  ])
  const land = turf.rewind(turf.polygon([ring]))
  const haarlem = turf.point([4.64, 52.38])
  if (!turf.booleanPointInPolygon(haarlem, land)) {
    ring = line.slice()
    if (ring[0][1] > ring[ring.length - 1][1]) ring = ring.reverse()
    ring = ring.concat([
      [east, ring[ring.length - 1][1]],
      [east, ring[0][1]],
      ring[0],
    ])
    return turf.rewind(turf.polygon([ring]))
  }
  return land
}

function ijmuidenSea() {
  const coast = stitchCoastline(loadJson(COAST_FILE))
  const land = landFromCoast(coast)
  const cN = turf.circle(PIER_NORTH, 12, { units: "nauticalmiles", steps: 96 })
  const cS = turf.circle(PIER_SOUTH, 12, { units: "nauticalmiles", steps: 96 })
  const circles = turf.union(cN, cS)
  const sea = turf.difference(circles, land)
  if (!sea) throw new Error("sea difference empty")
  // Keep the seaward piece that contains a North Sea point west of the piers.
  const seaPoint = turf.point([4.4, 52.46])
  if (sea.geometry.type === "Polygon") {
    if (!turf.booleanPointInPolygon(seaPoint, sea)) {
      throw new Error("sea polygon does not contain North Sea test point")
    }
    return sea
  }
  for (const coords of sea.geometry.coordinates) {
    const p = turf.polygon(coords)
    if (turf.booleanPointInPolygon(seaPoint, p)) return p
  }
  return largestPolygon(sea)
}

function ijmuidenInnerHarbour() {
  const wantIds = new Set([
    1105341590, // Oude Buitenhaven
    1105341593, // Nieuwe Buitenhaven
    6294870,
    6294968,
    14712712,
  ])
  const skip = /haringhaven|seaport|kennemermeer|marina/i
  const parts = []
  const src = loadJson(IJMUIDEN_HARBOUR_FILE)
  for (const el of src.elements) {
    const name = (el.tags && el.tags.name) || ""
    if (skip.test(name)) continue
    if (el.type === "way" && wantIds.has(el.id)) {
      const p = wayPolygon(el)
      if (p) parts.push(p)
    } else if (el.type === "relation" && wantIds.has(el.id)) {
      parts.push(...relationPolygons(el))
    }
  }
  if (!parts.length) throw new Error("no inner harbour water")
  let merged = unionAll(parts)
  // Nudge touching basins together without spreading onto land.
  merged = turf.union(turf.buffer(merged, 8, { units: "meters" }), merged)
  return merged
}
function osmNamedWater() {
  const parts = []
  const core = loadJson(CORE_WATER_FILE)
  for (const el of core.elements) {
    const name = (el.tags && el.tags.name) || ""
    if (!/IJ|Buiten|Buitenhaven/i.test(name)) continue
    if (el.type === "way") {
      const p = wayPolygon(el)
      if (p) parts.push(p)
    } else {
      parts.push(...relationPolygons(el))
    }
  }
  return parts
}

const mainData = loadJson(MAIN_FILE)
function mainById(id) {
  const f = mainData.features.find(
    (x) => x.properties && x.properties.id === id
  )
  if (!f) throw new Error("missing main feature " + id)
  return turf.polygon(f.geometry.coordinates)
}

const data = loadJson(FILE)
const byId = new Map()
data.features.forEach((f) => {
  if (f.properties && f.properties.id) byId.set(f.properties.id, f)
})

const ijmuiden = byId.get(IDS.ijmuiden)
const nzk = byId.get(IDS.nzk)
const amsterdam = byId.get(IDS.amsterdam)
const schelling = byId.get(IDS.schellingwoude)
if (!ijmuiden || !nzk || !amsterdam || !schelling) {
  throw new Error("missing source VTS features")
}

function setCommon(props, name, channel, note) {
  props.name = name
  props.callname = name
  props.channel = channel
  props.url = NEW_URL
  props.phone = PHONE
  props.vhfdata = props.vhfdata || {}
  props.vhfdata.generic = props.vhfdata.generic || { mode: "listen" }
  props.vhfdata.generic.note = note
}

const sea = ijmuidenSea()
const innerHarbour = ijmuidenInnerHarbour()
ijmuiden.geometry = asPolygon(unionAll([sea, innerHarbour]), "IJmuiden").geometry
setCommon(
  ijmuiden.properties,
  "Sector IJmuiden",
  61,
  "From the IJmuiden pier heads seaward to 12 NM along the coastline, and inward to the sea locks (VTS communicatieregeling 2.0)."
)

const nzkOrig = mainById(IDS.nzk)
const amsOrig = mainById(IDS.amsterdam)
const schellingOrig = mainById(IDS.schellingwoude)
const westBox = turf.bboxPolygon([4.78, 52.36, COENTUNNEL_LON, 52.45])
const eastBox = turf.bboxPolygon([COENTUNNEL_LON, 52.36, IJ10_LON, 52.45])
const schellingBox = turf.bboxPolygon([IJ10_LON, 52.36, 5.03, 52.40])

const namedWater = osmNamedWater()
const westhavenWater = turf.intersect(amsOrig, westBox)
let stadWater = turf.intersect(amsOrig, eastBox)
stadWater = unionAll(
  [stadWater].concat(namedWater.map((p) => turf.intersect(p, eastBox)).filter(Boolean))
)
let schellingWater = turf.intersect(schellingOrig, schellingBox)
schellingWater = unionAll(
  [schellingWater].concat(
    namedWater.map((p) => turf.intersect(p, schellingBox)).filter(Boolean)
  )
)

setCommon(
  nzk.properties,
  "Sector Noordzeekanaal",
  3,
  "From the IJmuiden sea locks to km 14.8 (Zijkanaal D)."
)
nzk.geometry = asPolygon(nzkOrig, "Noordzeekanaal").geometry

setCommon(
  amsterdam.properties,
  "Sector Westhaven",
  4,
  "From km 14.8 (Zijkanaal D / Coenhaven) to km 19.6 (Coentunnel)."
)
amsterdam.geometry = asPolygon(westhavenWater, "Westhaven").geometry

setCommon(
  schelling.properties,
  "Sector Schellingwoude",
  60,
  "East of buoy IJ10 / from km 26.5."
)
schelling.geometry = asPolygon(schellingWater, "Schellingwoude").geometry

const stadProps = {
  name: "Sector Stad",
  callname: "Sector Stad",
  type: "vts",
  channel: 5,
  url: NEW_URL,
  phone: PHONE,
  vhfdata: {
    generic: {
      mode: "listen",
      note: "From km 19.6 (Coentunnel) to buoy IJ10.",
    },
    cargo: { mode: "report", note: "Report destination." },
  },
  id: IDS.stad,
}
const stadGeom = asPolygon(stadWater, "Stad").geometry
if (byId.has(IDS.stad)) {
  Object.assign(byId.get(IDS.stad).properties, stadProps)
  byId.get(IDS.stad).geometry = stadGeom
} else {
  data.features.push({ type: "Feature", properties: stadProps, geometry: stadGeom })
}

function info(f) {
  const areaKm2 = turf.area(f) / 1e6
  const bbox = turf.bbox(f)
  const holes =
    f.geometry.type === "Polygon" ? f.geometry.coordinates.length - 1 : 0
  return {
    id: f.properties.id,
    name: f.properties.name,
    channel: f.properties.channel,
    type: f.geometry.type,
    holes,
    km2: Number(areaKm2.toFixed(2)),
    lon: [bbox[0].toFixed(4), bbox[2].toFixed(4)],
    lat: [bbox[1].toFixed(4), bbox[3].toFixed(4)],
  }
}

const stadFeature = data.features.find((f) => f.properties.id === IDS.stad)
fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n")
console.log(
  JSON.stringify(
    {
      ijmuiden: info(ijmuiden),
      nzk: info(nzk),
      westhaven: info(amsterdam),
      stad: info(stadFeature),
      schellingwoude: info(schelling),
    },
    null,
    2
  )
)
