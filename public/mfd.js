/* MFD tile helpers: ranked nearby list + compact {id,distance,bearing}. */
;(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.vhfMfd = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  function catalogFromList(list) {
    var catalog = {};
    (list || []).forEach(function (item) {
      if (item && item.id != null && item.id !== "") {
        catalog[String(item.id)] = item;
      }
    });
    return catalog;
  }

  function isFullRecord(item) {
    return !!(item && (item.type || item.channel || item.name || item.vhfdata));
  }

  function mergeHit(hit, catalog) {
    if (!hit) {
      return null;
    }
    if (isFullRecord(hit)) {
      return hit;
    }
    if (hit.id == null || hit.id === "") {
      return null;
    }
    var extra = (catalog && catalog[String(hit.id)]) || {};
    var out = Object.assign({}, extra);
    out.id = String(hit.id);
    if (Object.prototype.hasOwnProperty.call(hit, "distance")) {
      out.distance = hit.distance;
    }
    if (Object.prototype.hasOwnProperty.call(hit, "bearing")) {
      out.bearing = hit.bearing;
    }
    return out;
  }

  function mergeHits(hits, catalog) {
    var out = [];
    (hits || []).forEach(function (hit) {
      var merged = mergeHit(hit, catalog);
      if (merged) {
        out.push(merged);
      }
    });
    return out;
  }

  function needsCatalog(hits, catalog) {
    return (hits || []).some(function (hit) {
      if (!hit || isFullRecord(hit)) {
        return false;
      }
      return !isFullRecord(catalog && catalog[String(hit.id)]);
    });
  }

  function slotsForDisplay(list, pathNr) {
    var max = parseInt(pathNr, 10);
    if (!Number.isFinite(max) || max < 1) {
      max = 5;
    }
    return (list || []).slice(0, max);
  }

  function pleasureMode(vhf) {
    return vhf && vhf.vhfdata && vhf.vhfdata.pleasure && vhf.vhfdata.pleasure.mode;
  }

  function genericMode(vhf) {
    return vhf && vhf.vhfdata && vhf.vhfdata.generic && vhf.vhfdata.generic.mode;
  }

  function displayMode(vhf) {
    return String(pleasureMode(vhf) || genericMode(vhf) || "").toUpperCase();
  }

  return {
    catalogFromList: catalogFromList,
    mergeHit: mergeHit,
    mergeHits: mergeHits,
    needsCatalog: needsCatalog,
    slotsForDisplay: slotsForDisplay,
    displayMode: displayMode,
  };
});
