module.exports = function (app, options) {
  "use strict";
  const logError =
    app.error ||
    ((err) => {
      console.error(err);
    });
  const debug =
    app.debug ||
    ((msg) => {
      app.debug(msg);
    });

  var plugin = {
    unsubscribes: [],
  };
  plugin.id = "vhfinfo";
  plugin.name = "VHF info";
  plugin.description =
    "Plugin that reads VHFinfo data and returns nearby info through an API";

  var pluginStatus = "Starting";
  let emptyFeature = {
    name: "",
    callname: "",
    type: "",
    channel: "",
    phone: "",
    update: "",
    vhfdata: {
      generic: { mode: "", note: "" },
      pleasure: { mode: "", note: "" },
      cargo: { mode: "", note: "" },
    },
    id: "",
    distance: "",
    relativeBearing: "",
  };

  var schema = {
    type: "object",
    properties: {
      angle: {
        type: "number",
        title: "Beam angle",
        default: 90,
      },
      distance: {
        type: "number",
        title: "Search beam length (meters)",
        default: 4000,
      },
      size: {
        type: "number",
        title: "Box size around location to load in memory (Nm)",
        default: 100,
      },
      path: {
        type: "string",
        title: "SignalK path to write object(s) within search area",
        default: "vhfdata.nearest",
      },
      pathNr: {
        type: "number",
        title: "Max number of SignalK paths to write",
        default: 5,
      },
      types: {
        type: "object",
        title: "Select VHF types to propogate to <above path>.[1-x]:",
        properties: {
          territorial: {
            title: "12 Nm Zone",
            type: "boolean",
          },
          vts: {
            title: "VTSes",
            type: "boolean",
          },
          vtsradar: {
            title: "VTS Radar support",
            type: "boolean",
          },
          lock: {
            title: "Locks",
            type: "boolean",
          },
          bridge: {
            title: "Bridges",
            type: "boolean",
          },
          marina: {
            title: "Marinas",
            type: "boolean",
          },
          area: {
            title: "Areas",
            type: "boolean",
          },
        },
      },
    },
  };

  plugin.schema = function () {
    return schema;
  };

  plugin.statusMessage = function () {
    return pluginStatus;
  };

  plugin.start = function (options, restartPlugin) {
    app.debug("Plugin started");
    const turf = require("@turf/turf");
    const path = require("path");

    var userDir = app.config.configPath;
    var dataDir = path.join(userDir, "/node_modules/vhfinfo/data/");

    var currentHeading = null;
    var currentCoordinates = null;
    var lastCoordinates = null;
    var currentPosition = null;
    var headingTrue = false;
    var headingMagnetic = false;

    app.streambundle
      .getSelfStream("navigation.position")
      .forEach((position) => {
        currentCoordinates = [position.longitude, position.latitude];
      });

    app.streambundle
      .getSelfStream("navigation.headingTrue")
      .forEach((heading) => {
        currentHeading = rad2deg(heading);
        if (headingTrue == false) {
          headingTrue = true;
          pluginStatus = "Started - using headingTrue";
        }
      });

    app.streambundle
      .getSelfStream("navigation.headingMagnetic")
      .forEach((heading) => {
        if (headingTrue == false) {
          currentHeading = rad2deg(heading);
          headingMagnetic = true;
          pluginStatus = "Started - using headingMagnetic";
        }
      });

    app.streambundle
      .getSelfStream("navigation.courseOverGroundTrue")
      .forEach((heading) => {
        if (headingMagnetic == false) {
          currentHeading = rad2deg(heading);
          pluginStatus = "Started - using COG";
        }
      });

    app.debug("options: %s", JSON.stringify(options));

    plugin.registerWithRouter = function (router) {
      app.debug("registerWithRouter");
      router.get("/options", (req, res) => {
        res.contentType("application/json");
        res.send(JSON.stringify(options));
      });
      router.get("/nearby", (req, res) => {
        res.contentType("application/json");
        res.send(JSON.stringify(nearbyFeatures));
        res.sendStatus(200);
      });
    };

    var distance = options.distance; // m
    var angle = options.angle; // Degrees
    var size = options.size; // Nm

    var featuresInBox = [];
    var nearbyFeatures = [];
    var featureCount = 0;
    var searchPolygon;

    setTimeout(updateFeaturesInBox, 10000); // Start 10 seconds after plugin start

    updateFeatures();

    function updateFeaturesInBox() {
      // Create selection box based on position (change)
      if (currentCoordinates != null) {
        if (lastCoordinates == null) {
          lastCoordinates = currentCoordinates;
        }
        var distance = turf.distance(currentCoordinates, lastCoordinates, {
          units: "nauticalmiles",
        });
        app.debug("distance: %d", distance);
        if (distance > options.size / 10 || distance == 0) {
          // Moved more than 10% OR exactly the same (first run)
          currentPosition = turf.point(currentCoordinates, {});
          var currentPositionBox = createPositionBox(
            currentPosition,
            size * 1852,
          );
          var countriesToParse = countriesIntersectingBox(currentPositionBox);
          app.debug("Matching countries: %s", countriesToParse.join(", "));
          featuresInBox = [];
          parseDataFiles(countriesToParse);
          lastCoordinates = currentCoordinates;
        }
      }
      setTimeout(updateFeaturesInBox, 60000); // Minutely update
    }

    function countriesIntersectingBox(positionBox) {
      let countryCoordinates = require(dataDir + "countries_bbox.json");
      // app.debug(positionBox)
      var countries = [];
      for (const [country, coordinates] of Object.entries(countryCoordinates)) {
        let sw = [coordinates.sw.lon, coordinates.sw.lat];
        let ne = [coordinates.ne.lon, coordinates.ne.lat];
        let bbox = turf.bbox(turf.lineString([sw, ne]));
        let bboxPolygon = turf.bboxPolygon(bbox);
        // app.debug('bbox: %s   %s', JSON.stringify(bboxPolygon), turf.booleanIntersects(positionBox, bboxPolygon))
        if (Math.abs(turf.booleanIntersects(positionBox, bboxPolygon))) {
          countries.push(country);
          countries.push(country + "_12Nm");
        }
      }
      return countries;
    }

    function createPositionBox(currentPosition, size) {
      var boxoptions = { units: "meters" };
      size = size / 2;
      var pointA = turf.rhumbDestination(currentPosition, size, 0, boxoptions);
      var pointB = turf.rhumbDestination(currentPosition, size, 90, boxoptions);
      var pointC = turf.rhumbDestination(
        currentPosition,
        size,
        180,
        boxoptions,
      );
      var pointD = turf.rhumbDestination(
        currentPosition,
        size,
        270,
        boxoptions,
      );
      var bbox = turf.bbox(
        turf.lineString([
          pointA.geometry.coordinates,
          pointB.geometry.coordinates,
          pointC.geometry.coordinates,
          pointD.geometry.coordinates,
          pointA.geometry.coordinates,
        ]),
      );
      var PositionBox = turf.bboxPolygon(bbox, { name: "currentPositionBox" });
      // app.debug(JSON.stringify(PositionBox))
      return PositionBox;
    }

    function parseDataFiles(countries) {
      const fs = require("fs");
      const Pick = require("stream-json/filters/Pick");
      const { streamArray } = require("stream-json/streamers/StreamArray");
      const { chain } = require("stream-chain");
      var country = countries.shift();
      app.debug("Processing %s", country);
      featureCount = 0;
      try {
        const pipeline = chain([
          fs.createReadStream(dataDir + country + ".json"),
          Pick.withParser({ filter: "features" }),
          streamArray(),
        ]);
        pipeline.on("data", (data) => {
          featuresInBox.push(data.value);
          featureCount = featureCount + 1;
        });
        pipeline.on("end", (end) => {
          if (featureCount > 0) {
            app.debug(
              "Read %d features from data file %s",
              featureCount,
              country + ".json",
            );
          }
          if (countries.length > 0) {
            // Process remainder of the list
            parseDataFiles(countries);
          } else {
            app.debug(
              "Loaded %d features into featuresInBox",
              featuresInBox.length,
            );
          }
        });
      } catch (e) {
        app.debug("Cannot open data file: %{s}.json", $country);
        if (countries.length > 0) {
          // Process remainder of the list
          parseDataFiles(countries);
        } else {
          app.debug(
            "Loaded %d features into featuresInBox",
            featuresInBox.length,
          );
        }
      }
    }

    function updateFeatures() {
      searchPolygon = createSearchPolygon();
      if (searchPolygon != null) {
        if (featuresInBox.length > 0) {
          nearbyFeatures = findNearbyFeatures(
            currentCoordinates,
            featuresInBox,
          );
          app.debug(
            "Found %d nearby features: ",
            nearbyFeatures.length,
            JSON.stringify(nearbyFeatures),
          );
          sendUpdates(nearbyFeatures);
        } else {
          app.debug("featuresInBox is empty");
        }
      } else {
        app.debug("searchPolygon is null");
      }
      setTimeout(updateFeatures, 5000);
    }

    function sendUpdates(features) {
      var values = [];
      var vts = false;
      var vtsradar = false;
      var marina = false;
      var lock = false;
      var bridge = false;
      var area = false;
      var territorial = false;
      features.forEach((feature) => {
        switch (feature.type) {
          case "vts":
            if (vts == false) {
              values = values.concat(
                objectToPath(options.path + "." + "vts", feature),
              );
              vts = true;
            }
            break;
          case "vtsradar":
            if (vtsradar == false) {
              values = values.concat(
                objectToPath(options.path + "." + "vtsradar", feature),
              );
              vtsradar = true;
            }
            break;
          case "lock":
            if (lock == false) {
              values = values.concat(
                objectToPath(options.path + "." + "lock", feature),
              );
              lock = true;
            }
            break;
          case "bridge":
            if (bridge == false) {
              values = values.concat(
                objectToPath(options.path + "." + "bridge", feature),
              );
              bridge = true;
            }
            break;
          case "marina":
            if (marina == false) {
              values = values.concat(
                objectToPath(options.path + "." + "marina", feature),
              );
              marina = true;
            }
            break;
          case "area":
            if (area == false) {
              values = values.concat(
                objectToPath(options.path + "." + "area", feature),
              );
              area = true;
            }
            break;
        }
      });
      var pathnr = 0;
      var maxPathNr = options.pathNr || 5;
      app.debug("maxPathNr: %d", maxPathNr);
      for (let nr = 0; nr < features.length && nr < maxPathNr; nr++) {
        if (options.types[features[nr].type] == true) {
          // Only selected types
          values = values.concat(
            objectToPath(options.path + "." + pathnr, features[nr]),
          );
          pathnr = pathnr + 1;
        }
      }
      // Fill rest with -

      for (let nr = pathnr; nr < maxPathNr; nr++) {
        values = values.concat(
          objectToPath(options.path + "." + nr, emptyFeature),
        );
      }
      //app.debug('values: %s', JSON.stringify(values))
      app.handleMessage(plugin.id, {
        updates: [
          {
            values: values,
          },
        ],
      });
      return;
    }

    function deg2rad(angle) {
      return Number(((angle * Math.PI) / 180).toFixed(3));
    }

    function objectToPath(path, object) {
      // Add object
      var values = [];
      if (typeof object.id != "undefined") {
        // Main object
        values = [{ path: path, value: JSON.stringify(object) }];
      }
      // Add single paths
      for (const [key, value] of Object.entries(object)) {
        var newPath = path + "." + key;
        if (typeof value == "object") {
          values = values.concat(objectToPath(newPath, value));
        } else {
          values.push({ path: newPath, value: value });
          if (key == "relativeBearing") {
            values.push({ path: newPath + "Rad", value: deg2rad(value) });
          }
        }
      }
      app.debug("objectToPath: ", JSON.stringify(values));
      return values;
    }

    function createSearchPolygon() {
      if (currentCoordinates != null && currentHeading != null) {
        currentPosition = turf.point(currentCoordinates, {});
        var options = { units: "meters" };
        var bearing = currentHeading - angle / 2;
        var pointA = turf.rhumbDestination(
          currentPosition,
          distance,
          bearing,
          options,
        );
        var bearing = currentHeading + angle / 2;
        var pointB = turf.rhumbDestination(
          currentPosition,
          distance,
          bearing,
          options,
        );
        var searchPolygon = turf.polygon(
          [
            [
              currentCoordinates,
              pointA.geometry.coordinates,
              pointB.geometry.coordinates,
              currentCoordinates,
            ],
          ],
          { name: "searchPolygon" },
        );
        app.debug(JSON.stringify(searchPolygon));
        return searchPolygon;
      } else {
        if (currentCoordinates == null) {
          app.debug(
            "createSearchPolygon: coordinates info is missing (navigation.position)",
          );
          pluginStatus = "Starting... waiting for navigation.position";
          return null;
        }
        if (currentCoordinates != null && currentHeading == null) {
          pluginStatus =
            "Started. Still missing heading or COG. Using bbox for now.";
          app.debug("createSearchPolygon: heading/COG info is missing");
          currentPosition = turf.point(currentCoordinates, {});
          var options = { units: "meters" };
          var pointA = turf.rhumbDestination(
            currentPosition,
            distance / 2,
            45,
            options,
          );
          var pointB = turf.rhumbDestination(
            currentPosition,
            distance / 2,
            135,
            options,
          );
          var pointC = turf.rhumbDestination(
            currentPosition,
            distance / 2,
            225,
            options,
          );
          var pointD = turf.rhumbDestination(
            currentPosition,
            distance / 2,
            315,
            options,
          );
          searchPolygon = turf.polygon([
            [
              pointA.geometry.coordinates,
              pointB.geometry.coordinates,
              pointC.geometry.coordinates,
              pointD.geometry.coordinates,
              pointA.geometry.coordinates,
            ],
          ]);
          return searchPolygon;
        }
      }
    }

    function distanceToPolygon(point, polygon) {
      if (polygon.type === "Feature") {
        polygon = polygon.geometry;
      }
      let distance;
      if (polygon.type === "MultiPolygon") {
        distance = polygon.coordinates
          .map((coords) =>
            distanceToPolygon({
              point,
              polygon: turf.polygon(coords).geometry,
            }),
          )
          .reduce((smallest, current) =>
            current < smallest ? current : smallest,
          );
      } else {
        if (polygon.coordinates.length > 1) {
          // Has holes
          const [exteriorDistance, ...interiorDistances] =
            polygon.coordinates.map((coords) =>
              distanceToPolygon({
                point,
                polygon: turf.polygon([coords]).geometry,
              }),
            );
          if (exteriorDistance < 0) {
            // point is inside the exterior polygon shape
            const smallestInteriorDistance = interiorDistances.reduce(
              (smallest, current) => (current < smallest ? current : smallest),
            );
            if (smallestInteriorDistance < 0) {
              // point is inside one of the holes (therefore not actually inside this shape)
              distance = smallestInteriorDistance * -1;
            } else {
              // find which is closer, the distance to the hole or the distance to the edge of the exterior, and set that as the inner distance.
              distance =
                smallestInteriorDistance < exteriorDistance * -1
                  ? smallestInteriorDistance * -1
                  : exteriorDistance;
            }
          } else {
            distance = exteriorDistance;
          }
        } else {
          // The actual distance operation - on a normal, hole-less polygon (converted to meters)
          distance =
            turf.pointToLineDistance(point, turf.polygonToLineString(polygon)) *
            1000;
          if (turf.booleanPointInPolygon(point, polygon)) {
            distance = distance * -1;
          }
        }
      }
      return distance;
    }

    function findNearbyFeatures(currentCoordinates, features) {
      var nearbyFeatures = [];
      currentPosition = turf.point(currentCoordinates, {});
      features.forEach((feature) => {
        if (turf.booleanIntersects(feature, searchPolygon)) {
          var distance = Math.round(
            distanceToPolygon(currentPosition, feature),
          );
          feature.properties.distance = distance;
          var nearestPoint = turf.nearestPointOnLine(
            turf.polygonToLine(feature),
            currentPosition,
          );
          var relativeBearing = Math.round(
            turf.rhumbBearing(
              currentPosition,
              nearestPoint.geometry.coordinates,
            ) - currentHeading,
          );
          if (relativeBearing < -180) {
            relativeBearing = relativeBearing + 360;
          }
          feature.properties.relativeBearing = relativeBearing;
          app.debug(
            "Intersects with %s (%dm at %d)",
            feature.properties.name,
            distance,
            relativeBearing,
          );
          nearbyFeatures.push(feature.properties);
        }
      });

      nearbyFeatures.sort(function (a, b) {
        return (
          parseFloat(Math.abs(a.distance)) - parseFloat(Math.abs(b.distance))
        );
      });

      return nearbyFeatures;
    }

    function rad2deg(radians) {
      return radians * (180 / Math.PI);
    }

    plugin.stop = function () {
      plugin.unsubscribes.forEach((f) => f());
    };

    restartPlugin = function () {
      plugin.restart();
    };
  };
  return plugin;
};
module.exports.app = "app";
module.exports.options = "options";
