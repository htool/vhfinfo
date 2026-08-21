#!/usr/bin/env node
/**
 * One-shot updater for Port of Amsterdam VTS sectors 1-5
 * (VTS communicatieregeling 2.0, in force 30 Sep 2025).
 *
 * IJmuiden aanloop (VHF 07, outside 12 NM) is intentionally not included.
 *
 * Re-run from git HEAD of data/NLD.json. Not fully idempotent if geometries
 * were already rewritten.
 */

const fs = require("fs")
const path = require("path")
const turf = require("@turf/turf")

const ROOT = path.resolve(__dirname, "..")
const FILE = path.join(ROOT, "data/NLD.json")
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

const PIERS = [4.54625, 52.46215]
const COENTUNNEL_LON = 4.864
const IJ10_LON = 4.958

function polygonFrom(feature) {
  if (feature.geometry.type === "Polygon") {
    return turf.polygon(feature.geometry.coordinates)
  }
  if (feature.geometry.type === "MultiPolygon") {
    const parts = feature.geometry.coordinates.map((c) => turf.polygon(c))
    return parts.reduce((acc, p) => (acc ? turf.union(acc, p) : p), null)
  }
  throw new Error("unsupported " + feature.geometry.type)
}

function toGeom(feature) {
  const dissolved = dissolveIfPossible(feature)
  const cleaned = turf.truncate(turf.cleanCoords(dissolved), {
    precision: 9,
    coordinates: 2,
    mutate: false,
  })
  return cleaned.geometry
}

function dissolveIfPossible(feature) {
  if (!feature || feature.geometry.type !== "MultiPolygon") return feature
  const parts = feature.geometry.coordinates.map((c) => turf.polygon(c))
  let merged = parts[0]
  for (let i = 1; i < parts.length; i++) {
    const next = turf.union(merged, parts[i])
    if (next) merged = next
  }
  return merged
}

function splitByLon(polyFeat, lon) {
  const bbox = turf.bbox(polyFeat)
  const pad = 0.05
  const westBox = turf.bboxPolygon([
    bbox[0] - pad,
    bbox[1] - pad,
    lon,
    bbox[3] + pad,
  ])
  const eastBox = turf.bboxPolygon([
    lon,
    bbox[1] - pad,
    bbox[2] + pad,
    bbox[3] + pad,
  ])
  const west = turf.intersect(polyFeat, westBox)
  const east = turf.intersect(polyFeat, eastBox)
  if (!west || !east) {
    throw new Error("split failed at " + lon)
  }
  return { west, east }
}

function clipLonRange(polyFeat, westLon, eastLon) {
  const bbox = turf.bbox(polyFeat)
  const box = turf.bboxPolygon([
    westLon,
    bbox[1] - 0.02,
    eastLon,
    bbox[3] + 0.02,
  ])
  const clipped = turf.intersect(polyFeat, box)
  if (!clipped) {
    throw new Error("lon clip failed " + westLon + ".." + eastLon)
  }
  return clipped
}

function ijmuidenGeometry(existing) {
  const harbour = polygonFrom(existing)
  const circle = turf.circle(PIERS, 12, { units: "nauticalmiles", steps: 64 })
  const bbox = turf.bbox(circle)
  const seaBox = turf.bboxPolygon([bbox[0], bbox[1], PIERS[0], bbox[3]])
  const seaSector = turf.intersect(circle, seaBox)
  return turf.union(seaSector, harbour)
}

function stadIjCorridor() {
  const corridor = turf.polygon([
    [
      [COENTUNNEL_LON, 52.37],
      [IJ10_LON, 52.37],
      [IJ10_LON, 52.392],
      [COENTUNNEL_LON, 52.405],
      [COENTUNNEL_LON, 52.37],
    ],
  ])
  return turf.buffer(corridor, 40, { units: "meters" })
}

const data = JSON.parse(fs.readFileSync(FILE, "utf8"))
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

setCommon(
  ijmuiden.properties,
  "Sector IJmuiden",
  61,
  "From the IJmuiden pier heads seaward to 12 NM, and inward to the sea locks (VTS communicatieregeling 2.0)."
)
ijmuiden.geometry = toGeom(ijmuidenGeometry(ijmuiden))

setCommon(
  nzk.properties,
  "Sector Noordzeekanaal",
  3,
  "From the IJmuiden sea locks to km 14.8 (Zijkanaal D)."
)

const ams = polygonFrom(amsterdam)
const { west: westhaven, east: stadCore } = splitByLon(ams, COENTUNNEL_LON)
let stad = turf.union(stadCore, stadIjCorridor())
stad = clipLonRange(stad, COENTUNNEL_LON - 0.0001, IJ10_LON)
const schellingRest = clipLonRange(
  polygonFrom(schelling),
  IJ10_LON,
  turf.bbox(polygonFrom(schelling))[2] + 0.02
)

setCommon(
  amsterdam.properties,
  "Sector Westhaven",
  4,
  "From km 14.8 (Zijkanaal D / Coenhaven) to km 19.6 (Coentunnel)."
)
amsterdam.geometry = toGeom(westhaven)

setCommon(
  schelling.properties,
  "Sector Schellingwoude",
  60,
  "East of buoy IJ10 / from km 26.5."
)
schelling.geometry = toGeom(schellingRest)

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

if (byId.has(IDS.stad)) {
  Object.assign(byId.get(IDS.stad).properties, stadProps)
  byId.get(IDS.stad).geometry = toGeom(stad)
} else {
  data.features.push({
    type: "Feature",
    properties: stadProps,
    geometry: toGeom(stad),
  })
}

function info(f) {
  const areaKm2 = turf.area(f) / 1e6
  const bbox = turf.bbox(f)
  return {
    id: f.properties.id,
    name: f.properties.name,
    callname: f.properties.callname,
    channel: f.properties.channel,
    type: f.geometry.type,
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
