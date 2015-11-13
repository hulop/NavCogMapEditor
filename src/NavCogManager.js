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
 
$db.on("dbopen", function(e) {
	$db.getData(function(data) {
		_data = data;
		$editor.trigger("dataLoaded");
		$(window).trigger("hashchange");
	});
});

 function loaded() {
	$db.open()
	//reloadData();
	initKeyboardEvent();
}

function reloadData() {
	var strData = localStorage.getItem(_dataStorageLabel);
	if (strData == null) {
	    _data = {};
	} else {
	    _data = JSON.parse(strData);
	}
	$editor.trigger("dataLoaded");
	$(window).trigger("hashchange");
}	

$editor.on("dataLoaded", function() {
    _layers = _data.layers || {};
	_maxNodeID = _data.maxNodeID || 0;
	_maxEdgeID = _data.maxEdgeID || 0;
	_maxBeaconID = _data.maxBeaconID || 0;
	_layers = _data.layers || {};
	_buildings = _data.buildings || [];
	_lastUUID = _data.lastUUID;
	_lastMajorID = _data.lastMajorID;
	_lastMinorID = _data.lastMinorID;
	_buildings = _data.buildings || {};
	_uuids = _data.uuids || {};

	// for backward compatibility (array -> hash change)
	if (_buildings.constructor == Array) {
		var newHash = {};
		for(var i = 0; i < _buildings.length; i++) {
			var name = _buildings[i];
			newHash[name] = {"name":name};
		}
		_buildings = newHash;
	}
	// for backward compatibility (poiInfo -> destInfo, surpriseInfo -> poiInfo)
	for(var c in $.extend({"":false},_data.languages)) {
		for ( var l in _layers) {
			for ( var n in _layers[l].nodes) {
				for ( var i in _layers[l].nodes[n].infoFromEdges) {
					var node = _layers[l].nodes[n].infoFromEdges[i];
					if (node[$i18n.k("poiInfo", c)]) {
						node[$i18n.k("destInfo", c)] = node[$i18n.k("poiInfo", c)];
						delete node[$i18n.k("poiInfo", c)];
					}
				}
			}
			for ( var b in _layers[l].beacons) {
				var beacon = _layers[l].beacons[b];
				if (beacon[$i18n.k("surpriseInfo", c)]) {
					beacon[$i18n.k("poiInfo", c)] = beacon[$i18n.k("surpriseInfo", c)];
					delete beacon[$i18n.k("surpriseInfo", c)];
				}
			}
		}
	}
	
	try {
		_map = getNewGoogleMap();
		initMapEvent();
	} catch(e) {
	}
	if (_map && _data.centerLat && _data.centerLng) {	
		_map.setCenter({lat:_data.centerLat, lng:_data.centerLng});
		_map.setZoom(_data.zoom || 20);
	}
	
	$editor.trigger("derender");
	$editor.trigger("layerChange");
	$editor.trigger("buildingChange");
	$editor.trigger("languageChange", _data.languages);

	renderLayer(_currentLayer);
});

$editor.on("layerChange", function(e, layer) {
	$util.renewSelectWithProertyOfArray(_layers, "z", _mapEditorLayerChooser, layer&&layer.z);
	$util.renewSelectWithProertyOfArray(_layers, "z", _topoEditorLayerChooser, layer&&layer.z);
	$util.renewSelectWithProertyOfArray(_layers, "z", _beaconEditorLayerChooser, layer&&layer.z);
	_currentLayer = layer || _layers[_mapEditorLayerChooser.value];
});

$editor.on("buildingChange", function(e, building) {
	$util.setOptions("topo-building-chooser",$util.getLangAttrs(_buildings,"name")); 
	
	$("#building_lang").text("(" + $i18n.getLanguageCodeString() + ")");
	var option = $util.getSelectedOption("topo-building-chooser");
	if (option) {
		$("#building_lang_name").val($util.getLangAttr(_buildings[option.value], "name"));
	}
});

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
    		window.alert($i18n.t("Please add at least one layer"));
    		return;
    	};
    	_mapEditorRegionLatInput.value = e.latLng.lat();
    	_mapEditorRegionLngInput.value = e.latLng.lng();
    	$NC.infoWindow.trigger("closeall");

		if (_currentEditMode == EditMode.Map) {

		} else if (_currentEditMode == EditMode.Topo) {
			switch (_currentTopoEditState) {
				case TopoEditState.Adding_Node:
					if (_currentLayer != null) {
						_maxNodeID++;
						addNewNode(e.latLng, _maxNodeID.toString(), _layers);
					};
			    	break;
				case TopoEditState.Adding_POI:
					if (_currentLayer && _currentEdge && _tmpEdgeLine) {
						$NC.poi.add(e.latLng, _currentEdge, _tmpEdgeLine, _currentLayer);
						_tmpEdgeLine = null;
					}
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
    
    function findShortestPointFromEdge(latLng) {
		var p = _map.getProjection().fromLatLngToPoint(latLng);
		var lines = [];
		for(var k in _edgePolylines) {
			var edge = _edgePolylines[k];
			var path = edge.getPath();
			var p1 = _map.getProjection().fromLatLngToPoint(path.getAt(0));
			for(var i = 1; i < path.getLength(); i++) {
				p2 = _map.getProjection().fromLatLngToPoint(path.getAt(i));
				lines.push({
					p1: p1,
					p2: p2,
					edge: _currentLayer.edges[k]
				});
				p1 = p2;
			}
		}
		var min = Number.MAX_VALUE;
		var minp = null;
		var mine = null;
		lines.forEach(function(l) {
			var tp = $geom.getNearestPointOnLineSegFromPoint(l, p);
			var d = $geom.getDistanceOfTwoPoints(p, tp);
			if (d < min) {
				min = d;
				minp = tp;
				mine = l.edge;
			}
		});
		if (mine == null) {
			return null;
		}
		return {
			p: _map.getProjection().fromPointToLatLng(new google.maps.Point(minp.x, minp.y)),
			edge: mine
		};
    }
    
    _map.addListener("mousemove", function(e) {
    	if (_currentEditMode == EditMode.Topo) {
    		if (_currentTopoEditState == TopoEditState.Adding_POI) {
    			if (_tmpEdgeLine == null) {
    				var pe = findShortestPointFromEdge(e.latLng);
    				if (pe == null) {
    					return;
    				}
    				var path = [e.latLng, pe.p];
    				_currentEdge = pe.edge;
    				_tmpEdgeLine = $NC.poi.newLine(_map, path);
    				google.maps.event.addListenerOnce(_tmpEdgeLine, "click", function(e) {
    					if (_currentLayer && _currentEdge && _tmpEdgeLine) {
    						$NC.poi.add(e.latLng, _currentEdge, _tmpEdgeLine, _currentLayer);
    						_tmpEdgeLine = null;
    					}
    				});
    			} else {
    				var pe = findShortestPointFromEdge(e.latLng);
    				var path = [e.latLng, pe.p];
    				_currentEdge = pe.edge;
    				_tmpEdgeLine.setPath(path);
    			}
    		}
    		else if (_currentTopoEditState == TopoEditState.Adding_Edge) {
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
						
						google.maps.event.addListenerOnce(_tmpEdgeLine, "click", function(e) { // only for once
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
						/*
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
						})*/
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
				} else if (e.keyCode == 68) { // "D" pressed
					_currentTopoEditState = TopoEditState.Adding_POI;
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
		if (_tmpEdgeLine) {
			_tmpEdgeLine.setMap(null);
		};
		_tmpEdgeLine = null;
		_tmpEdgeNode1 = null;
		_tmpEdgeNode2 = null;
		_currentEdgeEditState = EdgeEditState.Doing_Nothing;
		_currentTopoEditState = TopoEditState.Doing_Nothing;
		_currentBeaconEditState = BeaconEditState.Doing_Nothing;
	})
}

function addNewLayer() {
	if (_layers[_mapEditorLayerInput.value]) {
		window.alert($i18n.t("A layer with same z-index has been added"));
	} else if (_mapEditorLayerInput.value == "") {
		window.alert($i18n.t("Please input a z-index"));
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

function renderLayer(layer) {
	console.log(["renderLayer", layer]);
	renderRegionsInLayer(layer);
	if (_currentEditMode == EditMode.Topo) {
		renderNodesInLayer(layer);
		renderEdgesInLayer(layer);
		$NC.poi.renderInLayer(layer);
	} else if (_currentEditMode == EditMode.Beacon) {
		renderBeaconsInLayer(layer);
	}
}


function addNewBuildingName() {
	if (document.getElementById("topo-add-building-input").value) {
		var name = document.getElementById("topo-add-building-input").value;
		_buildings[name] = {"name": name};
		addOptionToSelect(name, _topoEditorBuildingChooser);
	}
}

function removeBuilding() {
	if (_topoEditorBuildingChooser.value) {
		delete _buildings[_topoEditorBuildingChooser.value];
		_topoEditorBuildingChooser.remove(_topoEditorBuildingChooser.selectedIndex);
	};
}

$(document).ready(function() {
	$("#building_lang_name").keyup(function() {
		_buildings[$("#topo-building-chooser").val()][$i18n.getKeyCode("name")] = $("#building_lang_name").val();
	});
});


$editor.on("modeChange", function(e, mode) {
	$NC.infoWindow.trigger("closeall");
	_currentEditMode = mode;
	if (_currentLayer) {
		$editor.trigger("derender");
		renderLayer(_currentLayer);
	};
});

$(window).on("hashchange", function(e) {
	var hash = window.location.hash;
	var mode = EditMode.File;
	if(hash == "#tab0") { mode = EditMode.File; }
	if(hash == "#tab1") { mode = EditMode.Map; }
	if(hash == "#tab2") { mode = EditMode.Topo; }
	if(hash == "#tab3") { mode = EditMode.Beacon; }
	$editor.trigger("modeChange", mode);
});

function prepareData() {
	_data["maxNodeID"] = _maxNodeID;
	_data["maxEdgeID"] = _maxEdgeID;
	_data["maxBeaconID"] = _maxBeaconID;
	_data["layers"] = _layers;
	_data["buildings"] = _buildings;
	_data["lastUUID"] = _lastUUID;
	_data["lastMajorID"] = _lastMajorID;
	_data["lastMinorID"] = _lastMinorID;
	_data["uuids"] = _uuids;
}

function saveLocally() {
	prepareData();
	//localStorage.setItem(_dataStorageLabel, JSON.stringify(_data));
	$db.saveData(_data);
}

function saveToDowndloadFile() {
	prepareData();
	var filename = "NavCogMapData.json";
    downloadFile(JSON.stringify(_data), filename);
}

function downloadFile(data, filename) {    
	var blob = new Blob([data], { type: 'text/json;charset=utf-8;' });
    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) {
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
        } else {        	
        	link.href = 'data:attachment/json,' + data;
        }
        link.style = "visibility:hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function removeAllData() {
	//localStorage.removeItem(_dataStorageLabel);
	//$db.clearData();
	_data = {};
	$editor.trigger("dataLoaded");
}

function addOptionToSelect(text, chooser) {
	newOpt = document.createElement("option");
	newOpt.text = text;
	chooser.add(newOpt);
}

function renewSelectWithProertyOfArrayWithDummy(array, property, dummy, chooser) {
	while (chooser.value) {
		chooser.remove(chooser.selectedIndex);
	}
	var newOpt = document.createElement("option");
	newOpt.text = $i18n.t(dummy);
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
			_data._centerLat = _data.centerLat;
			_data._centerLng = _data.centerLng;
			_map.setOptions({styles: [GOOGLE_MAP_INVISIVLE_STYLE]});
			_map.setCenter({lat:0,lng:0});
			_map.setZoom(21);
			_map.setOptions({minZoom:18});
		} else {
			_map.setOptions({styles: [GOOGLE_MAP_DEFAULT_STYLE]});
			_map.setCenter({lat:_data._centerLat,lng:_data._centerLng})
			_map.setOptions({minZoom:0});
		}
	}
}
