# VHFinfo
VHF channel information based on GeoJSON data. Plugin for SignalK included.

## Purpose
While sailing you're often expected to listen out certain VHF channels. Most of them can be found on the electronic maps, but not always in a handy way. And it requires you to know you have to look for it in advance.

By collection the VHF channel info together with coordinate information it's easy to display relevant information in the cockpit.

![VHF example display](./documentation/pictures/vhfinfo.png)

## Format used
The information is collected as [GeoJSON](https://geojson.org/) which holds both coordinates and properties.

## Viewing information
To see if certain VHF information is already present, you can use only of the following country links to see the data plotted on a map.

[NL](https://geojson.io/#data=data:text/x-url,https://github.com/htool/vhfinfo/data/NL.json&map=2/0/20)


## Adding information
To add information you'll have to
- Draw the coordinates on the map
- Add properties according to the properties template
- Create a change proposal to a country file

### Drawing the coordinates on the map
Goto [GeoJSON.io](https://geojson.io/) and draw the VHF channel area as a polygon.
For different types there are different instructions for drawing:

#### Lock
Only draw the full locks chambers (typically rectangles). It's OK to cross over land for multiple chambers
#### Bridge
Only draw under the bridge, fully from side to side (typically rectangles)
#### Marina
Free figure polygon that covers only the (land and water if that's simpler) marina
#### VTS
Here it is important to cover the documented coordinates of the VTS as close as possible, so likely a polygon. In case of half circles on sea towards a port, it's ok to make it less detailed to reduce points)

### Add properties according to the properties template
Use the following template to populate the properties part on the right in the [GeoJSON.io](https://geojson.io/) interface. Either copy the template in, or type over what you need. It's important to stick to the format.

### Properties template
```
      "properties": {
        "name": "",           // Full name
        "callname": "",       // Short name typically used in call
        "type": "",           // ['lock','bridge','marina','vts']
        "vhfdata": {
          "generic": {
            "channel": ,      // VHF channel number
            "mode": "listen"  // Radio engagement level for this AIS ship/group type
                              // 'listen':    Listen out the channel for any calls or information
                              // 'announce':  Announce you are entering/leaving the area, or intend to pass bridge/lock
                              // 'report':    More than announce, as certain info is expected. See 'note' for details
            "url": "",        // URL with generic info like opening hours, approach guide etc. or in case of non-generic purpose
            "phone": "",      // Phone number in E.164 formattingA
          "pleasure": {       // AIS ship/group type as string. (https://coast.noaa.gov/data/marinecadastre/ais/VesselTypeCodes2018.pdf)
            "url":  ""        // URL aimed at pleasure ships
          },
          "passenger": {
            "note": ""        // Note aimed at passenger ships
          },
          "fishing": {
            "mode": "announce"  // Overwrites mode for fishing ships
          },
          "cargo": {
            "mode": "report",
            "note": "",         // Extra details on what to report
            "url":  ""          // URL aimed at cargo ships
          }
        },
        "weather": {              // Weather bulletin in this VHF area
          "channel": ,            // Channel used
          "time": "5 5,11,17,23"  // weather bulletin at 5h05, 11h05, 17h05 and 23h05 (cron format)
        }
      }
    }
```

### Create a change proposal to a country file
- Go to the [VHFinfo GitHub repository](https://github.com/htool/vhfinfo/data/) and select the country file you want to add your data to, e.g. [NL](https://github.com/htool/vhfinfo/blob/main/data/NL.json).
- Press 'E' or use the pencil button on the top right of the file to start editing the file. Now copy-paste the `feature` part of the JSON from the [GeoJSON.io](https://geojson.io/) website into the GitHub editor.
- Add a `,` to the last `}` of the previous feature if needed.
- At the bottom click `submit proposal`

### Editing existing information
- Go to the [VHFinfo GitHub repository](https://github.com/htool/vhfinfo/data/) and select the country file you want to edit, e.g. [NL](https://github.com/htool/vhfinfo/blob/main/data/NL.json).
- Press 'E' or use the pencil button on the top right of the file to start editing the file.
- Make your changes
- At the bottom click `submit proposal`
