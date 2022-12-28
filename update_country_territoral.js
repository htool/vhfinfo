/*

Usage:
$ node update_country_territoral.js NLD

1. Read the properties from data/NLD_12Nm.json (if exists)
2. Fetch the latest JSON
3. Format and write data/NLD_12Nm.json

*/

const fs = require('fs');
const http = require('http')
const turf = require('@turf/turf')
const jsonFormat = require('json-format');
const myArgs = process.argv.slice(2);
const multigeojson = require('multigeojson');
var features = []

callback = function(response) {
  var str = '';

  //another chunk of data has been received, so append it to `str`
  response.on('data', function (chunk) {
    str += chunk;
  });

  //the whole response has been received, so we just print it out here
  response.on('end', function () {
    handleJson(JSON.parse(str))
  });
}

var country = myArgs[0]
var fileName = 'data/' + country + '_12Nm.json'
console.log("Reading original file: %s", fileName)

var original = {}
try {
  original = JSON.parse(fs.readFileSync(fileName))
} catch {
  console.log('File name found!')
  original.properties = {}
}

var mrgid_eez = getCode(country)
if (mrgid_eez != 'undefined') {
  console.log('Found mrgid_eez: %s', mrgid_eez)
} else {
  process.exit(1)
}

const host = "geo.vliz.be"
const path = "/geoserver/wfs?request=getfeature&service=wfs&version=1.1.0&typename=MarineRegions:eez_12nm&filter=%3CFilter%3E%3CPropertyIsEqualTo%3E%3CPropertyName%3Emrgid_eez%3C/PropertyName%3E%3CLiteral%3E" + mrgid_eez + "%3C/Literal%3E%3C/PropertyIsEqualTo%3E%3C/Filter%3E&outputFormat=json"

var options = {
  host: host,
  path: path
}

http.request(options, callback).end();

function handleJson(json) {

  for (const [key, value] of Object.entries(json.features)) {
    console.log('key: ' + key)
    // console.log('value: ' + JSON.stringify(value))
    for (const [feature, geometry] of Object.entries(value.geometry)) {
      console.log('feature: ' + feature)
      //console.log('geometry: ' + JSON.stringify(geometry))
      if (feature == 'coordinates') {
        //console.log('geometry: ' + JSON.stringify(geometry))
        for (const [nr, coordinates] of Object.entries(geometry)) {
          console.log('nr: ' + nr)
          coordinates.forEach(co => {
            var polygon = turf.polygon([co])
            var options = {tolerance: 0.01, highQuality: false};
            var simplified = turf.simplify(polygon, options)
            // console.log('simplified: ' + JSON.stringify(simplified.geometry.coordinates))
            simplified.properties = {
					    "name": country,
					    "callname": "",
					    "type": "territorial",
					    "vhfdata": {
					      "generic": {
					        "channel": 16,
					        "mode": "listen"
					      },
					      "emergency": {
                  "url": ""
					      }
					    }
					  }
            if (simplified.geometry.coordinates[0].length > 10) {
              features.push(simplified)
            }
          })
        }
      }
    }
  }
  writeFile(features)
}

function writeFile (json) {
  var content = {
    "type": "FeatureCollection",
    "features": features
  }
  //console.log(JSON.stringify(content))

  var config = {
    type: 'space',
    size: 2
  }
  fs.writeFileSync(fileName, jsonFormat(content, config))
}

function getCode (country) {
  var codes = {
    "GBR": "5696",
		"DZA": "8378",
		"ESP": "5693",
		"DZA": "8378",
		"ESP": "5693",
		"FRA": "5677",
		"ITA": "5682",
		"LBY": "8372",
		"GRC": "5679",
		"EGY": "8490",
		"CYP": "8376",
		"TUR": "5697",
		"BGR": "5672",
		"UKR": "5695",
		"TUR": "5697",
		"BGR": "5672",
		"UKR": "5695",
		"IRL": "5681",
		"GBR": "5696",
		"IRL": "5681",
		"FRA": "5677",
		"GBR": "5696",
		"FRA": "5677",
		"ESP": "5693",
		"IRL": "5681",
		"FRA": "5677",
		"IRL": "5681",
		"DNK": "5674",
		"SWE": "5694",
		"DNK": "5674",
		"NOR": "5686",
		"SWE": "5694",
		"BEL": "3293",
		"GBR": "5696",
		"NOR": "5686",
		"DEU": "5669",
		"DNK": "5674",
		"NLD": "5668",
		"NOR": "5686",
		"SJM": "8437",
		"NOR": "5686",
		"SJM": "33181",
		"PRT": "8361",
		"ESP": "5693",
		"IRL": "5681",
		"GBR": "5696",
		"ESP": "5693",
		"PRT": "5688",
		"FIN": "5676",
		"SWE": "5694",
		"RUS": "5690",
		"EST": "5675",
		"LVA": "5683",
		"EST": "5675",
		"ESP": "5693",
		"ITA": "5682",
		"MNE": "5691",
		"HRV": "5673",
		"ITA": "5682",
		"SVN": "5692",
		"GRC": "5679",
		"SWE": "5694",
		"DEU": "5669",
		"SWE": "5694",
		"POL": "5687",
		"SWE": "5694",
		"EST": "5675",
		"FIN": "5676"
	}
  return codes[country]
}
