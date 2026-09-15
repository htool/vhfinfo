/* Compact live deltas for nearby VHF hits. Bearing is radians. */
"use strict";

const COMPACT_PATH = "vhfinfo.nearby";

function degToRad(degrees) {
  var deg = Number(degrees);
  if (!Number.isFinite(deg)) {
    return null;
  }
  return (deg * Math.PI) / 180;
}

function compactHit(feature) {
  if (!feature || feature.id == null || feature.id === "") {
    return null;
  }
  var distance = Number(feature.distance);
  return {
    id: String(feature.id),
    distance: Number.isFinite(distance) ? distance : null,
    bearing: degToRad(feature.relativeBearing),
  };
}

function compactList(features) {
  var out = [];
  (features || []).forEach(function (feature) {
    var hit = compactHit(feature);
    if (hit) {
      out.push(hit);
    }
  });
  return out;
}

function blobValue(feature) {
  return JSON.stringify(feature);
}

const TYPE_SLOTS = [
  "vts",
  "vtsradar",
  "lock",
  "bridge",
  "marina",
  "area",
  "information",
  "territorial",
];

function featureSlotKey(feature) {
  var type = feature && feature.type;
  if (type === "vts radar support" || type === "vtsradar") {
    return "vtsradar";
  }
  if (TYPE_SLOTS.indexOf(type) !== -1) {
    return type;
  }
  return null;
}

function typedSlotPaths(features, base) {
  var first = {};
  (features || []).forEach(function (feature) {
    var slot = featureSlotKey(feature);
    if (!slot || first[slot]) {
      return;
    }
    first[slot] = feature;
  });
  return TYPE_SLOTS.map(function (slot) {
    return {
      path: base + "." + slot,
      value: first[slot] ? blobValue(first[slot]) : null,
    };
  });
}

function numberedSlotPaths(features, base, pathNr, types) {
  var values = [];
  var maxPathNr = parseInt(pathNr, 10);
  if (!Number.isFinite(maxPathNr) || maxPathNr < 1) {
    maxPathNr = 5;
  }
  types = types || {};
  var pathnr = 0;
  var list = features || [];
  for (var nr = 0; nr < list.length && nr < maxPathNr; nr++) {
    var feature = list[nr];
    if (!feature || types[feature.type] !== true) {
      continue;
    }
    values.push({
      path: base + "." + pathnr,
      value: blobValue(feature),
    });
    pathnr += 1;
  }
  for (var slot = pathnr; slot < maxPathNr; slot++) {
    values.push({
      path: base + "." + slot,
      value: null,
    });
  }
  return values;
}

function buildUpdates(features, options) {
  options = options || {};
  var values = [
    {
      path: options.compactPath || COMPACT_PATH,
      value: compactList(features),
    },
  ];
  var base = options.path;
  if (typeof base !== "string" || !base) {
    return values;
  }
  return values
    .concat(typedSlotPaths(features, base))
    .concat(numberedSlotPaths(features, base, options.pathNr, options.types));
}

module.exports = {
  COMPACT_PATH: COMPACT_PATH,
  degToRad: degToRad,
  compactHit: compactHit,
  compactList: compactList,
  buildUpdates: buildUpdates,
};
