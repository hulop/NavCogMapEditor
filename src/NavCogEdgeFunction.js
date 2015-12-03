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
 
 function addNewEdge(id, node1, node2, line) {
	var newEdge = getNewEdge({id:id, node1:_tmpEdgeNode1.id, node2:_tmpEdgeNode2.id});
	_tmpEdgeNode1.infoFromEdges[id] = getNewNodeInfoFromEdge(newEdge);
	_tmpEdgeNode2.infoFromEdges[id] = getNewNodeInfoFromEdge(newEdge);
	_currentLayer.edges[id] = newEdge;
	_tmpEdgeLine.id = id;
	_tmpEdgeLine.addListener("click", function(e) {
		_currentEdge = _currentLayer.edges[this.id];
		showEdgeInfo(_currentEdge, e.latLng);
	});
	_edgePolylines[id] = _tmpEdgeLine;
	_tmpEdgeLine = null;
}

$editor.on("derender", function(e, layer) {
	for (var edgeID in layer?layer.edges:_edgePolylines) {
		if (_edgePolylines[edgeID]) {
			_edgePolylines[edgeID].setMap(null);
			delete _edgePolylines[edgeID];
		}
	}
	_currentEdge = null;
});

function renderEdgesInLayer(layer) {
	for (var edgeID in layer.edges) {
		renderEdge(layer.edges[edgeID]);
	}
	_currentEdge = null;
}

function renderEdge(edge) {
	if (_edgePolylines[edge.id]) {
		_edgePolylines[edge.id].setMap(_map);
	} else {
		var path = [];
		path.push({lat:_currentLayer.nodes[edge.node1].lat, lng:_currentLayer.nodes[edge.node1].lng});
		path.push({lat:_currentLayer.nodes[edge.node2].lat, lng:_currentLayer.nodes[edge.node2].lng});
		var edgeLine = new google.maps.Polyline({
			map: _map,
			path: path,
			strokeColor: "#00B4B4",
			strokeWeight: 10,
			strokeOpacity: 1.0
		});
		edgeLine.id = edge.id;
		_edgePolylines[edgeLine.id] = edgeLine;
		edgeLine.addListener("click", function(e) {
			_currentEdge = _currentLayer.edges[this.id];
			showEdgeInfo(_currentEdge, e.latLng);
		});
		if (window._logLocations) {
			_logLocations.forEach(function(log){
				if (log.edge==edge.id) {
					var node1 = _currentLayer.nodes[edge.node1], node2 = _currentLayer.nodes[edge.node2];
					var info1 = node1.infoFromEdges[edge.id], info2 = node2.infoFromEdges[edge.id]
					console.log(log);
					console.log(edge);
					console.log(node1.lat + "," + node1.lng);
					console.log(node2.lat + "," + node2.lng);
					console.log(info1.x + "," + info1.y);
					console.log(info2.x + "," + info2.y);
					var ratio = (log.y - info1.y) / (info2.y - info1.y);
					var lat = node1.lat + (node2.lat - node1.lat) * ratio;
					var lng = node1.lng + (node2.lng - node1.lng) * ratio;
					console.log(ratio + "," + lat + "," + lng);
					var marker = new MarkerWithLabel({
				    	position: new google.maps.LatLng(lat, lng),
				    	draggable: false,
				    	raiseOnDrag: false,
						icon: {
						    	size: new google.maps.Size(25, 25),
						    	anchor: new google.maps.Point(12.5, 12.5),
						    	url : "./img/round-blue.png"
						    },
				    	shape: {
							coords: [12.5, 12.5, 25],
							type: "circle",
						},
						labelContent: log.time,
						labelClass: "labels",
				    	labelAnchor: new google.maps.Point(10.5, 6.25)
				    });
					marker.setMap(_map);
				}
			}); 
		}
	}
}

function showEdgeInfo(edge, pos) {
	_edgeInfoWindow.setPosition(pos);
	_edgeInfoWindow.open(_map);
	if (_edgeInfoEditorIDInput == null) {
		_edgeInfoEditorIDInput = document.getElementById("edge-info-id");
		_edgeInfoEditorLenInput = document.getElementById("edge-info-len");
		_edgeInfoEditorOriInput = document.getElementById("edge-info-ori");
		_edgeInfoEditorXInput1 = document.getElementById("edge-info-start-x");
		_edgeInfoEditorYInput1 = document.getElementById("edge-info-start-y");
		_edgeInfoEditorXInput2 = document.getElementById("edge-info-end-x");
		_edgeInfoEditorYInput2 = document.getElementById("edge-info-end-y");
		_edgeInfoEditorMinKnnDistInput = document.getElementById("edge-info-min-knndist");
		_edgeInfoEditorMaxKnnDistInput = document.getElementById("edge-info-max-knndist");
		_edgeInfoEditorDataFileName = document.getElementById("edge-info-data-file-name");
		_edgeInfoEditorDataFileChooser = document.getElementById("edge-info-data-file-chooser");
		_edgeInfoEditorNodeID1 = document.getElementById("edge-info-nodeid1");
		_edgeInfoEditorNodeID2 = document.getElementById("edge-info-nodeid2");
		_edgeInfoEditorInfo1 = document.getElementById("edge-info-info-from-node1");
		_edgeInfoEditorInfo2 = document.getElementById("edge-info-info-from-node2");

		_edgeInfoEditorDataFileChooser.addEventListener("change", function(e) {
			var file = this.files[0];
			if (file) {
				var fileReader = new FileReader();
				fileReader.onload = function(e) {
					_currentEdge.dataFile = e.target.result;
				}
				fileReader.readAsText(file);
				//_currentEdge.dataFile = file.name;
				//_edgeInfoEditorDataFileName.value = file.name;
			} else {
				_currentEdge.dataFile = "";
				_edgeInfoEditorDataFileName.value = "";
			}
		});

		_edgeInfoEditorOriInput.addEventListener("keyup", function(e) {
			var ori = parseFloat(this.value);
			var invOri = ori > 0 ? ori - 180 : ori + 180;
			_currentEdge.oriFromNode1 = ori;
			_currentEdge.oriFromNode2 = invOri;
		});

		_edgeInfoEditorInfo1.addEventListener("keyup", function(e) {
			_currentEdge[$i18n.k("infoFromNode1")] = this.value;
		});

		_edgeInfoEditorInfo2.addEventListener("keyup", function(e) {
			_currentEdge[$i18n.k("infoFromNode2")] = this.value;
		});

		_edgeInfoEditorMinKnnDistInput.addEventListener("keyup", function(e) {
			_currentEdge.minKnnDist = parseFloat(this.value);
		});

		_edgeInfoEditorMaxKnnDistInput.addEventListener("keyup", function(e) {
			_currentEdge.maxKnnDist = parseFloat(this.value);
		});

		_edgeInfoEditorXInput1.addEventListener("keyup", function(e) {
			_currentLayer.nodes[_currentEdge.node1].infoFromEdges[_currentEdge.id].x = parseFloat(this.value);
		});
		_edgeInfoEditorYInput1.addEventListener("keyup", function(e) {
			_currentLayer.nodes[_currentEdge.node1].infoFromEdges[_currentEdge.id].y = parseFloat(this.value);
		});
		_edgeInfoEditorXInput2.addEventListener("keyup", function(e) {
			_currentLayer.nodes[_currentEdge.node2].infoFromEdges[_currentEdge.id].x = parseFloat(this.value);
		});
		_edgeInfoEditorYInput2.addEventListener("keyup", function(e) {
			_currentLayer.nodes[_currentEdge.node2].infoFromEdges[_currentEdge.id].y = parseFloat(this.value);
		});
		_edgeInfoEditorXInput1.addEventListener("keyup", function(e) {
			var x1 = parseFloat(_edgeInfoEditorXInput1.value);
			var y1 = parseFloat(_edgeInfoEditorYInput1.value);
			var x2 = parseFloat(_edgeInfoEditorXInput2.value);
			var y2 = parseFloat(_edgeInfoEditorYInput2.value);
			var len = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
			_edgeInfoEditorLenInput.value = len;
			_currentEdge.len = len;
		});
		_edgeInfoEditorYInput1.addEventListener("keyup", function(e) {
			var x1 = parseFloat(_edgeInfoEditorXInput1.value);
			var y1 = parseFloat(_edgeInfoEditorYInput1.value);
			var x2 = parseFloat(_edgeInfoEditorXInput2.value);
			var y2 = parseFloat(_edgeInfoEditorYInput2.value);
			var len = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
			_edgeInfoEditorLenInput.value = len;
			_currentEdge.len = len;
		});
		_edgeInfoEditorXInput2.addEventListener("keyup", function(e) {
			var x1 = parseFloat(_edgeInfoEditorXInput1.value);
			var y1 = parseFloat(_edgeInfoEditorYInput1.value);
			var x2 = parseFloat(_edgeInfoEditorXInput2.value);
			var y2 = parseFloat(_edgeInfoEditorYInput2.value);
			var len = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
			_edgeInfoEditorLenInput.value = len;
			_currentEdge.len = len;
		});
		_edgeInfoEditorYInput2.addEventListener("keyup", function(e) {
			var x1 = parseFloat(_edgeInfoEditorXInput1.value);
			var y1 = parseFloat(_edgeInfoEditorYInput1.value);
			var x2 = parseFloat(_edgeInfoEditorXInput2.value);
			var y2 = parseFloat(_edgeInfoEditorYInput2.value);
			var len = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
			_edgeInfoEditorLenInput.value = len;
			_currentEdge.len = len;
		});
	};

	_edgeInfoEditorIDInput.value = edge.id;
	_edgeInfoEditorLenInput.value = edge.len;
	_edgeInfoEditorOriInput.value = edge.oriFromNode1;
	_edgeInfoEditorXInput1.value = _currentLayer.nodes[edge.node1].infoFromEdges[edge.id].x;
	_edgeInfoEditorYInput1.value = _currentLayer.nodes[edge.node1].infoFromEdges[edge.id].y;
	_edgeInfoEditorXInput2.value = _currentLayer.nodes[edge.node2].infoFromEdges[edge.id].x;
	_edgeInfoEditorYInput2.value = _currentLayer.nodes[edge.node2].infoFromEdges[edge.id].y;
	_edgeInfoEditorMinKnnDistInput.value = edge.minKnnDist;
	_edgeInfoEditorMaxKnnDistInput.value = edge.maxKnnDist;
	_edgeInfoEditorDataFileName.value = edge.dataFile;
	_edgeInfoEditorNodeID1.value = edge.node1;
	_edgeInfoEditorNodeID2.value = edge.node2;
	_edgeInfoEditorInfo1.value = edge[$i18n.k("infoFromNode1")];
	_edgeInfoEditorInfo2.value = edge[$i18n.k("infoFromNode2")];
}

function saveEdgeInfo() {
	/*
	var ori = parseFloat(_edgeInfoEditorOriInput.value);
	var invOri = ori > 0 ? ori - 180 : ori + 180;
	_currentEdge.oriFromNode1 = ori;
	_currentEdge.oriFromNode2 = invOri;
	_currentEdge[$i18n.k("infoFromNode1")] = _edgeInfoEditorInfo1.value;
	_currentEdge[$i18n.k("infoFromNode2")] = _edgeInfoEditorInfo2.value;
	_currentEdge.minKnnDist = parseFloat(_edgeInfoEditorMinKnnDistInput.value);
	_currentEdge.maxKnnDist = parseFloat(_edgeInfoEditorMaxKnnDistInput.value);
	_currentLayer.nodes[_currentEdge.node1].infoFromEdges[_currentEdge.id].x = parseFloat(_edgeInfoEditorXInput1.value);
	_currentLayer.nodes[_currentEdge.node1].infoFromEdges[_currentEdge.id].y = parseFloat(_edgeInfoEditorYInput1.value);
	_currentLayer.nodes[_currentEdge.node2].infoFromEdges[_currentEdge.id].x = parseFloat(_edgeInfoEditorXInput2.value);
	_currentLayer.nodes[_currentEdge.node2].infoFromEdges[_currentEdge.id].y = parseFloat(_edgeInfoEditorYInput2.value);
	var x1 = parseFloat(_edgeInfoEditorXInput1.value);
	var y1 = parseFloat(_edgeInfoEditorYInput1.value);
	var x2 = parseFloat(_edgeInfoEditorXInput2.value);
	var y2 = parseFloat(_edgeInfoEditorYInput2.value);
	var len = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
	_edgeInfoEditorLenInput.value = len;
	_currentEdge.len = len;
	*/
}

function removeCurrentEdge() {
	_edgePolylines[_currentEdge.id].setMap(null);
	delete _edgePolylines[_currentEdge.id];
	delete _currentLayer.nodes[_currentEdge.node1].infoFromEdges[_currentEdge.id];
	delete _currentLayer.nodes[_currentEdge.node2].infoFromEdges[_currentEdge.id];
	delete _currentLayer.edges[_currentEdge.id];
	_currentEdge = null;
	_edgeInfoWindow.close();
}