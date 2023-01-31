# VHFinfo help

## Viewing info

### Layers
You can enable/disable different layer types using the ![26px](documentation/pictures/layers.png) button.
You can bring an overlapping layer to back by pressing the right mouse button on the underlaying shape.

### Splitview mode
You can disable/enable splitview mode (including map coordinates) using the ![26px](public/splitview.png) button.

### Compass mode
Compass mode will check your device to get the device heading and use that to 'look ahead' instead of 'around'.
Press the ![26px](public/compass.png) button to enable/disable compass mode.

### Follow mode
Follow mode will check your location every 5 seconds and center the map around your location.
Press the ![26px](public/arrow.png) button to enable/disable follow mode.

### Map coordinates
You can change format of the map coordinates by clicking the coordinates in the bottom left.

## Adding information
To add information you locate the area you want to edit.
Press the &#9998; button in the top left corner or the 'Edit' link in a popup to go to the edit page for that country info.

## Editing info
The only shapes to use are &#11203 (polygon) and &#9679; (circles). No 'points' as it's impossible to tell if you'll pass through the point.
See below for shape instructions.

When you're done editing, you can 'upload' your changes using the ![26px](public/upload.png) icon.

### Drawing the coordinates on the map
#### Lock
Only draw the full locks chambers (typically rectangles). It's OK to cross over land for multiple chambers

#### Bridge
Only draw under the bridge, fully from side to side (typically rectangles). This is important as for future routing to be able to see which areas will be crossed.

#### Marina
Draw a shape that covers the water (and land if that's simpler) of the marina.

#### VTS
Here it is important to cover the documented coordinates of the VTS as close as possible. In case of half circles on sea towards a port, it's ok to make it less detailed to reduce points)

#### Area
Draw where it applies.

### Adding details
Click a feature to edit the details.

#### Types
- VTS - Vessel Traffic Service
- VTS Radar Support - Specific channel for radar support in a VTS
- Lock
- Bridge
- Marina
- Area - non VTS larger area

## Related work
The VHFinfo project was started to be able to 'see' nearby VHF VTS areas, bridge and lock information using [SignalK](https://signalk.org/).

For example like this:
![95%](documentation/pictures/vhfinfo.png)

Underlaying data can be found [here on GitHub](https://github.com/htool/vhfinfo).

## Feedback

If you have comments/feedback, you can contact me at contact@vhfinfo.org.

## Donation

If you find the website and/or plugin useful, you can help adding data and/or keeping it up to date. Or show your appreciation with a donation.
