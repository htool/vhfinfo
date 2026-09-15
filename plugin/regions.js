/* Map VHFinfo GeoJSON features to Signal K Region resources. */
"use strict";

const turf = require("@turf/turf");

const SOURCE = "vhfinfo";

function asNumberArray(value, minLength) {
  var list = value;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch (e) {
      return null;
    }
  }
  if (!Array.isArray(list) || list.length < minLength) {
    return null;
  }
  var numbers = list.slice(0, minLength).map(Number);
  if (numbers.some(function (n) {
    return !Number.isFinite(n);
  })) {
    return null;
  }
  return numbers;
}

function parseBbox(value) {
  return asNumberArray(value, 4);
}

function parsePosition(value) {
  return asNumberArray(value, 2);
}

function bboxFromBeam(lon, lat, beamMeters) {
  lon = Number(lon);
  lat = Number(lat);
  beamMeters = Number(beamMeters);
  if (
    !Number.isFinite(lon) ||
    !Number.isFinite(lat) ||
    !Number.isFinite(beamMeters) ||
    beamMeters <= 0
  ) {
    return null;
  }
  var center = turf.point([lon, lat]);
  var opts = { units: "meters" };
  // Half-extent = beam length, so each side of the square is 2× beam.
  var north = turf.rhumbDestination(center, beamMeters, 0, opts);
  var east = turf.rhumbDestination(center, beamMeters, 90, opts);
  var south = turf.rhumbDestination(center, beamMeters, 180, opts);
  var west = turf.rhumbDestination(center, beamMeters, 270, opts);
  return [
    west.geometry.coordinates[0],
    south.geometry.coordinates[1],
    east.geometry.coordinates[0],
    north.geometry.coordinates[1],
  ];
}

function featureId(feature) {
  var props = (feature && feature.properties) || {};
  if (props.id == null || props.id === "") {
    return "";
  }
  return String(props.id);
}

function isPolygonFeature(feature) {
  var type = feature && feature.geometry && feature.geometry.type;
  return type === "Polygon" || type === "MultiPolygon";
}

function featureToRegion(feature, meta) {
  if (!isPolygonFeature(feature)) {
    return null;
  }
  var id = featureId(feature);
  if (!id) {
    return null;
  }
  var props = feature.properties || {};
  var generic = (props.vhfdata && props.vhfdata.generic) || {};
  var timestamp =
    (meta && meta.timestamp) || new Date().toISOString();
  var source = (meta && meta.$source) || SOURCE;
  return {
    id: id,
    name: props.name || props.callname || "",
    description: generic.note || "",
    feature: {
      type: "Feature",
      geometry: feature.geometry,
      properties: {
        id: props.id,
        type: props.type,
        channel: props.channel,
        callname: props.callname,
        url: props.url,
        phone: props.phone,
        update: props.update,
        vhfdata: props.vhfdata,
      },
    },
    timestamp: timestamp,
    $source: source,
  };
}

function regionRecord(mapped) {
  return {
    name: mapped.name,
    description: mapped.description,
    feature: mapped.feature,
    timestamp: mapped.timestamp,
    $source: mapped.$source,
  };
}

function intersectsBbox(feature, bbox) {
  try {
    return turf.booleanIntersects(feature, turf.bboxPolygon(bbox));
  } catch (e) {
    return false;
  }
}

function resolveListBbox(query, state) {
  query = query || {};
  state = state || {};
  var bbox = parseBbox(query.bbox);
  if (bbox) {
    return bbox;
  }
  var position = parsePosition(query.position) || state.position;
  if (!position) {
    return null;
  }
  return bboxFromBeam(position[0], position[1], state.beamMeters);
}

function listRegions(features, query, state) {
  var bbox = resolveListBbox(query, state);
  if (!bbox) {
    return {};
  }
  var limit = parseInt(query && query.limit, 10);
  if (!Number.isFinite(limit) || limit < 1) {
    limit = Infinity;
  }
  var out = {};
  var count = 0;
  (features || []).forEach(function (feature) {
    if (count >= limit) {
      return;
    }
    if (!intersectsBbox(feature, bbox)) {
      return;
    }
    var mapped = featureToRegion(feature, state);
    if (!mapped) {
      return;
    }
    out[mapped.id] = regionRecord(mapped);
    count += 1;
  });
  return out;
}

function valueAtPath(obj, dotted) {
  return String(dotted)
    .split(".")
    .reduce(function (cur, key) {
      return cur == null ? cur : cur[key];
    }, obj);
}

function getRegion(features, id, property, state) {
  var wanted = String(id || "");
  var found = (features || []).find(function (feature) {
    return featureId(feature) === wanted;
  });
  var mapped = found ? featureToRegion(found, state) : null;
  if (!mapped) {
    return null;
  }
  var record = regionRecord(mapped);
  if (!property) {
    return record;
  }
  return {
    value: valueAtPath(record, property),
    timestamp: record.timestamp,
    $source: record.$source,
  };
}

function readOnly() {
  return Promise.reject(new Error("VHFinfo regions are read-only"));
}

function createRegionProviderMethods(getState) {
  return {
    listResources: function (query) {
      var state = getState() || {};
      return Promise.resolve(
        listRegions(state.features, query, state),
      );
    },
    getResource: function (id, property) {
      var state = getState() || {};
      var record = getRegion(state.features, id, property, state);
      if (!record) {
        return Promise.reject(new Error("Resource not found: " + id));
      }
      return Promise.resolve(record);
    },
    setResource: function () {
      return readOnly();
    },
    deleteResource: function () {
      return readOnly();
    },
  };
}

module.exports = {
  SOURCE: SOURCE,
  bboxFromBeam: bboxFromBeam,
  parseBbox: parseBbox,
  parsePosition: parsePosition,
  featureToRegion: featureToRegion,
  listRegions: listRegions,
  getRegion: getRegion,
  createRegionProviderMethods: createRegionProviderMethods,
};
