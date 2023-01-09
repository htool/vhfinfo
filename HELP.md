# VHFinfo
VHF channel information based on GeoJSON data. Plugin for SignalK included.

## Adding information
To add information you open the [online map](https://htool.github.io/vhfinfo/public/index.html) and locate the area you want to edit.
Press the pencil icon in the top left corner to go to the edit page for that country.

### Drawing the coordinates on the map
Goto one of the following country linke and draw the VHF channel area as a polygon.
For different types there are different instructions for drawing:

#### Lock
Only draw the full locks chambers (typically rectangles). It's OK to cross over land for multiple chambers
#### Bridge
Only draw under the bridge, fully from side to side (typically rectangles)
#### Marina
Free figure polygon that covers only the (land and water if that's simpler) marina
#### VTS
Here it is important to cover the documented coordinates of the VTS as close as possible, so likely a polygon. In case of half circles on sea towards a port, it's ok to make it less detailed to reduce points)
