/* MFD tile helpers: ranked nearby list + compact {id,distance,bearing}.
 * Display matches VHFinfoSite nearby.html (feature-info.js).
 */
;(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.vhfMfd = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  var MAX_RESULTS = 8;
  var TYPE_ARROW = " \u25B8 ";

  function assign(target) {
    var to = target || {};
    var i;
    var key;
    var src;
    for (i = 1; i < arguments.length; i++) {
      src = arguments[i];
      if (!src) {
        continue;
      }
      for (key in src) {
        if (Object.prototype.hasOwnProperty.call(src, key)) {
          to[key] = src[key];
        }
      }
    }
    return to;
  }

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
    var out = assign({}, extra);
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

  function isDefined(value) {
    return typeof value !== "undefined";
  }

  function isPlaceholder(value) {
    var raw = String(value == null ? "" : value).trim();
    return raw === "" || raw === "+" || raw === "https://" || raw === "http://";
  }

  function skipType(type) {
    var t = String(type || "").toLowerCase();
    return t === "territorial" || t === "12nm";
  }

  function promoteVtsOverRadar(list) {
    if (
      list.length > 1 &&
      list[0].distance < 0 &&
      list[1].distance < 0 &&
      String(list[0].type).toLowerCase() === "vts radar support" &&
      String(list[1].type).toLowerCase() === "vts"
    ) {
      list[0] = list.splice(1, 1, list[0])[0];
    }
    return list;
  }

  function slotsForDisplay(list, max) {
    var cap = parseInt(max, 10);
    if (!(cap === cap) || cap < 1) {
      cap = MAX_RESULTS;
    }
    var out = [];
    (list || []).forEach(function (item) {
      if (item && !skipType(item.type)) {
        out.push(item);
      }
    });
    promoteVtsOverRadar(out);
    return out.slice(0, cap);
  }

  function formatDistance(distance) {
    if (distance == null || distance === "") {
      return "";
    }
    var n = Number(distance);
    if (!isFinite(n)) {
      return "";
    }
    if (n < 0) {
      return "INSIDE";
    }
    if (n > 1852) {
      return (n / 1852).toFixed(1) + " Nm";
    }
    return n + "m";
  }

  function typeLabel(type) {
    var t = String(type || "").toUpperCase();
    if (t === "VTS RADAR SUPPORT") {
      t = "VTS RADAR";
    }
    return t;
  }

  function displayName(props) {
    if (!props) {
      return "-";
    }
    if (isDefined(props.callname)) {
      return String(props.callname);
    }
    if (isDefined(props.name)) {
      return String(props.name);
    }
    return "-";
  }

  function channelText(props) {
    if (!props || !isDefined(props.channel)) {
      return "";
    }
    return String(props.channel).replace(/[/,]/g, " ");
  }

  function pickBlockMode(props) {
    var data = (props && props.vhfdata) || {};
    if (data.pleasure && isDefined(data.pleasure.mode)) {
      return data.pleasure.mode;
    }
    if (data.generic && isDefined(data.generic.mode)) {
      return data.generic.mode;
    }
    return "";
  }

  function pickBlockNote(props) {
    var data = (props && props.vhfdata) || {};
    if (data.pleasure && isDefined(data.pleasure.note)) {
      return data.pleasure.note;
    }
    if (data.generic && isDefined(data.generic.note)) {
      return data.generic.note;
    }
    if (props && isDefined(props.note)) {
      return props.note;
    }
    return "";
  }

  function pickBlockPhone(props) {
    var data = (props && props.vhfdata) || {};
    if (data.pleasure && isDefined(data.pleasure.phone)) {
      return data.pleasure.phone;
    }
    if (props && isDefined(props.phone)) {
      return props.phone;
    }
    return "";
  }

  function pickBlockUrl(props) {
    var data = (props && props.vhfdata) || {};
    if (data.pleasure && isDefined(data.pleasure.url)) {
      return data.pleasure.url;
    }
    if (props && isDefined(props.url)) {
      return props.url;
    }
    return "";
  }

  function displayMode(vhf) {
    return String(pickBlockMode(vhf) || "").toUpperCase();
  }

  function typeLine(props) {
    if (!props) {
      return "";
    }
    return (
      typeLabel(props.type) +
      TYPE_ARROW +
      displayMode(props) +
      TYPE_ARROW +
      formatDistance(props.distance)
    );
  }

  function typeLineHtml(props) {
    if (!props) {
      return "";
    }
    return (
      escapeHtml(typeLabel(props.type)) +
      " &#9656; " +
      escapeHtml(displayMode(props)) +
      " &#9656; " +
      escapeHtml(formatDistance(props.distance))
    );
  }

  function channelFontSizeEm(channel, scale) {
    var size = 7 - String(channel == null ? "" : channel).length * 0.7;
    return size * (scale == null ? 1 : scale);
  }

  function queryLayout(search) {
    var raw = String(search == null ? "" : search);
    if (raw.indexOf("layout=nearby") !== -1) {
      return "nearby";
    }
    if (raw.indexOf("layout=mfd") !== -1) {
      return "mfd";
    }
    return "";
  }

  function isMfdBrowser(opts) {
    var ua = "";
    var doc;
    opts = opts || {};
    if (opts.ua != null) {
      ua = String(opts.ua);
    } else if (typeof navigator !== "undefined" && navigator.userAgent) {
      ua = String(navigator.userAgent);
    }
    doc = opts.document || (typeof document !== "undefined" ? document : null);
    if (doc && doc.documentMode) {
      return true;
    }
    return /Trident|MSIE |Navico|Simrad|B\&G|Lowrance/i.test(ua);
  }

  function isPhoneBrowser(opts) {
    var ua = "";
    opts = opts || {};
    if (opts.ua != null) {
      ua = String(opts.ua);
    } else if (typeof navigator !== "undefined" && navigator.userAgent) {
      ua = String(navigator.userAgent);
    }
    return /iPhone|iPod|iPad|Android|Mobile/i.test(ua);
  }

  function supportsNearbyLayout(opts) {
    var css;
    opts = opts || {};
    if (opts.cssGrid === true) {
      return true;
    }
    if (opts.cssGrid === false) {
      return false;
    }
    if (typeof window === "undefined") {
      return true;
    }
    try {
      css = window.CSS;
      return !!(css && css.supports && css.supports("display", "grid"));
    } catch (err) {
      return false;
    }
  }

  function useNearbyLayout(opts) {
    var forced;
    opts = opts || {};
    forced = queryLayout(
      opts.search != null
        ? opts.search
        : typeof window !== "undefined" && window.location
          ? window.location.search
          : "",
    );
    if (forced === "nearby") {
      return true;
    }
    if (forced === "mfd") {
      return false;
    }
    if (isMfdBrowser(opts)) {
      return false;
    }
    if (!supportsNearbyLayout(opts)) {
      return false;
    }
    return isPhoneBrowser(opts);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function phoneIconHtml(phone) {
    if (isPlaceholder(phone)) {
      return "";
    }
    return (
      '<a href="tel:' +
      escapeHtml(String(phone)) +
      '" style="text-decoration:none; color: white">&#9990;</a>'
    );
  }

  function urlIconHtml(url) {
    if (isPlaceholder(url)) {
      return "";
    }
    return (
      '<a href="' +
      escapeHtml(String(url)) +
      '" style="text-decoration:none; color: white" target="_blank" rel="noopener noreferrer">&#128279;</a>'
    );
  }

  return {
    MAX_RESULTS: MAX_RESULTS,
    assign: assign,
    catalogFromList: catalogFromList,
    mergeHit: mergeHit,
    mergeHits: mergeHits,
    needsCatalog: needsCatalog,
    slotsForDisplay: slotsForDisplay,
    skipType: skipType,
    formatDistance: formatDistance,
    typeLabel: typeLabel,
    displayName: displayName,
    channelText: channelText,
    displayMode: displayMode,
    pickBlockNote: pickBlockNote,
    pickBlockPhone: pickBlockPhone,
    pickBlockUrl: pickBlockUrl,
    typeLine: typeLine,
    typeLineHtml: typeLineHtml,
    channelFontSizeEm: channelFontSizeEm,
    isMfdBrowser: isMfdBrowser,
    isPhoneBrowser: isPhoneBrowser,
    useNearbyLayout: useNearbyLayout,
    escapeHtml: escapeHtml,
    phoneIconHtml: phoneIconHtml,
    urlIconHtml: urlIconHtml,
  };
});
