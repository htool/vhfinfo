/* Nearby VHF list — GPS-first, SignalK-plugin layout, no map. */
(function () {
  var GITHUB_DATA =
    "https://raw.githubusercontent.com/htool/vhfinfo/main/data/";
  var BBOX_URL = GITHUB_DATA + "countries_bbox.json";
  var SEARCH_DISTANCE = 5000;
  var SEARCH_ANGLE = 80;
  var MAX_RESULTS = 8;
  var DEMO = {
    amsterdam: { lat: 52.377, lon: 4.9, label: "Amsterdam (IJ)" },
    ijsselmeer: { lat: 52.7, lon: 5.25, label: "IJsselmeer" },
  };
  var LAYER_STORAGE_KEY = "vhfinfo.nearbyLayers";
  var LAYER_DEFS = [
    { key: "vts", label: "VTS", type: "vts" },
    { key: "radar", label: "VTS Radar", type: "vts radar support" },
    { key: "lock", label: "Locks", type: "lock" },
    { key: "bridge", label: "Bridges", type: "bridge" },
    { key: "marina", label: "Marinas", type: "marina" },
    { key: "area", label: "Areas", type: "area" },
  ];
  var LAYER_KEYS = LAYER_DEFS.map(function (def) {
    return def.key;
  });
  var TYPE_TO_LAYER = {};
  LAYER_DEFS.forEach(function (def) {
    TYPE_TO_LAYER[def.type] = def.key;
  });

  var statusEl = document.getElementById("status");
  var listEl = document.getElementById("list");
  var gpsBtn = document.getElementById("btn-gps");
  var compassBtn = document.getElementById("btn-compass");
  var amsterdamBtn = document.getElementById("btn-amsterdam");
  var ijsselmeerBtn = document.getElementById("btn-ijsselmeer");

  var countriesBbox = null;
  var featureCache = {};
  var watchId = null;
  var compassOn = false;
  var compassMode = false;
  var heading = 0;
  var lastHeading = 0;
  var position = null;
  var sourceLabel = "";
  var refreshTimer = null;
  var lastRefreshAt = 0;
  var layerState = defaultLayers();

  function qs(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fetchJson(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) {
        throw new Error("HTTP " + res.status + " for " + url);
      }
      return res.json();
    });
  }

  function loadBbox() {
    if (countriesBbox) {
      return Promise.resolve(countriesBbox);
    }
    return fetchJson(BBOX_URL).then(function (data) {
      countriesBbox = data;
      return data;
    });
  }

  function countriesIntersecting(lon, lat, padDeg) {
    var pad = padDeg == null ? 0.08 : padDeg;
    var found = [];
    if (!countriesBbox) {
      return found;
    }
    Object.keys(countriesBbox).forEach(function (code) {
      var box = countriesBbox[code];
      if (!box || !box.sw || !box.ne) {
        return;
      }
      if (
        lat + pad >= box.sw.lat &&
        lat - pad <= box.ne.lat &&
        lon + pad >= box.sw.lon &&
        lon - pad <= box.ne.lon
      ) {
        found.push(code);
      }
    });
    return found;
  }

  function loadCountryFeaturesFromGithub(code) {
    return fetchJson(GITHUB_DATA + code + ".json")
      .then(function (data) {
        if (data && data.type === "FeatureCollection") {
          return data.features || [];
        }
        if (Array.isArray(data)) {
          return data;
        }
        return [];
      })
      .catch(function () {
        return [];
      });
  }

  function loadCountryFeatures(code) {
    if (featureCache[code]) {
      return Promise.resolve(featureCache[code]);
    }
    var fromDb = Promise.reject(new Error("no db"));
    if (
      window.vhfFeaturesDb &&
      typeof window.vhfFeaturesDb.fetchCountryFeatures === "function"
    ) {
      fromDb = window.vhfFeaturesDb.fetchCountryFeatures(code);
    }
    return fromDb
      .then(function (features) {
        featureCache[code] = features || [];
        return featureCache[code];
      })
      .catch(function () {
        return loadCountryFeaturesFromGithub(code).then(function (features) {
          featureCache[code] = features;
          return features;
        });
      });
  }

  function createSearchPolygon(lng, lat, useCompass) {
    var currentPosition = turf.point([lng, lat], {});
    var options = { units: "meters" };
    if (useCompass) {
      var bearingA = heading - SEARCH_ANGLE / 2;
      if (bearingA > 180) {
        bearingA -= 360;
      }
      var bearingB = heading + SEARCH_ANGLE / 2;
      if (bearingB > 180) {
        bearingB -= 360;
      }
      var pointA = turf.rhumbDestination(
        currentPosition,
        SEARCH_DISTANCE,
        bearingA,
        options,
      );
      var pointB = turf.rhumbDestination(
        currentPosition,
        SEARCH_DISTANCE,
        bearingB,
        options,
      );
      return turf.polygon(
        [
          [
            [lng, lat],
            pointA.geometry.coordinates,
            pointB.geometry.coordinates,
            [lng, lat],
          ],
        ],
        { name: "searchPolygon" },
      );
    }
    return turf.circle([lng, lat], SEARCH_DISTANCE / 1000, {
      steps: 32,
      units: "kilometers",
    });
  }

  function distanceToPolygon(point, polygon) {
    if (polygon && polygon.type === "Feature") {
      polygon = polygon.geometry;
    }
    if (!polygon || !polygon.type) {
      return Infinity;
    }
    if (polygon.type === "MultiPolygon") {
      var multi = polygon.coordinates.map(function (coords) {
        return distanceToPolygon(point, {
          type: "Polygon",
          coordinates: coords,
        });
      });
      return Math.min.apply(null, multi);
    }
    if (polygon.type !== "Polygon" || !polygon.coordinates.length) {
      return Infinity;
    }
    if (polygon.coordinates.length > 1) {
      var parts = polygon.coordinates.map(function (coords) {
        return distanceToPolygon(point, {
          type: "Polygon",
          coordinates: [coords],
        });
      });
      var exteriorDistance = parts[0];
      var interiorDistances = parts.slice(1);
      if (exteriorDistance < 0) {
        var smallestInterior = interiorDistances.reduce(function (a, b) {
          return b < a ? b : a;
        });
        if (smallestInterior < 0) {
          return smallestInterior * -1;
        }
        return smallestInterior < exteriorDistance * -1
          ? smallestInterior * -1
          : exteriorDistance;
      }
      return exteriorDistance;
    }
    var line = turf.polygonToLine(polygon);
    var distance =
      turf.pointToLineDistance(point, line, { units: "kilometers" }) * 1000;
    if (turf.booleanPointInPolygon(point, polygon)) {
      distance = distance * -1;
    }
    return distance;
  }

  function skipType(type) {
    var t = String(type || "").toLowerCase();
    return t === "territorial" || t === "12nm";
  }

  function defaultLayers() {
    var layers = {};
    LAYER_KEYS.forEach(function (key) {
      layers[key] = true;
    });
    return layers;
  }

  function normalizeLayers(obj) {
    var layers = defaultLayers();
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
      return layers;
    }
    LAYER_KEYS.forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        layers[key] = !!obj[key];
      }
    });
    return layers;
  }

  function parseLayersParam(value) {
    var layers = defaultLayers();
    var raw = String(value == null ? "" : value).trim().toLowerCase();
    if (raw === "all") {
      return layers;
    }
    LAYER_KEYS.forEach(function (key) {
      layers[key] = false;
    });
    if (!raw) {
      return layers;
    }
    raw.split(/[,+\s]+/).forEach(function (token) {
      if (!token) {
        return;
      }
      if (token === "all") {
        LAYER_KEYS.forEach(function (key) {
          layers[key] = true;
        });
        return;
      }
      if (LAYER_KEYS.indexOf(token) !== -1) {
        layers[token] = true;
      }
    });
    return layers;
  }

  function layersParamValue(layers) {
    var on = LAYER_KEYS.filter(function (key) {
      return layers[key];
    });
    if (on.length === LAYER_KEYS.length) {
      return "all";
    }
    return on.join(",");
  }

  function loadLayersFromStorage() {
    try {
      var raw = window.localStorage.getItem(LAYER_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      var parsed = JSON.parse(raw);
      if (typeof parsed === "string") {
        parsed = parseLayersParam(parsed);
      }
      return normalizeLayers(parsed);
    } catch (err) {
      return null;
    }
  }

  function loadLayers() {
    var params = new URLSearchParams(window.location.search);
    if (params.has("layers")) {
      return parseLayersParam(params.get("layers"));
    }
    var stored = loadLayersFromStorage();
    if (stored) {
      return stored;
    }
    return defaultLayers();
  }

  function persistLayers(updateUrl) {
    try {
      window.localStorage.setItem(
        LAYER_STORAGE_KEY,
        JSON.stringify(layerState),
      );
    } catch (err) {
      /* ignore quota / private mode */
    }
    if (!updateUrl) {
      return;
    }
    var url = new URL(window.location.href);
    url.searchParams.set("layers", layersParamValue(layerState));
    history.replaceState({}, "", url);
  }

  function selectedLayerLabels() {
    return LAYER_DEFS.filter(function (def) {
      return layerState[def.key];
    }).map(function (def) {
      return def.label;
    });
  }

  function layerKeyForType(type) {
    return TYPE_TO_LAYER[String(type || "").toLowerCase()] || null;
  }

  function typeAllowed(type) {
    if (skipType(type)) {
      return false;
    }
    var key = layerKeyForType(type);
    if (key == null) {
      return true;
    }
    return !!layerState[key];
  }

  function syncLayerButtons() {
    LAYER_DEFS.forEach(function (def) {
      var btn = document.getElementById("btn-layer-" + def.key);
      if (!btn) {
        return;
      }
      var on = !!layerState[def.key];
      btn.classList.toggle("is-on", on);
      btn.classList.toggle("btn-gold", on);
      btn.classList.toggle("btn-dark", !on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function findNearbyFeatures(lon, lat, features, searchPolygon) {
    var nearby = [];
    var here = turf.point([lon, lat], {});
    features.forEach(function (feature) {
      if (
        !feature ||
        !feature.geometry ||
        !typeAllowed(feature.properties && feature.properties.type)
      ) {
        return;
      }
      try {
        var hits = false;
        if (typeof turf.booleanIntersects === "function") {
          hits = turf.booleanIntersects(feature, searchPolygon);
        } else {
          hits = turf.intersect(feature, searchPolygon) != null;
        }
        if (!hits) {
          return;
        }
        var distance = Math.round(distanceToPolygon(here, feature));
        if (!(distance < SEARCH_DISTANCE)) {
          return;
        }
        var props = {};
        var src = feature.properties || {};
        Object.keys(src).forEach(function (key) {
          props[key] = src[key];
        });
        props.distance = distance;
        nearby.push(props);
      } catch (err) {
        console.log(
          "error with feature: " +
            ((feature.properties && feature.properties.name) || ""),
          err,
        );
      }
    });
    nearby.sort(function (a, b) {
      return Math.abs(a.distance) - Math.abs(b.distance);
    });
    if (
      nearby.length > 1 &&
      nearby[0].distance < 0 &&
      nearby[1].distance < 0 &&
      String(nearby[0].type).toLowerCase() === "vts radar support" &&
      String(nearby[1].type).toLowerCase() === "vts"
    ) {
      nearby[0] = nearby.splice(1, 1, nearby[0])[0];
    }
    return nearby.slice(0, MAX_RESULTS);
  }

  function renderList(items) {
    listEl.innerHTML = "";
    if (!items.length) {
      var labels = selectedLayerLabels();
      var empty;
      if (!labels.length) {
        empty =
          "No layers selected. Enable VTS, VTS Radar, Locks, Bridges, Marinas, or Areas to see nearby channels.";
      } else {
        empty =
          "No VHF areas in range for the selected layers (" +
          labels.join(", ") +
          "). Try another location, turn look-ahead off, or enable more layers.";
      }
      listEl.innerHTML = '<p class="info-empty">' + escapeHtml(empty) + "</p>";
      return;
    }
    var info = window.vhfFeatureInfo;
    items.forEach(function (feature, id) {
      var channel =
        feature.channel == null
          ? "-"
          : String(feature.channel).replace(/[/,]/g, " ");
      var type = info
        ? info.typeLabel(feature.type)
        : String(feature.type || "").toUpperCase();
      var mode = String((info ? info.pickMode(feature) : "") || "").toUpperCase();
      var distanceText =
        feature.distance < 0 ? "INSIDE" : feature.distance + "m";
      var url = info ? info.pickUrl(feature) : "";
      var phone = info ? info.pickPhone(feature) : "";

      var entry = document.createElement("article");
      entry.className = "entry";
      entry.id = "entry_" + id;

      var icons = "";
      if (url) {
        icons +=
          '<a class="url" href="' +
          escapeHtml(url) +
          '" target="_blank" rel="noopener noreferrer" aria-label="Source link">&#128279;</a>';
      }
      if (phone) {
        icons +=
          '<a class="phone" href="tel:' +
          escapeHtml(phone) +
          '" aria-label="Call">&#9990;</a>';
      }

      var details = info
        ? info.buildInfoTable(feature, { omit: ["heading", "vhf"] })
        : "";
      var name = feature.name || type || "";

      entry.innerHTML =
        (name
          ? '<h2 class="feature-name">' + escapeHtml(name) + "</h2>"
          : "") +
        '<div class="channelblock">' +
        '<div class="channel">' +
        escapeHtml(channel) +
        "</div>" +
        '<div class="typeblock">' +
        '<div class="type">' +
        escapeHtml(type) +
        "</div>" +
        (mode ? '<div class="mode">' + escapeHtml(mode) + "</div>" : "") +
        '<div class="distance">' +
        escapeHtml(distanceText) +
        "</div>" +
        "</div>" +
        '<div class="icons">' +
        icons +
        "</div>" +
        "</div>" +
        details;

      if (channel.length > 3) {
        entry.querySelector(".channel").style.fontSize =
          Math.max(1.35, 2.8 - channel.length * 0.28) + "rem";
      }
      listEl.appendChild(entry);
    });
  }

  function headingText() {
    if (!compassMode) {
      return "around the boat (~5 km)";
    }
    return "look-ahead " + Math.round(heading) + "°";
  }

  function requestRefresh(immediate) {
    if (immediate) {
      clearTimeout(refreshTimer);
      return refresh();
    }
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refresh, 250);
  }

  function refresh() {
    if (!position) {
      return Promise.resolve();
    }
    lastRefreshAt = Date.now();
    setStatus("Loading channels…");
    return loadBbox()
      .then(function () {
        var codes = countriesIntersecting(position.lon, position.lat);
        if (!codes.length) {
          setStatus("No country data for this location.");
          renderList([]);
          return;
        }
        return Promise.all(codes.map(loadCountryFeatures)).then(function (
          groups,
        ) {
          var features = [];
          groups.forEach(function (group) {
            features = features.concat(group);
          });
          var searchPolygon = createSearchPolygon(
            position.lon,
            position.lat,
            compassMode,
          );
          var nearby = findNearbyFeatures(
            position.lon,
            position.lat,
            features,
            searchPolygon,
          );
          var where =
            sourceLabel ||
            position.lat.toFixed(4) + ", " + position.lon.toFixed(4);
          if (!nearby.length) {
            setStatus("None nearby at " + where + " (" + headingText() + ").");
          } else {
            setStatus(
              nearby.length +
                " nearby at " +
                where +
                " · " +
                headingText(),
            );
          }
          renderList(nearby);
        });
      })
      .catch(function (err) {
        console.error(err);
        setStatus("Could not load VHF data.");
      });
  }

  function stopWatch() {
    if (watchId != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  function useCoords(lat, lon, label) {
    var next = { lat: Number(lat), lon: Number(lon) };
    var moved = true;
    if (position) {
      var dLat = next.lat - position.lat;
      var dLon = next.lon - position.lon;
      moved = Math.abs(dLat) > 0.00005 || Math.abs(dLon) > 0.00005;
    }
    position = next;
    sourceLabel = label || "";
    if (!moved) {
      return Promise.resolve();
    }
    return requestRefresh(true);
  }

  function geoError(err) {
    var denied = err && (err.code === 1 || err.code === err.PERMISSION_DENIED);
    if (denied) {
      setStatus("Location permission denied. Use a demo location or enable GPS.");
    } else {
      setStatus("Could not get GPS. Use a demo location or try again.");
    }
  }

  function setActiveButtons(mode) {
    gpsBtn.classList.toggle("is-on", mode === "gps");
    gpsBtn.classList.toggle("btn-gold", mode === "gps");
    gpsBtn.classList.toggle("btn-dark", mode !== "gps");
    amsterdamBtn.classList.toggle("is-on", mode === "amsterdam");
    ijsselmeerBtn.classList.toggle("is-on", mode === "ijsselmeer");
  }

  function startGps() {
    if (!navigator.geolocation) {
      setStatus("This browser has no geolocation. Use a demo location.");
      return;
    }
    setStatus("Locating…");
    sourceLabel = "GPS";
    setActiveButtons("gps");
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        useCoords(pos.coords.latitude, pos.coords.longitude, "GPS");
      },
      geoError,
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 },
    );
    stopWatch();
    watchId = navigator.geolocation.watchPosition(
      function (pos) {
        useCoords(pos.coords.latitude, pos.coords.longitude, "GPS");
      },
      function () {},
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
  }

  function compassHandler(e) {
    var next = e.webkitCompassHeading;
    if (next == null && e.alpha != null) {
      next = Math.abs(e.alpha - 360);
    }
    if (next == null || isNaN(next)) {
      return;
    }
    heading = next;
    if (
      compassMode &&
      position &&
      Date.now() - lastRefreshAt > 800 &&
      Math.abs(lastHeading - heading) > 5
    ) {
      lastHeading = heading;
      requestRefresh();
    }
  }

  function startCompass() {
    if (compassOn) {
      return;
    }
    function listen() {
      window.addEventListener("deviceorientation", compassHandler, true);
      compassOn = true;
    }
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      DeviceOrientationEvent.requestPermission()
        .then(function (response) {
          if (response === "granted") {
            listen();
          } else {
            setStatus("Compass permission denied — look-ahead uses heading 0°.");
          }
        })
        .catch(function () {
          listen();
        });
      return;
    }
    listen();
  }

  function toggleCompass() {
    compassMode = !compassMode;
    compassBtn.classList.toggle("is-on", compassMode);
    compassBtn.setAttribute("aria-pressed", compassMode ? "true" : "false");
    if (compassMode) {
      startCompass();
    }
    if (position) {
      requestRefresh(true);
    }
  }

  function applyDemo(key) {
    var demo = DEMO[key];
    if (!demo) {
      return;
    }
    stopWatch();
    setActiveButtons(key);
    useCoords(demo.lat, demo.lon, demo.label);
    var url = new URL(window.location.href);
    url.searchParams.set("demo", key);
    url.searchParams.delete("lat");
    url.searchParams.delete("lon");
    history.replaceState({}, "", url);
  }

  function toggleLayer(key) {
    if (LAYER_KEYS.indexOf(key) === -1) {
      return;
    }
    layerState[key] = !layerState[key];
    persistLayers(true);
    syncLayerButtons();
    if (position) {
      requestRefresh(true);
    }
  }

  LAYER_DEFS.forEach(function (def) {
    var btn = document.getElementById("btn-layer-" + def.key);
    if (!btn) {
      return;
    }
    btn.addEventListener("click", function () {
      toggleLayer(def.key);
    });
  });

  gpsBtn.addEventListener("click", function () {
    var url = new URL(window.location.href);
    url.searchParams.delete("demo");
    url.searchParams.delete("lat");
    url.searchParams.delete("lon");
    history.replaceState({}, "", url);
    startGps();
  });
  compassBtn.addEventListener("click", toggleCompass);
  compassBtn.setAttribute("aria-pressed", "false");
  amsterdamBtn.addEventListener("click", function () {
    applyDemo("amsterdam");
  });
  ijsselmeerBtn.addEventListener("click", function () {
    applyDemo("ijsselmeer");
  });

  layerState = loadLayers();
  persistLayers(false);
  syncLayerButtons();

  var demoKey = (qs("demo") || "").toLowerCase();
  var qLat = qs("lat");
  var qLon = qs("lon") || qs("lng");
  var qHeading = qs("heading");
  if (qs("compass") === "1") {
    compassMode = true;
    compassBtn.classList.add("is-on");
    compassBtn.setAttribute("aria-pressed", "true");
  }
  if (qHeading != null && qHeading !== "") {
    heading = Number(qHeading) || 0;
  }

  if (DEMO[demoKey]) {
    applyDemo(demoKey);
  } else if (qLat != null && qLon != null) {
    stopWatch();
    useCoords(qLat, qLon, "Query location");
  } else {
    startGps();
  }
})();
