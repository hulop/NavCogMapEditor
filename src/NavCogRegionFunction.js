/*******************************************************************************
 * Copyright (c) 2015 Chengxiong Ruan
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *******************************************************************************/
 
 function addNewRegion() {
	if (_currentLayer == null) {
		window.alert($i18n.t("You should have at least one layer"));
		return;
	};

	var regionName = _mapEditorRegionNameInput.value;
	if (regionName == "") {
		window.alert($i18n.t("Please input a name for region"));
		return
	};
	if (_currentLayer.regions[regionName]) {
		window.alert($i18n.t("Region with this name already exists"));
		return;
	};

	if (!_mapEditorRegionLngInput.value || !_mapEditorRegionLatInput.value) {
		window.alert($i18n.t("Please input both lat and lng"));
		return;
	};

	var file = _mapEditorImgChooser.files[0];
	if (!file) {
		window.alert($i18n.t("Please select a image"));
		return;
	};
	
	var fileReader = new FileReader();
	fileReader.onload = function(e) {
		var lat = parseFloat(_mapEditorRegionLatInput.value);
		var lng = parseFloat(_mapEditorRegionLngInput.value);
		var newRegion = getNewRegion({lat:lat, lng:lng, name:regionName, image:e.target.result});
		_currentLayer.regions[newRegion.name] = newRegion;
		_currentRegion = newRegion;
		var newOpt = document.createElement("option");
		newOpt.text = newRegion.name;
		_mapEditorRegionChooser.add(newOpt);
		_mapEditorRegionChooser.selectedIndex = _mapEditorRegionChooser.length - 1;
		renderRegion(newRegion);
	}
	fileReader.readAsDataURL(file);
}

function renderRegionsInLayer(layer) {
	console.log("render region");
    if (!layer) {return;}
    $util.renewSelectWithProertyOfArray(layer.regions, "name", _mapEditorRegionChooser);
    for (var region in layer.regions) {
		renderRegion(layer.regions[region]);
	}
	if (_mapEditorRegionChooser.value) {
		_currentRegion = layer.regions[_mapEditorRegionChooser.value]
	} else {
		_currentRegion = null;
	}
}

$editor.on("derender", function(e, layer) {
	console.log(["derender region", layer]);
	for (var region in layer?layer.regions:_regionOverlays) {
		_regionOverlays[region].setMap(null);
	}
	_currentRegion = null;
});

function renderRegion(region) {
	if (_regionOverlays[region.name]) {
		_regionOverlays[region.name].setMap(_map);
	} else {
		var regionOverlay = new FloorPlanOverlay();
	    var image = region.image;
	    if (!image.match(/^data/)) { // todo (remove) backward compati
		image = "./floorplan/"+image;
	    }
		regionOverlay.setOption({
		    src: image,
			lat: region.lat,
			lng: region.lng,
			name: region.name,
			ppm: region.ppm,
			width: 1000,
			height: 1000,
			rotate: region.rotate
		});
		regionOverlay.setMap(_map);
		_regionOverlays[region.name] = regionOverlay;
	}
}

function removeCurrentRegion() {
	if (_currentRegion != null) {
		_regionOverlays[_currentRegion.name].setMap(null);
		delete _regionOverlays[_currentRegion.name];
		delete _currentLayer.regions[_currentRegion.name];
		_mapEditorRegionChooser.remove(_mapEditorRegionChooser.selectedIndex);
		_currentRegion = null;
	};

	if (_mapEditorRegionChooser.value) {
		_currentRegion = _currentLayer.regions[_mapEditorRegionChooser.value];
	};
}