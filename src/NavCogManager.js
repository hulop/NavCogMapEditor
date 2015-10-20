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
 
 function loaded() {
	reloadData();
	initMapEvent();
	initKeyboardEvent();
}

function reloadData() {
	var strData = localStorage.getItem(_dataStorageLabel);
	if (strData == null) {
	    _data = {};
	} else {
	    _data = JSON.parse(strData);
	}
	reloadMap();
}	

function reloadMap() {
	try {
		_map = getNewGoogleMap();
		//setMapVisibility(_data.doneUseMap);
	} catch(e) {
	}
	if (_map && _data.centerLat && _data.centerLng) {	
		_map.setCenter({lat:_data.centerLat, lng:_data.centerLng});
		_map.setZoom(_data.zoom || 20);
	}
	
	_maxNodeID = _data.maxNodeID || _maxNodeID;
	_maxEdgeID = _data.maxEdgeID || _maxEdgeID;
	_maxBeaconID = _data.maxBeaconID || _maxBeaconID;
	_lastUUID = _data["lastUUID"];
	_lastMajorID = _data["lastMajorID"];
	_lastMinorID = _data["lastMinorID"];
        _layers = _data.layers || {};
	_buildingNames = _data.buildings || [];
	for (var name in _buildingNames) {
		addOptionToSelect(_buildingNames[name], _topoEditorBuildingChooser);
	}
	for (var layer in _layers) {
		addOptionToSelect(_layers[layer].z, _mapEditorLayerChooser);
		addOptionToSelect(_layers[layer].z, _topoEditorLayerChooser);
		addOptionToSelect(_layers[layer].z, _beaconEditorLayerChooser);
	}

	/*
	for (var z in _layers) {
		var layer = _layers[z];
		for (var beaconID in layer.beacons) {
			var beacon = layer.beacons[beaconID];
			beacon.beSurprise = false;
			beacon.surpriseInfo = "";
		}
	}
	*/
	
	_currentLayer = _layers[_mapEditorLayerChooser.value];
	renderLayer(_currentLayer);
}

function initMapEvent() {
	if (!_map) {
		return;
	}
	_map.addListener("center_changed", function(e) {
		_data.centerLat = _map.getCenter().lat();
		_data.centerLng = _map.getCenter().lng();
		_data.zoom = _map.getZoom();
	});
    _map.addListener("click", function(e) {
    	if (_currentLayer == null) {
    		window.alert(i18n.t("Please add at least one layer"));
    		return;
    	};
    	_mapEditorRegionLatInput.value = e.latLng.lat();
    	_mapEditorRegionLngInput.value = e.latLng.lng();
    	_edgeInfoWindow.close();
    	_nodeInfoWindow.close();
    	_beaconInfoWindow.close();

		if (_currentEditMode == EditMode.Map) {

		} else if (_currentEditMode == EditMode.Topo) {
			switch (_currentTopoEditState) {
				case TopoEditState.Adding_Node:
					if (_currentLayer != null) {
						_maxNodeID++;
						addNewNode(e.latLng, _maxNodeID.toString(), _layers);
					};
			    	break;
			    default:
			    	break;
			}
		} else if (_currentEditMode == EditMode.Beacon) {
			if (_currentBeaconEditState == BeaconEditState.Adding_Beacon) {
				_maxBeaconID++;
				_lastMinorID++;
				addNewBeacon(e.latLng, _maxBeaconID.toString(), _lastUUID, _lastMajorID, _lastMinorID.toString());
			};
		}
    });

    _map.addListener("mousemove", function(e) {
    	if (_currentEditMode == EditMode.Topo) {
    		if (_currentTopoEditState == TopoEditState.Adding_Edge) {
    			if (_currentEdgeEditState == EdgeEditState.Waiting_Next_Node) {
    				if (_tmpEdgeLine == null) {
    					var path = [];
    					path.push({lat:_tmpEdgeNode1.lat, lng:_tmpEdgeNode1.lng});
						path.push({lat:e.latLng.lat(), lng:e.latLng.lng()});
						_tmpEdgeLine = new google.maps.Polyline({
							map: _map,
							path: path,
							strokeColor: "#00B4B4",
							strokeWeight: 10,
							strokeOpacity: 1.0,
						});
						_tmpEdgeLine.addListener("click", function(e) {
							if (_currentEditMode == EditMode.Topo) {
								if (_currentTopoEditState == TopoEditState.Adding_Edge) {
									if (_currentEdgeEditState == EdgeEditState.Waiting_Next_Node) {
							    		_maxNodeID++;
							    		_tmpEdgeNode2 = addNewNode(e.latLng, _maxNodeID.toString(), _layers);
							    		_maxEdgeID++;
							    		addNewEdge(_maxEdgeID.toString(), _tmpEdgeNode1, _tmpEdgeNode2, _tmpEdgeLine);
							    		_currentEdgeEditState = EdgeEditState.Edge_Done;
							    	};
								};
							};
						});
						_tmpEdgeLine.addListener("mousemove", function(e) {
							if (_currentEditMode == EditMode.Topo) {
								if (_currentTopoEditState == TopoEditState.Adding_Edge) {
									if (_currentEdgeEditState == EdgeEditState.Waiting_Next_Node) {
										var path = [];
										path.push({lat:_tmpEdgeNode1.lat, lng:_tmpEdgeNode1.lng});
										path.push({lat:e.latLng.lat(), lng:e.latLng.lng()});
										_tmpEdgeLine.setPath(path);
									}
								} else if (_currentTopoEditState == TopoEditState.Draging_Node) {
									_nodeMarkers[_currentNode.id].setPosition(e.latLng);
									_currentLayer.nodes[_currentNode.id].lat = e.latLng.lat();
									_currentLayer.nodes[_currentNode.id].lng = e.latLng.lng();
									var path = [];
									path.push({lat:_tmpEdgeNode1.lat, lng:_tmpEdgeNode1.lng});
									path.push({lat:e.latLng.lat(), lng:e.latLng.lng()});
									_tmpEdgeLine.setPath(path);
								}
							}
						})
    				} else {
    					var path = [];
						path.push({lat:_tmpEdgeNode1.lat, lng:_tmpEdgeNode1.lng});
						path.push({lat:e.latLng.lat(), lng:e.latLng.lng()});
						_tmpEdgeLine.setPath(path);
    				}
    			};
    		};
    	};
    })
}

function initKeyboardEvent() {
	document.addEventListener("keydown", function(e) {
		switch (_currentEditMode) {
			case EditMode.Topo:
				if (e.keyCode == 65) { // "A" pressed
					_currentTopoEditState = TopoEditState.Adding_Node;
				} else if (e.keyCode == 83) { // "S" pressed
					_currentTopoEditState = TopoEditState.Adding_Edge;
				}
				break;
			case EditMode.Beacon:
				if (e.keyCode == 65) { // "A" pressed
					_currentBeaconEditState = BeaconEditState.Adding_Beacon;
				}
				break;
			default:
				break;
		}
	});

	document.addEventListener("keyup", function(e) {
		if (_currentTopoEditState == TopoEditState.Adding_Edge) {
			if (_currentEdgeEditState != EdgeEditState.Edge_Done) {
				if (_tmpEdgeLine) {
					_tmpEdgeLine.setMap(null);
				};
				_tmpEdgeLine = null;
				_tmpEdgeNode1 = null;
				_tmpEdgeNode2 = null;
			};
		}
		_currentEdgeEditState = EdgeEditState.Doing_Nothing;
		_currentTopoEditState = TopoEditState.Doing_Nothing;
		_currentBeaconEditState = BeaconEditState.Doing_Nothing;
	})
}

function addNewLayer() {
	if (_layers[_mapEditorLayerInput.value]) {
		window.alert(i18n.t("A layer with same z-index has been added"));
	} else if (_mapEditorLayerInput.value == "") {
		window.alert(i18n.t("Please input a z-index"));
	} else {
		var newLayer = getNewLayer({z:_mapEditorLayerInput.value});
		_layers[newLayer.z] = newLayer;
		if (_currentLayer == null) {
			_currentLayer = newLayer;
		};
		addOptionToSelect(newLayer.z, _mapEditorLayerChooser);
		addOptionToSelect(newLayer.z, _topoEditorLayerChooser);
		addOptionToSelect(newLayer.z, _beaconEditorLayerChooser);
		// after adding a new layer, you should add the transit info to all the nodes
		for (var z in _layers) {
			for (var nodeID in _layers.nodes) {
				var node = _layers.nodes[nodeID];
				node.transitInfo[newLayer.z] = getNewTransitInfoToLayer(newLayer);
			}
		}
	}
}

function reRenderElementsOfLayer(layer) {
	deRenderNodesInLayer(layer);
	deRenderEdgesInLayer(layer);
	deRenderBeaconsInLayer(layer);
	if (_currentEditMode == EditMode.Topo) {
		renderNodesInLayer(layer);
		renderEdgesInLayer(layer);
	} else if (_currentEditMode == EditMode.Beacon) {
		renderBeaconsInLayer(layer);
	}
}

function renderLayer(layer) {
	renderRegionsInLayer(layer);
	if (_currentEditMode == EditMode.Topo) {
		renderNodesInLayer(layer);
		renderEdgesInLayer(layer);
	} else if (_currentEditMode == EditMode.Beacon) {
		renderBeaconsInLayer(layer);
	}
}

function deRenderLayer(layer) {
	deRenderRegionsInLayer(layer);
	deRenderNodesInLayer(layer);
	deRenderEdgesInLayer(layer);
	deRenderBeaconsInLayer(layer);
}

function addNewBuildingName() {
	if (document.getElementById("topo-add-building-input").value) {
		_buildingNames.push(document.getElementById("topo-add-building-input").value);
		addOptionToSelect(_buildingNames[_buildingNames.length - 1], _topoEditorBuildingChooser);
	}
}

function removeBuilding() {
	if (_topoEditorBuildingChooser.value) {
		for (var i = 0; i < _buildingNames.length; i++) {
			if (_buildingNames[i] == _topoEditorBuildingChooser.value) {
				_buildingNames.splice(i, 1);
				break;
			};
		};
		_topoEditorBuildingChooser.remove(_topoEditorBuildingChooser.selectedIndex);
	};
}

function enableFileManager() {
	_edgeInfoWindow.close();
	_nodeInfoWindow.close();
	_beaconInfoWindow.close();
	_currentEditMode = EditMode.File;
	if (_currentLayer) {
		reRenderElementsOfLayer(_currentLayer);
	};
}

function enableMapEditor() {
	_edgeInfoWindow.close();
	_nodeInfoWindow.close();
	_beaconInfoWindow.close();
	_currentEditMode = EditMode.Map;
	if (_currentLayer) {
		reRenderElementsOfLayer(_currentLayer);
	};
}

function enableTopoEditor() {
	_edgeInfoWindow.close();
	_nodeInfoWindow.close();
	_beaconInfoWindow.close();
	_currentEditMode = EditMode.Topo;
	if (_currentLayer) {
		reRenderElementsOfLayer(_currentLayer);
	};
}

function enableBeaconManager() {
	_edgeInfoWindow.close();
	_nodeInfoWindow.close();
	_beaconInfoWindow.close();
	_currentEditMode = EditMode.Beacon;
	if (_currentLayer) {
		reRenderElementsOfLayer(_currentLayer);
	};
}

function saveLocally() {
	_data["maxNodeID"] = _maxNodeID;
	_data["maxEdgeID"] = _maxEdgeID;
	_data["maxBeaconID"] = _maxBeaconID;
	_data["layers"] = _layers;
	_data["buildings"] = _buildingNames;
	_data["lastUUID"] = _lastUUID;
	_data["lastMajorID"] = _lastMajorID;
	_data["lastMinorID"] = _lastMinorID;
	localStorage.setItem(_dataStorageLabel, JSON.stringify(_data));
}

function saveToDowndloadFile() {
	_data["maxNodeID"] = _maxNodeID;
	_data["maxEdgeID"] = _maxEdgeID;
	_data["maxBeaconID"] = _maxBeaconID;
	_data["layers"] = _layers;
	_data["buildings"] = _buildingNames;
	_data["lastUUID"] = _lastUUID;
	_data["lastMajorID"] = _lastMajorID;
	_data["lastMinorID"] = _lastMinorID;
	var filename = "NavCogMapData.json";
    var blob = new Blob([JSON.stringify(_data)], { type: 'text/json;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style = "visibility:hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

function removeAllData() {
	localStorage.removeItem(_dataStorageLabel);
}

function addOptionToSelect(text, chooser) {
	newOpt = document.createElement("option");
	newOpt.text = text;
	chooser.add(newOpt);
}

function renewSelectWithProertyOfArray(array, property, chooser) {
	while (chooser.value) {
		chooser.remove(chooser.selectedIndex);
	}
	for (var key in array) {
		var newOpt = document.createElement("option");
		newOpt.text = (array[key])[property];
		chooser.add(newOpt);
	}
}

function renewSelectWithProertyOfArrayWithDummy(array, property, dummy, chooser) {
	while (chooser.value) {
		chooser.remove(chooser.selectedIndex);
	}
	var newOpt = document.createElement("option");
	newOpt.text = i18n.t(dummy);
	newOpt.value = dummy;
	chooser.add(newOpt);
	for (var key in array) {
		var newOpt = document.createElement("option");
		newOpt.text = (array[key])[property];
		chooser.add(newOpt);
	}
}

function selectOptWithText(text, chooser) {
	if (chooser.length == 0) {
		return;
	};
	for (var i = 0; i < chooser.length; i++) {
		var opt = chooser.childNodes[i];
		if (opt.text == text) {
			chooser.selectedIndex = i;
			return;
		};
	}
	chooser.selectedIndex = 0;
}

function changeDontUseMap() {
	var dontUseMap = document.getElementById("dont-use-map-check").checked;
	_data.dontUseMap = dontUseMap;
	setMapVisibility(dontUseMap);
	//document.getElementById("google-map-view").style.display = dontUseMap?"none":"block";
}

function setMapVisibility(dontUseMap) {
	var GOOGLE_MAP_INVISIVLE_STYLE = { "stylers": [ { "visibility": "off" } ] };
	if (_map) {
		if (dontUseMap) {
			_map.setOptions({styles: [GOOGLE_MAP_INVISIVLE_STYLE]});
			_map.setCenter({lat:0,lng:0});
			_map.setZoom(21);
			_map.setOptions({minZoom:18});
		} else {
			_map.setOptions({styles: [GOOGLE_MAP_DEFAULT_STYLE]});
			_map.setCenter({lat:_data.centerLat,lng:_data.centerLng})
			_map.setOptions({minZoom:0});
		}
	}
}
