var turf = require('@turf/turf')
var features = require('./netherlands.json')
var searchPolygon

var heading = 270
// var currentCoordinates = [4.562796100242679, 52.46179821916698] // Seaport
// var currentCoordinates = [4.982820456584534, 52.3718543963401] // Oranjesluis
var currentCoordinates = [4.590889174749805, 52.46419081109542] // Zeesluis IJmuiden
var currentPosition = turf.point(currentCoordinates, { })

var nearbyFeatures = []

function updateSearchPolygon () {
  var distance = 4000;
  var options = {units: 'meters'};
  
  var bearing = heading - 45;
  var pointA = turf.rhumbDestination(currentPosition, distance, bearing, options);
  // console.log(pointA);

  var bearing = heading + 45;
  var pointB = turf.rhumbDestination(currentPosition, distance, bearing, options);
  // console.log(pointB);

  searchPolygon = turf.polygon([[
    currentCoordinates,
    pointA.geometry.coordinates,
    pointB.geometry.coordinates,
    currentCoordinates
  ]], {name: 'searchPolygon' });
  
  console.log(JSON.stringify(searchPolygon))

}

updateSearchPolygon();


function distanceToPolygon(point, polygon) {
  if (polygon.type === "Feature") { polygon = polygon.geometry }
  let distance;
  if (polygon.type === "MultiPolygon") {
    distance = polygon.coordinates
      .map(coords => distanceToPolygon({ point, polygon: turf.polygon(coords).geometry }))
      .reduce((smallest, current) => (current < smallest ? current : smallest));
  } else {
    if (polygon.coordinates.length > 1) {
      // Has holes
      const [exteriorDistance, ...interiorDistances] = polygon.coordinates.map(coords =>
        distanceToPolygon({ point, polygon: turf.polygon([coords]).geometry })
      );
      if (exteriorDistance < 0) {
        // point is inside the exterior polygon shape
        const smallestInteriorDistance = interiorDistances.reduce(
          (smallest, current) => (current < smallest ? current : smallest)
        );
        if (smallestInteriorDistance < 0) {
          // point is inside one of the holes (therefore not actually inside this shape)
          distance = smallestInteriorDistance * -1;
        } else {
          // find which is closer, the distance to the hole or the distance to the edge of the exterior, and set that as the inner distance.
          distance = smallestInteriorDistance < exteriorDistance * -1
            ? smallestInteriorDistance * -1
            : exteriorDistance;
        }
      } else {
        distance = exteriorDistance;
      }
    } else {
      // The actual distance operation - on a normal, hole-less polygon (converted to meters)
      distance = turf.pointToLineDistance(point, turf.polygonToLineString(polygon)) * 1000;
      if (turf.booleanPointInPolygon(point, polygon)) {
        distance = distance * -1;
      }
    }
  }
  return distance
}

var feature = features.features[1];

Object.values(features.features).forEach(feature => {
  if (turf.booleanIntersects(feature, searchPolygon)) {
    var distance = Math.round(distanceToPolygon(currentPosition, feature))
    feature.properties.distance = distance
    var nearestPoint = turf.nearestPointOnLine(turf.polygonToLine(feature), currentPosition)
    var relativeBearing = Math.round(turf.rhumbBearing(currentPosition, nearestPoint.geometry.coordinates) - heading)
    if (relativeBearing < -180) {
      relativeBearing = relativeBearing + 360
    }
    feature.properties.relativeBearing = relativeBearing
    console.log('Intersects with %s (%dm at %d)', feature.properties.name, distance, relativeBearing)
    nearbyFeatures.push(feature)
  }
});

nearbyFeatures.sort(function(a, b) {
    return parseFloat(Math.abs(a.properties.distance)) - parseFloat(Math.abs(b.properties.distance));
});

console.log('Features:');
var sectorFound = false;
for (var key in nearbyFeatures) {
  var nearbyFeature = nearbyFeatures[key].properties
  console.log(nearbyFeature)
  if (sectorFound == false && nearbyFeature.type == 'sector') {
    if (nearbyFeature.distance < 0) {
      console.log('Inside sector: %s [%d]', nearbyFeature.name, nearbyFeature.channel)
    } else {
      console.log('Near sector: %s [%d] (%dm at %d degrees)', nearbyFeature.name, nearbyFeature.channel, nearbyFeature.distance, nearbyFeature.relativeBearing)
    }
    sectorFound = true;
  } else {
    if (nearbyFeature.distance < 0) {
      console.log('Inside %s: %s [%d]', nearbyFeature.type, nearbyFeature.name, nearbyFeature.channel)
    } else {
      console.log('Near %s: %s [%d] (%dm at %d degrees)', nearbyFeature.type, nearbyFeature.name, nearbyFeature.channel, nearbyFeature.distance, nearbyFeature.relativeBearing)
    }
    sectorFound = true;
  }

}
