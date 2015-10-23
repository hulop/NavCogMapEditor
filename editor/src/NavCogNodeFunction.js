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
 
 function addNewNode(latLng, id, layers) {
	var b = $util.getSelectedOption("topo-building-chooser") && $util.getSelectedOption("topo-building-chooser").text;
	var newNode = getNewNode({lat:latLng.lat(), lng:latLng.lng(), id:id, layerZ:_currentLayer.z, building: b});
	for (var z in layers) { //TODO: should be removed, for large number of nodes
		newNode.transitInfo[z] = getNewTransitInfoToLayer(layers[z]);
	}
	
	_currentLayer.nodes[id] = newNode;
	renderNode(newNode);
	return newNode;
}

function renderNodesInLayer(layer) {
	for (var nodeID in layer.nodes) {
		renderNode(layer.nodes[nodeID]);
	}
	_currentNode = null;
}

$editor.on("derender", function(e, layer) {
	for (var nodeID in layer?layer.nodes:_nodeMarkers) {
		if (_nodeMarkers[nodeID]) {
			_nodeMarkers[nodeID].setMap(null);
			delete _nodeMarkers[nodeID];
		};
	}
	_currentNode = null;
});

for ( var edgeID in _edgePolylines) {
	_edgePolylines[edgeID].setMap(null);
	delete _edgePolylines[edgeID];
}

for ( var beaconID in _beaconMarkers) {
	_beaconMarkers[beaconID].setMap(null);
	delete _beaconMarkers[beaconID];
}


function setImgForNode(node) {
	if (_nodeMarkers[node.id]) {
		var image = {
	    	size: new google.maps.Size(25, 25),
	    	anchor: new google.maps.Point(12.5, 12.5)
	    };
		image.url = "./img/round-red.png";
		for (var z in node.transitInfo) {
			if (node.transitInfo[z].enabled) {
				image.url = "./img/round-green.png";
				break;
			}
		}
		_nodeMarkers[node.id].setIcon(image);
	};
}

function renderNode(node) {
	if (_nodeMarkers[node.id]) {
		setImgForNode(node);
		_nodeMarkers[node.id].setMap(_map);
	} else {
		var image = {
	    	size: new google.maps.Size(25, 25),
	    	anchor: new google.maps.Point(12.5, 12.5)
	    };
	    image.url = "./img/round-red.png";
	    for (var z in node.transitInfo) {
	    	if (node.transitInfo[z].enabled) {
	    		image.url = "./img/round-green.png";
	    		break;
	    	};
	    }
	    var nodeMarker = new MarkerWithLabel({
	    	position: new google.maps.LatLng(node.lat, node.lng),
	    	draggable: true,
	    	raiseOnDrag: false,
	    	icon: image,
	    	shape: {
				coords: [12.5, 12.5, 20],
				type: "circle",
			},
			labelContent: node.id,
			labelClass: "labels",
	    	labelAnchor: new google.maps.Point(10.5, 6.25)
	    });
		nodeMarker.setMap(_map);
		nodeMarker.id = node.id;
		_nodeMarkers[nodeMarker.id] = nodeMarker;
		nodeMarker.addListener("click", function(e) {
			switch (_currentTopoEditState) {
				case TopoEditState.Doing_Nothing:
					_currentNode = _currentLayer.nodes[this.id];
					showNodeInfo(_currentNode);
					break;
				case TopoEditState.Adding_Edge:
					if (_currentEdgeEditState == EdgeEditState.Doing_Nothing) {
						_currentEdgeEditState = EdgeEditState.Waiting_Next_Node;
					}
					else if (_currentEdgeEditState == EdgeEditState.Waiting_Next_Node) {
			    		_tmpEdgeNode2 = _currentLayer.nodes[this.id];
			    		_maxEdgeID++;
			    		addNewEdge(_maxEdgeID.toString(), _tmpEdgeNode1, _tmpEdgeNode2, _tmpEdgeLine);
			    		_currentEdgeEditState = EdgeEditState.Edge_Done;
					}
					_tmpEdgeNode1 = _currentLayer.nodes[this.id];
					_tmpEdgeLine = null;
					break;
				case TopoEditState.Connecting_TwoNodes:
					break;
				default:
					break;
			}
			
		});
		nodeMarker.addListener("drag", function(e) {
			_currentTopoEditState = TopoEditState.Draging_Node;
			nodeMarker.setPosition(e.latLng);
			_currentLayer.nodes[this.id].lat = e.latLng.lat();
			_currentLayer.nodes[this.id].lng = e.latLng.lng();
			for (var edgeID in _currentLayer.nodes[this.id].infoFromEdges) {
				var node2;
				if (_currentLayer.edges[edgeID].node1 == this.id) {
					node2 = _currentLayer.nodes[_currentLayer.edges[edgeID].node2];
				} else {
					node2 = _currentLayer.nodes[_currentLayer.edges[edgeID].node1];
				}
				var node1 = _currentLayer.nodes[this.id];
				var path = [];
				path.push({lat:node2.lat, lng:node2.lng});
				path.push({lat:node1.lat, lng:node1.lng});
				_edgePolylines[edgeID].setPath(path);
			}
		});
		nodeMarker.addListener("dragend", function(e) {
			_currentTopoEditState = TopoEditState.Doing_Nothing;
			nodeMarker.setPosition(e.latLng);
			_currentLayer.nodes[this.id].lat = e.latLng.lat();
			_currentLayer.nodes[this.id].lng = e.latLng.lng();
			for (var edgeID in _currentLayer.nodes[this.id].infoFromEdges) {
				var node2;
				if (_currentLayer.edges[edgeID].node1 == this.id) {
					node2 = _currentLayer.nodes[_currentLayer.edges[edgeID].node2];
				} else {
					node2 = _currentLayer.nodes[_currentLayer.edges[edgeID].node1];
				}
				var node1 = _currentLayer.nodes[this.id];
				var path = [];
				path.push({lat:node2.lat, lng:node2.lng});
				path.push({lat:node1.lat, lng:node1.lng});
				_edgePolylines[edgeID].setPath(path);
			}
		});
	}
}

function showNodeInfo(node) {
	_nodeInfoWindow.setPosition(new google.maps.LatLng(node.lat, node.lng));
	_nodeInfoWindow.open(_map);
	if (_nodeInfoEditorIDInput == null) {
		_nodeInfoEditorTypeChooser = document.getElementById("node-info-type-chooser");
		_nodeInfoEditorNameInput = document.getElementById("node-info-name");
		_nodeInfoEditorIDInput = document.getElementById("node-info-id");
		_nodeInfoEditorBuildingChooser = document.getElementById("node-info-building-chooser");
		_nodeInfoEditorFloor = document.getElementById("node-info-floor");
		_nodeInfoEditorDestInfo = document.getElementById("node-info-dest-info");
		_nodeInfoEditorEdgeChooser = document.getElementById("node-info-topo-edge-chooser");
		_nodeInfoEditorTopoXInput = document.getElementById("node-info-topox");
		_nodeInfoEditorTopoYInput = document.getElementById("node-info-topoy");
		_nodeInfoEditorNodeInfoInput = document.getElementById("node-info-info-from-edge");
		_nodeInfoEditorTransitLayerChooser = document.getElementById("node-info-transit-layer-chooser");
		_nodeInfoEditorTransitEnableChecker = document.getElementById("node-info-transit-enable");
		_nodeInfoEditorTransitNodeChooser = document.getElementById("node-info-transit-node-chooser");
		_nodeInfoEditorTransitInfoInput = document.getElementById("node-info-info-from-node");
		_nodeInfoEditorKnnDistInput = document.getElementById("node-info-transit-knn-threshold");
		_nodeInfoEditorPosDistInput = document.getElementById("node-info-transit-pos-threshold");
		_nodeInfoEditorTrickyEnableChecker = document.getElementById("node-info-tricky-enable");
		_nodeInfoEditorTrickyInfoInput = document.getElementById("node-info-tricky-info");
		_nodeInfoEditorEdgeChooser.addEventListener("change", function(e) {
			_nodeInfoEditorNodeInfoInput.value = _currentNode.infoFromEdges[this.value][$i18n.k("info")];
			_nodeInfoEditorDestInfo.value = _currentNode.infoFromEdges[this.value][$i18n.k("destInfo")];
			_nodeInfoEditorTopoXInput.value = _currentNode.infoFromEdges[this.value].x;
			_nodeInfoEditorTopoYInput.value = _currentNode.infoFromEdges[this.value].y;
			_nodeInfoEditorTrickyEnableChecker.checked = _currentNode.infoFromEdges[this.value].beTricky;
			_nodeInfoEditorTrickyInfoInput.disabled = !_currentNode.infoFromEdges[this.value].beTricky;
			_nodeInfoEditorTrickyInfoInput.value = _currentNode.infoFromEdges[this.value][$i18n.k("trickyInfo")];
		});

		_nodeInfoEditorNodeInfoInput.addEventListener("keyup", function(e) {
			_currentNode.infoFromEdges[_nodeInfoEditorEdgeChooser.value][$i18n.k("info")] = this.value;
		});

		_nodeInfoEditorTransitLayerChooser.addEventListener("change", function(e) {
			var targetLayerZ = _nodeInfoEditorTransitLayerChooser.value;
			setTransitUIToLayer(_currentNode, _layers[targetLayerZ]);
		});
		_nodeInfoEditorTransitEnableChecker.addEventListener("change", function(e) {
			toggleTransitUIToLayer(_currentNode, _layers[_nodeInfoEditorTransitLayerChooser.value], _nodeInfoEditorTransitEnableChecker.checked);
			if (_nodeInfoEditorTransitNodeChooser.value == _currentNode.id) {
				window.alert($i18n.t("Current Node Transit to itself"));
			};
		});
		_nodeInfoEditorTransitNodeChooser.addEventListener("change", function(e) {
			var targetLayerZ = _nodeInfoEditorTransitLayerChooser.value;
			if (this.value == "None") {
				if (_currentNode.transitInfo[targetLayerZ].enabled) {
					var targetNodeid = _currentNode.transitInfo[targetLayerZ].node;
					disableTransit(_currentNode, _layers[targetLayerZ].nodes[targetNodeid]);
				};
				return;
			};
			if (_currentNode.transitInfo[targetLayerZ].enabled) {
				var curTgtNodeId = _currentNode.transitInfo[targetLayerZ].node;
				disableTransit(_currentNode, _layers[targetLayerZ].nodes[curTgtNodeId]);
			};
			var targetNodeid = _nodeInfoEditorTransitNodeChooser.value;
			if (_layers[targetLayerZ].nodes[targetNodeid].transitInfo[_currentLayer.z].enabled) {
				var peerNodeId = _layers[targetLayerZ].nodes[targetNodeid].transitInfo[_currentLayer.z].node;
				var peerNode = _currentLayer.nodes[peerNodeId];
				disableTransit(peerNode, _layers[targetLayerZ].nodes[targetNodeid]);
			};
			enableTransit(_currentNode, _layers[targetLayerZ].nodes[targetNodeid]);
			if (_nodeInfoEditorTransitNodeChooser.value == _currentNode.id) {
				window.alert($i18n.t("Current Node Transit to itself"));
			};
		})
		_nodeInfoEditorTransitInfoInput.addEventListener("keyup", function(e) {
			var z = _nodeInfoEditorTransitLayerChooser.value;
			_currentNode.transitInfo[z][$i18n.k("info")] = this.value;
		});

		_nodeInfoEditorDestInfo.addEventListener("keyup", function(e) {
			_currentNode.infoFromEdges[_nodeInfoEditorEdgeChooser.value][$i18n.k("destInfo")] = this.value;
		});

		_nodeInfoEditorTrickyEnableChecker.addEventListener("change", function(e) {
			if (this.checked) {
				_nodeInfoEditorTrickyInfoInput.disabled = false;
				_currentNode.infoFromEdges[_nodeInfoEditorEdgeChooser.value].beTricky = true;
			} else {
				_nodeInfoEditorTrickyInfoInput.disabled = true;
				_nodeInfoEditorTrickyInfoInput.value = "";
				_currentNode.infoFromEdges[_nodeInfoEditorEdgeChooser.value].beTricky = false;
				_currentNode.infoFromEdges[_nodeInfoEditorEdgeChooser.value][$i18n.k("trickyInfo")] = "";
			}
		});

		_nodeInfoEditorTrickyInfoInput.addEventListener("keyup", function(e) {
			_currentNode.infoFromEdges[_nodeInfoEditorEdgeChooser.value][$i18n.k("trickyInfo")] = this.value;
		});

		_nodeInfoEditorBuildingChooser.addEventListener("change", function(e) {
			_currentNode.building = _nodeInfoEditorBuildingChooser.value;
		});
		_nodeInfoEditorTypeChooser.addEventListener("change", function(e) {
			_currentNode.type = this.selectedIndex;
			var z = _nodeInfoEditorEdgeChooser.value;
			if (this.value == "Destination") {
				_nodeInfoEditorDestInfo.disabled = false;
				_currentNode.transitInfo[z][$i18n.k("destInfo")] = "";
			} else {
				_nodeInfoEditorDestInfo.disabled = true;
				_nodeInfoEditorDestInfo.value = "";
				_currentNode.transitInfo[z][$i18n.k("destInfo")] = "";
			}
		});
		_nodeInfoEditorNameInput.addEventListener("keyup", function(e) {
			_currentNode[$i18n.k("name")] = this.value;
		});
		_nodeInfoEditorBuildingChooser.addEventListener("change", function(e) {
			_currentNode.building = this.value;
		});
		_nodeInfoEditorFloor.addEventListener("keyup", function(e) {
			_currentNode.floor = parseInt(this.value);
		});
		_nodeInfoEditorKnnDistInput.addEventListener("keyup", function(e) {
			_currentNode.knnDistThres = parseFloat(this.value);
		});
		_nodeInfoEditorPosDistInput.addEventListener("keyup", function(e) {
			_currentNode.posDistThres = parseFloat(this.value);
		});
	};

	_nodeInfoEditorTypeChooser.selectedIndex = node.type;
	_nodeInfoEditorNameInput.value = node[$i18n.k("name")];
	_nodeInfoEditorIDInput.value = node.id;
	_nodeInfoEditorFloor.value = node.floor;
	_nodeInfoEditorKnnDistInput.value = node.knnDistThres;
	_nodeInfoEditorPosDistInput.value = node.posDistThres;

	// update building list
	$util.setOptions(_nodeInfoEditorBuildingChooser, 
			$.extend({"None":$i18n.t("None")}, 
					$util.getLangAttrs(_buildings,"name")),
			node.building);


	$util.renewSelectWithProertyOfArray(node.infoFromEdges, "edgeID", _nodeInfoEditorEdgeChooser);
	if (_nodeInfoEditorEdgeChooser.value) {
		_nodeInfoEditorTopoXInput.value = node.infoFromEdges[_nodeInfoEditorEdgeChooser.value].x;
		_nodeInfoEditorTopoYInput.value = node.infoFromEdges[_nodeInfoEditorEdgeChooser.value].y;
		_nodeInfoEditorNodeInfoInput.value = node.infoFromEdges[_nodeInfoEditorEdgeChooser.value][$i18n.k("info")];
		if (_nodeInfoEditorTypeChooser.value == "Destination") {
			_nodeInfoEditorDestInfo.disabled = false;
			_nodeInfoEditorDestInfo.value = _currentNode.infoFromEdges[_nodeInfoEditorEdgeChooser.value][$i18n.k("destInfo")];
		} else {
			_nodeInfoEditorDestInfo.disabled = true;
			_nodeInfoEditorDestInfo.value = "";
		}
		if (node.infoFromEdges[_nodeInfoEditorEdgeChooser.value].beTricky) {
			_nodeInfoEditorTrickyEnableChecker.checked = true;
			_nodeInfoEditorTrickyInfoInput.disabled = false;
			_nodeInfoEditorTrickyInfoInput.value = node.infoFromEdges[_nodeInfoEditorEdgeChooser.value][$i18n.k("trickyInfo")];
		} else {
			_nodeInfoEditorTrickyEnableChecker.checked = false;
			_nodeInfoEditorTrickyInfoInput.disabled = true;
			_nodeInfoEditorTrickyInfoInput.value = "";
		}
	};
	$util.renewSelectWithProertyOfArray(_layers, "z", _nodeInfoEditorTransitLayerChooser);
	setTransitUIToLayer(_currentNode, _layers[_nodeInfoEditorTransitLayerChooser.value]);
}

function saveNodeInfo(node) {

}

function setTransitUIToLayer(node, layer) {
	renewSelectWithProertyOfArrayWithDummy(_layers[layer.z].nodes, "id", "None", _nodeInfoEditorTransitNodeChooser);
	if (node.transitInfo[layer.z].enabled) {
		_nodeInfoEditorTransitEnableChecker.checked = true;
		_nodeInfoEditorTransitNodeChooser.disabled = false;
		_nodeInfoEditorTransitInfoInput.disabled = false;
		_nodeInfoEditorTransitInfoInput.value = node.transitInfo[layer.z][$i18n.k("info")];
		selectOptWithText(node.transitInfo[layer.z].node, _nodeInfoEditorTransitNodeChooser);
	} else {
		_nodeInfoEditorTransitEnableChecker.checked = false;
		_nodeInfoEditorTransitNodeChooser.disabled = true;
		_nodeInfoEditorTransitInfoInput.disabled = true;
		_nodeInfoEditorTransitInfoInput.value = "";
	}
}

function toggleTransitUIToLayer(node, layer, enabled) {
	_nodeInfoEditorTransitEnableChecker.checked = enabled;
	_nodeInfoEditorTransitNodeChooser.disabled = !enabled;
	_nodeInfoEditorTransitInfoInput.disabled = !enabled;
	if (_nodeInfoEditorTransitNodeChooser.value == "None") {
		return;
	};
	if (enabled) {
		var targetNode = layer.nodes[_nodeInfoEditorTransitNodeChooser.value];
		enableTransit(node, targetNode);
	} else {
		var targetNode = layer.nodes[_nodeInfoEditorTransitNodeChooser.value];
		disableTransit(node, targetNode);
	}
}

function disableTransit(node1, node2) {
	node1.transitInfo[node2.layerZ].enabled = false;
	node1.transitInfo[node2.layerZ].info = "";
	node2.transitInfo[node1.layerZ].enabled = false;
	node2.transitInfo[node1.layerZ].info = "";
	setImgForNode(node1);
	setImgForNode(node2);
}

function enableTransit(node1, node2) {
	node1.transitInfo[node2.layerZ].enabled = true;
	node1.transitInfo[node2.layerZ].node = node2.id;
	node1.transitInfo[node2.layerZ].info = "";
	node2.transitInfo[node1.layerZ].enabled = true;
	node2.transitInfo[node1.layerZ].node = node1.id;
	node2.transitInfo[node1.layerZ].info = "";
	setImgForNode(node1);
	setImgForNode(node2);
}

function removeCurrentNode() {
	_nodeMarkers[_currentNode.id].setMap(null);
	delete _nodeMarkers[_currentNode.id];
	for (var edgeID in _currentNode.infoFromEdges) {
		_edgePolylines[edgeID].setMap(null);
		delete _edgePolylines[edgeID];
		var edge = _currentLayer.edges[edgeID];
		delete _currentLayer.nodes[edge.node1].infoFromEdges[edgeID];
		delete _currentLayer.nodes[edge.node2].infoFromEdges[edgeID];
		delete _currentLayer.edges[edgeID];
	}

	for (var layerID in _currentNode.transitInfo) {
		if (_currentNode.transitInfo[layerID].enabled) {
			_layers[layerID].nodes[_currentNode.transitInfo[layerID].node].transitInfo[_currentLayer.z].enabled = false;
		};
	}

	delete _currentLayer.nodes[_currentNode.id];
	_currentNode = null;
	_nodeInfoWindow.close();
}
