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

  var schema = {
    type: "object",
    properties: {
      angle: {
        type: "number",
        title: "Beam angle",
        default: 90,
        minimum: 1,
        maximum: 360,
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
      minimumSpeedForCogKn: {
        type: "number",
        title: "Minimum speed for using COG (knots)",
        description:
          "Below this speed COG is ignored and an omnidirectional search is used.",
        default: 0.5,
        minimum: 0,
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
            title: "Areas (operational)",
            type: "boolean",
          },
          information: {
            title: "Information",
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
    const regions = require("./regions");
    const deltas = require("./deltas");

    var userDir = app.config.configPath;
    var dataDir = path.join(userDir, "/node_modules/vhfinfo/data/");

    var currentHeading = null;
    var currentSpeed = null;
    var currentCoordinates = null;
    var lastCoordinates = null;
    var currentPosition = null;
    var headingTrue = false;
    var headingMagnetic = false;
    var minimumSpeedForCogKn = Number(options.minimumSpeedForCogKn);
    if (!Number.isFinite(minimumSpeedForCogKn)) {
      minimumSpeedForCogKn = 0.5;
    }
    var minimumSpeedForCogMs = minimumSpeedForCogKn / 1.943844;

    function validHeadingDegrees(value) {
      var radians = Number(value);
      if (!Number.isFinite(radians)) {
        return null;
      }
      var degrees = rad2deg(radians);
      if (!Number.isFinite(degrees) || degrees < 0 || degrees >= 360) {
        return null;
      }
      return degrees;
    }

    function useOmnidirectionalSearch(status) {
      if (headingTrue == false && headingMagnetic == false) {
        currentHeading = null;
        pluginStatus = status;
      }
    }

    app.streambundle
      .getSelfStream("navigation.position")
      .forEach((position) => {
        if (position) {
          currentCoordinates = [position.longitude, position.latitude];
        }
      });

    app.streambundle
      .getSelfStream("navigation.speedOverGround")
      .forEach((speed) => {
        currentSpeed = Number(speed);
        if (
          !Number.isFinite(currentSpeed) ||
          currentSpeed < minimumSpeedForCogMs
        ) {
          useOmnidirectionalSearch("Started - stationary, using bbox");
        }
      });

    app.streambundle
      .getSelfStream("navigation.headingTrue")
      .forEach((heading) => {
        var degrees = validHeadingDegrees(heading);
        headingTrue = degrees != null;
        if (headingTrue) {
          currentHeading = degrees;
          headingTrue = true;
          pluginStatus = "Started - using headingTrue";
        } else if (headingMagnetic == false) {
          useOmnidirectionalSearch(
            "Started - no valid heading, using bbox",
          );
        }
      });

    app.streambundle
      .getSelfStream("navigation.headingMagnetic")
      .forEach((heading) => {
        if (headingTrue == false) {
          var degrees = validHeadingDegrees(heading);
          headingMagnetic = degrees != null;
          if (headingMagnetic) {
            currentHeading = degrees;
            pluginStatus = "Started - using headingMagnetic";
          } else {
            useOmnidirectionalSearch(
              "Started - no valid heading, using bbox",
            );
          }
        }
      });

    app.streambundle
      .getSelfStream("navigation.courseOverGroundTrue")
      .forEach((heading) => {
        if (headingTrue == false && headingMagnetic == false) {
          var degrees = validHeadingDegrees(heading);
          if (
            degrees != null &&
            Number.isFinite(currentSpeed) &&
            currentSpeed >= minimumSpeedForCogMs
          ) {
            currentHeading = degrees;
            pluginStatus = "Started - underway, using COG";
          } else if (
            !Number.isFinite(currentSpeed) ||
            currentSpeed < minimumSpeedForCogMs
          ) {
            useOmnidirectionalSearch("Started - stationary, using bbox");
          } else {
            useOmnidirectionalSearch("Started - invalid COG, using bbox");
          }
        }
      });

    app.debug("options: %s", JSON.stringify(options));

    function handleOptions(req, res) {
      res.contentType("application/json");
      res.send(JSON.stringify(options));
    }
    function handleNearby(req, res) {
      res.contentType("application/json");
      res.status(200).send(JSON.stringify(nearbyFeatures));
    }

    plugin.registerWithRouter = function (router) {
      app.debug("registerWithRouter");
      router.get("/options", handleOptions);
      router.get("/nearby", handleNearby);
    };

    // SK 2.x /plugins is admin-only. MFD/readonly clients use /signalk/v1/api.
    plugin.signalKApiRoutes = function (router) {
      router.get("/vhfinfo/options", handleOptions);
      router.get("/vhfinfo/nearby", handleNearby);
      return router;
    };

    var distance = options.distance; // m
    var angle = options.angle; // Degrees
    var size = options.size; // Nm

    var featuresInBox = [];
    var nearbyFeatures = [];
    var featureCount = 0;
    var searchPolygon;

    if (typeof app.registerResourceProvider === "function") {
      app.registerResourceProvider({
        type: "regions",
        methods: regions.createRegionProviderMethods(function () {
          return {
            features: featuresInBox,
            position: currentCoordinates,
            beamMeters: distance,
            $source: regions.SOURCE,
          };
        }),
      });
    }

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
      var values = deltas.buildUpdates(features, {
        path: options.path,
        pathNr: options.pathNr,
        types: options.types,
      });
      app.debug("sendUpdates: %s", JSON.stringify(values));
      app.handleMessage(plugin.id, {
        updates: [
          {
            values: values,
          },
        ],
      });
    }

    function createSearchPolygon() {
      if (currentCoordinates != null && currentHeading != null) {
        currentPosition = turf.point(currentCoordinates, {});
        var options = { units: "meters" };
        if (angle >= 360) {
          return turf.circle(currentPosition, distance, {
            steps: 64,
            units: "meters",
          });
        }
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
          if (
            Number.isFinite(currentSpeed) &&
            currentSpeed < minimumSpeedForCogMs
          ) {
            pluginStatus = "Started - stationary, using bbox";
          } else {
            pluginStatus =
              "Started. Still missing heading or COG. Using bbox for now.";
          }
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

    function isInformationType(type) {
      return String(type || "").toLowerCase() === "information";
    }

    function informationCenterPoint(feature) {
      try {
        var center = turf.centroid(feature);
        if (
          center &&
          center.geometry &&
          Array.isArray(center.geometry.coordinates)
        ) {
          return center;
        }
      } catch (e) {}
      return null;
    }

    function relativeBearingTo(target) {
      var bearingReference = Number.isFinite(currentHeading)
        ? currentHeading
        : 0;
      var relativeBearing = Math.round(
        turf.rhumbBearing(currentPosition, target) - bearingReference,
      );
      if (relativeBearing < -180) {
        relativeBearing = relativeBearing + 360;
      }
      return relativeBearing;
    }

    function annotateBeamFeature(feature) {
      var distance = Math.round(distanceToPolygon(currentPosition, feature));
      feature.properties.distance = distance;
      var nearestPoint = turf.nearestPointOnLine(
        turf.polygonToLine(feature),
        currentPosition,
      );
      var relativeBearing = relativeBearingTo(
        nearestPoint.geometry.coordinates,
      );
      feature.properties.relativeBearing = relativeBearing;
      app.debug(
        "Intersects with %s (%dm at %d)",
        feature.properties.name,
        distance,
        relativeBearing,
      );
      return feature.properties;
    }

    function annotateInformationFeature(feature) {
      if (!turf.booleanPointInPolygon(currentPosition, feature)) {
        return null;
      }
      var center = informationCenterPoint(feature);
      if (!center) {
        return null;
      }
      var distance = Math.round(
        turf.distance(currentPosition, center, { units: "meters" }),
      );
      feature.properties.distance = distance;
      feature.properties.relativeBearing = relativeBearingTo(center);
      app.debug(
        "Information %s inside (%dm to center at %d)",
        feature.properties.name,
        distance,
        feature.properties.relativeBearing,
      );
      return feature.properties;
    }

    function findNearbyFeatures(currentCoordinates, features) {
      var operationalFeatures = [];
      var informationFeatures = [];
      currentPosition = turf.point(currentCoordinates, {});
      features.forEach((feature) => {
        if (
          isInformationType(feature.properties && feature.properties.type)
        ) {
          var infoProps = annotateInformationFeature(feature);
          if (infoProps) {
            informationFeatures.push(infoProps);
          }
          return;
        }
        if (searchPolygon && turf.booleanIntersects(feature, searchPolygon)) {
          operationalFeatures.push(annotateBeamFeature(feature));
        }
      });

      operationalFeatures.sort(function (a, b) {
        return (
          parseFloat(Math.abs(a.distance)) - parseFloat(Math.abs(b.distance))
        );
      });
      informationFeatures.sort(function (a, b) {
        return parseFloat(a.distance) - parseFloat(b.distance);
      });

      return operationalFeatures.concat(informationFeatures);
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
