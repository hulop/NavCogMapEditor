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
	
	renderEdge(newEdge);
	_tmpEdgeLine.setMap(null);
	_tmpEdgeLine = null;
	
	/*
	_tmpEdgeLine.id = id;
	_tmpEdgeLine.addListener("click", function(e) {
		_currentEdge = _currentLayer.edges[this.id];
		showEdgeInfo(_currentEdge, e.latLng);
	});
	_edgePolylines[id] = _tmpEdgeLine;
	_tmpEdgeLine = null;
	*/
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

function renderEdgesInLayer(layer, silent) {
	for (var edgeID in layer.edges) {
		renderEdge(layer.edges[edgeID], silent);
	}
	_currentEdge = null;
}

function updateEdge(edge, edgeLine){

	var path = edgeLine.getPath();
	var len = path.getLength();
	if (len > 2) {
		var ori = edge.oriFromNode1;
		var n1 = _currentLayer.nodes[edge.node1];
		var np1 = n1.infoFromEdges[edge.id];
		var llp1 = new google.maps.LatLng(n1.lat, n1.lng);
		var p1 = _map.getProjection().fromLatLngToPoint(llp1);
		var n2 = _currentLayer.nodes[edge.node2];
		var np2 = n2.infoFromEdges[edge.id];
		var llp2 = new google.maps.LatLng(n2.lat, n2.lng);
		var p2 = _map.getProjection().fromLatLngToPoint(llp2);
		
		var ep1 = {x:np1.x,y:np1.y,lat:n1.lat,lng:n1.lng};
		var ep2 = {x:np2.x,y:np2.y,lat:n2.lat,lng:n2.lng};
		var r12 = Math.atan2(ep2.y-ep1.y, ep2.x-ep1.x);
		edge.path = [ep1,ep2];
		for(var i = 1; i < path.getLength()-1; i++) {
			var llp3 = path.getAt(i);
			var p3 = _map.getProjection().fromLatLngToPoint(llp3);
			
			var a = $geom.getDistanceOfTwoPoints(p1,p2);
			var b = $geom.getDistanceOfTwoPoints(p1,p3);
			var r = $geom.getAngle(p1,p2,p3);
			var tmp = $geom.rotate(ep2, r, ep1); 
			var ep3 = {
					lat: llp3.lat(),
					lng: llp3.lng(),
					x: ep1.x + (tmp.x-ep1.x)/a*b,
					y: ep1.y + (tmp.y-ep1.y)/a*b
			};						
			edge.path.splice(i,0,ep3);
		}
		
		for(var i = 0; i < edge.path.length-1; i++) { 
			var r = $geom.getAngle4(edge.path[0], edge.path[edge.path.length-1], edge.path[i], edge.path[i+1]);
			edge.path[i].forward = $geom.canonicalNavcogOrientation(ori+$geom.ori2navcogori(r)); 
			edge.path[i+1].backward = $geom.canonicalNavcogOrientation(ori+$geom.ori2navcogori(r+Math.PI));
		}
	} else {
		delete edge.path; 
	}
	
	if (edge.pois) {
		for(var key in edge.pois) {
			var poi = edge.pois[key];
			poi.updateLatLngPoint(poi.getLatLngPoint());
		}
	}
	
	updateEdgeLength(edge);
}

function renderEdge(edge, silent) {
	if (_edgePolylines[edge.id]) {
		_edgePolylines[edge.id].setMap(_map);
	} else {
		var path = edge.path || [{lat:_currentLayer.nodes[edge.node1].lat, lng:_currentLayer.nodes[edge.node1].lng},
		                         {lat:_currentLayer.nodes[edge.node2].lat, lng:_currentLayer.nodes[edge.node2].lng}];
		var edgeLine = new google.maps.Polyline({
			map: _map,
			path: path,
			strokeColor: "#00B4B4",
			strokeWeight: 10,
			strokeOpacity: 1.0
		});

		
		edgeLine.id = edge.id;
		edgeLine._edge = edge;
		_edgePolylines[edgeLine.id] = edgeLine;
		if (!silent) {
			edgeLine.addListener("click", function(e) {
				_currentEdge = _currentLayer.edges[this.id];
				showEdgeInfo(_currentEdge, e.latLng);
			});
			edgeLine.addListener("mouseout", function(e) {
				//console.log(this._possibleDragging);
				if (this._possibleDragging) {
					return;
				}
				if (this._marker) {
					this._marker.setMap(null);
				}
			});
			edgeLine.addListener("mousemove", function(e) {
				//console.log(this._possibleDragging);
				if (this._possibleDragging) {
					return;
				}
				_currentEdge = this._edge;
				var edgeLine = this;

				var r = edgeLine._r = findMiddlePointOnEdge(this, e.latLng);
				//console.log(r);
				if (r) {
					if (!this._marker) {
						var marker = this._marker = new MarkerWithLabel({
							position: r.p,
							draggable: true,
							raiseOnDrag: true,
							icon: {
								size: new google.maps.Size(25, 25),
								anchor: new google.maps.Point(12.5, 12.5),
								url : "./img/round-blue.png"
							},
							shape: {
								coords: [12.5, 12.5, 25],
								type: "circle",
							},
							labelClass: "labels",
							labelAnchor: new google.maps.Point(10.5, 6.25)
						});
						$NC.infoWindow.on("closeall", function(e) {
							marker.setMap(null);
						});
						this._marker.addListener("click", function(e) {
							console.log("click");
							if (edgeLine._r.flag == "point" && $editor.shiftKey) {
								var i = edgeLine._r.line.index;
								var path = edgeLine.getPath();
								path.removeAt(i);
								edgeLine.setPath(path);
								updateEdge(_currentEdge, edgeLine);
							} else {
								showEdgeInfo(_currentEdge, e.latLng);
							}
						});
						this._marker.addListener("mousedown", function(e) {
							edgeLine._possibleDragging = true;
						});
						this._marker.addListener("mouseup", function(e) {
							edgeLine._possibleDragging = false;
						});
						this._marker.addListener("dragstart", function(e) {
							var i = edgeLine._r.line.index;
							var path = edgeLine.getPath();
							if (edgeLine._r.flag == "middle") {
								path.insertAt(i, e.latLng);
							} else if (edgeLine._r.flag == "point") {
								path.setAt(i, e.latLng);
							}
							edgeLine.setPath(path);
							updateEdge(_currentEdge, edgeLine);
						});
						this._marker.addListener("dragend", function(e) {
							console.log("dragend");
							marker.setMap(null);
						});
						this._marker.addListener("drag", function(e) {
							var i = edgeLine._r.line.index;
							var path = edgeLine.getPath();
							path.setAt(i,e.latLng);
							edgeLine.setPath(path);
							updateEdge(_currentEdge, edgeLine);							
						});
					}
					else {
						this._marker.setMap(_map);
						this._marker.setPosition(r.p);
					}
				} else {
					if (this._marker) {
						this._marker.setMap(null);
					}
				}
			});
			
		}
	}
}

function findMiddlePointOnEdge(edgeLine, latLng) {
	var p = _map.getProjection().fromLatLngToPoint(latLng);
	var lines = [];
	var path = edgeLine.getPath();
	var p1 = _map.getProjection().fromLatLngToPoint(path.getAt(0));
	
	var mind = Number.MAX_VALUE;
	var minp = null;
	var minl = null;
	var flag = null;
	
	for(var i = 1; i < path.getLength(); i++) {
		p2 = _map.getProjection().fromLatLngToPoint(path.getAt(i));
		var l = {
				p1: p1,
				p2: p2,
				index: i
			};
		lines.push(l);
		p1 = p2;
		
		var d = $geom.getDistanceOfTwoPoints(p2, p);
		if (d < mind && i < path.getLength()-1) {
			mind = d;
			minp = p2;
			minl = l;
			flag = "point";
		}
	}
	
	lines.forEach(function(l) {
		//var tp = $geom.getNearestPointOnLineSegFromPoint(l, p);
		var p3 = {
				x: (l.p1.x+l.p2.x)/2,
				y: (l.p1.y+l.p2.y)/2
		};
		var d = $geom.getDistanceOfTwoPoints(p, p3);
		if (d < mind) {
			mind = d;
			minp = p3;
			minl = l;
			flag = "middle";
		}
	});
	
	if (flag == "middle") {
		var d3 = $geom.getDistanceOfTwoPoints(minl.p1, minl.p2);
		//console.log([mind, minp, minl, flag, d3, mind/d3]);
		if (mind / d3 < 0.1) {
			return {
				p: _map.getProjection().fromPointToLatLng(new google.maps.Point(minp.x, minp.y)),
				line: minl,
				dist: mind,
				flag: flag
			};
		}
	} else if (flag == "point") {
		var d3 = $geom.getDistanceOfTwoPoints(minl.p1, minl.p2);
		//console.log([mind, minp, minl, flag, d3, mind/d3]);

		if (mind / d3 < 0.1) {
			return {
				p: _map.getProjection().fromPointToLatLng(new google.maps.Point(minp.x, minp.y)),
				line: minl,
				dist: mind,
				flag: flag
			};
		}
		
	}
	return null;
}

function showEdgeInfo(edge, pos) {
	_nodeInfoWindow.close();
	_edgeInfoWindow.setPosition(pos);
	$NC.infoWindow.trigger("closeall");
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
			updateEdgeLength(_currentEdge);
		});
		_edgeInfoEditorYInput1.addEventListener("keyup", function(e) {
			_currentLayer.nodes[_currentEdge.node1].infoFromEdges[_currentEdge.id].y = parseFloat(this.value);
			updateEdgeLength(_currentEdge);
		});
		_edgeInfoEditorXInput2.addEventListener("keyup", function(e) {
			_currentLayer.nodes[_currentEdge.node2].infoFromEdges[_currentEdge.id].x = parseFloat(this.value);
			updateEdgeLength(_currentEdge);
		});
		_edgeInfoEditorYInput2.addEventListener("keyup", function(e) {
			_currentLayer.nodes[_currentEdge.node2].infoFromEdges[_currentEdge.id].y = parseFloat(this.value);
			updateEdgeLength(_currentEdge);
		});

		$("#edge-info-localization").change(checkFloor);
		$("#edge-info-localization-floor").change(function() {
			var opt = $util.getSelectedOption("edge-info-localization-floor");
			if (opt) {
				_currentEdge.localizationFloor = opt.value;
			} else {
				delete _currentEdge.localizationFloor;
			}
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
	
	$("#edge-info-unit").html(_unit=="meter"?"m":"ft");

	if ($NC.loc.isAdvanced()) {
		var loc = $NC.loc.getById(_currentEdge.localizationID);

		$util.setOptions("edge-info-localization", _localizations, _currentEdge.localizationID, 
				function(i){return _localizations[i].id},
				function(v, i){return v.name});
	}
	function checkFloor() {
		var opt = $util.getSelectedOption("edge-info-localization");
		var loc = $NC.loc.getById(opt.value);
		if (loc) {
			_currentEdge.localizationID = loc.id;
		} else {
			delete _currentEdge.localizationID;
		}
		if (loc && loc.floors) {
			$("#edge-info-localization-floor").parent().removeClass("hidden");
			var floors = loc.floors.split(",");
			$util.setOptions("edge-info-localization-floor", floors, _currentEdge.localizationFloor,
					function(i){return floors[i];}, $util.first);					
		} else {
			$("#edge-info-localization-floor").empty();
			$("#edge-info-localization-floor").parent().addClass("hidden");
		}
		$("#edge-info-localization-floor").trigger("change");
	}
	checkFloor();
	
}

function updateEdgeLength(edge) {
	var n1 = _currentLayer.nodes[edge.node1];
	var n2 = _currentLayer.nodes[edge.node2];
	var p1 = n1.infoFromEdges[edge.id];
	var p2 = n2.infoFromEdges[edge.id];
	var len = $geom.getDistanceOfTwoPoints(p1, p2);
	
	if ($NC.loc.getById(edge.localizationID).type.match(/2D/)) {
		if (edge.path) {
			len = 0;
			var prev = null;
			for(var i = 0; i < edge.path.length; i++) {
				var curr = edge.path[i]; 
				if (prev) {
					len += $geom.getDistanceOfTwoPoints(prev, curr);
				}
				prev = curr;
			}
		}
	}
	if (_edgeInfoEditorLenInput)
		_edgeInfoEditorLenInput.value = len;
	edge.len = len;
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