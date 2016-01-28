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
 
function addNewBeacon(latLng, id, uuid, major, minor) {
	var newBeacon = getNewBeacon({lat:latLng.lat(), lng:latLng.lng(), id:id, uuid:uuid, major:major, minor:minor});
	_currentBeacon = newBeacon;
	_currentLayer.beacons[id] = newBeacon;
	$editor.trigger("dataChange");
	renderBeacon(newBeacon);
	showBeaconInfo(newBeacon);
}

function renderBeaconsInLayer(layer) {
	for (var beaconID in layer.beacons) {
		renderBeacon(layer.beacons[beaconID]);
	}
	_currentBeacon = null;
}

$editor.on("derender", function(e, layer) {
	for (var beaconID in layer?layer.beacons:_beaconMarkers) {
		if (_beaconMarkers[beaconID]) {
			_beaconMarkers[beaconID].setMap(null);
			delete _beaconMarkers[beaconID];
		}	
	}
	_currentBeacon = null;
});

function renderBeacon(beacon) {
	if (_beaconMarkers[beacon.id]) {
		_beaconMarkers[beacon.id].setMap(_map);
	} else {
		var image = {
			size: new google.maps.Size(25, 25),
			anchor: new google.maps.Point(12.5, 12.5),
			url: "./img/round-blue.png"
		}
		var beaconMarker = new MarkerWithLabel({
	    	position: new google.maps.LatLng(beacon.lat, beacon.lng),
	    	draggable: true,
	    	raiseOnDrag: false,
	    	icon: image,
	    	shape: {
				coords: [12.5, 12.5, 12.5],
				type: "circle",
			},
			labelContent: beacon.id,
			labelClass: "labels",
	    	labelAnchor: new google.maps.Point(10.5, 6.25)
	    });
	    beaconMarker.setMap(_map);
	    beaconMarker.id = beacon.id;
	    _beaconMarkers[beaconMarker.id] = beaconMarker;
	    beaconMarker.addListener("click", function(e) {
	    	if (_currentBeaconEditState == BeaconEditState.Doing_Nothing) {
	    		_currentBeacon = _currentLayer.beacons[this.id];
	    		showBeaconInfo(_currentBeacon);
	    	};
	    });
	    beaconMarker.addListener("drag", function(e) {
			beaconMarker.setPosition(e.latLng);
			_currentLayer.beacons[this.id].lat = e.latLng.lat();
			_currentLayer.beacons[this.id].lng = e.latLng.lng();
		});
	}
}

function showBeaconInfo(beacon) {
	_beaconInfoWindow.setPosition(new google.maps.LatLng(beacon.lat, beacon.lng));
	$NC.infoWindow.trigger("closeall");
	_beaconInfoWindow.open(_map);

	if (_beaconInfoEditorUUID == null) {
		_beaconInfoEditorUUID = document.getElementById("beacon-info-uuid");
		_beaconInfoEditorMajor = document.getElementById("beacon-info-major");
		_beaconInfoEditorMinor = document.getElementById("beacon-info-minor");
		_beaconInfoEditorPrd = document.getElementById("beacon-info-product-id");
		_beaconInfoEditorID = document.getElementById("beacon-info-beacon-id");
		_beaconInfoEditorEnablePOI = document.getElementById("beacon-info-enable-poi");
		_beaconInfoEditorPOIInfo = document.getElementById("beacon-info-poi-info");

		_beaconInfoEditorUUID.addEventListener("keyup", function(e) {
			_lastUUID = this.value;
			_currentBeacon.uuid = this.value;
		});

		_beaconInfoEditorMajor.addEventListener("keyup", function(e) {
			_lastMajorID = this.value;
			_currentBeacon.major = this.value;
		});

		_beaconInfoEditorMinor.addEventListener("keyup", function(e) {
			if (this.value) {
				_lastMinorID = parseInt(this.value);
			};
			_currentBeacon.minor = this.value;
		});

		_beaconInfoEditorPrd.addEventListener("keyup", function(e) {
			_currentBeacon.prdid = this.value;
		});

		_beaconInfoEditorEnablePOI.addEventListener("change", function(e) {
			_currentBeacon.bePOI = this.checked;
			_beaconInfoEditorPOIInfo.disabled = !this.checked;
			if (this.checked) {
				_currentBeacon.bePOI = true;
			} else {
				_beaconInfoEditorPOIInfo.value = "";
				_currentBeacon[$i18n.k("poiInfo")] = "";
				_currentBeacon.bePOI = false;
			}
		});

		_beaconInfoEditorPOIInfo.addEventListener("keyup", function(e) {
			_currentBeacon[$i18n.k("poiInfo")] = this.value;
		});
	};
	
	_beaconInfoEditorUUID.value = beacon.uuid;
	_beaconInfoEditorMajor.value = beacon.major;
	_beaconInfoEditorMinor.value = beacon.minor;
	_beaconInfoEditorPrd.value = beacon.prdid;
	_beaconInfoEditorID.value = beacon.id;
	_beaconInfoEditorEnablePOI.checked = beacon.bePOI;
	_beaconInfoEditorPOIInfo.disabled = !beacon.bePOI;
	_beaconInfoEditorPOIInfo.value = beacon[$i18n.k("poiInfo")];
}

function removeCurrentBeacon() {
	_beaconMarkers[_currentBeacon.id].setMap(null);
	delete _beaconMarkers[_currentBeacon.id];
	delete _currentLayer.beacons[_currentBeacon.id];
	_currentBeacon = null;
	_beaconInfoWindow.close();
}


function calcBeaconPosForEdge(beacons, nodes, edge) {
	var usingBeacons = getUsingBeacons(edge);
	
	var n1 = nodes[edge.node1];
	var np1 = n1.infoFromEdges[edge.id];
	var n2 = nodes[edge.node2];
	var np2 = n2.infoFromEdges[edge.id];
	var p1 = _map.getProjection().fromLatLngToPoint(new google.maps.LatLng(n1.lat, n1.lng));
	var p2 = _map.getProjection().fromLatLngToPoint(new google.maps.LatLng(n2.lat, n2.lng));	
	
	for(var i in usingBeacons) {
		var beacon = beacons[usingBeacons[i]];
		if (!beacon) {
			continue;
		}
		var p3 = _map.getProjection().fromLatLngToPoint(new google.maps.LatLng(beacon.lat, beacon.lng));
		
		var a = $geom.getDistanceOfTwoPoints(p1,p2);
		var b = $geom.getDistanceOfTwoPoints(p1,p3);
		var r = $geom.getAngle(p1,p2,p3);
		var tmp = $geom.rotate(np2, r, np1); 
		var np3 = {
				x: np1.x + (tmp.x-np1.x)/a*b,
				y: np1.y + (tmp.y-np1.y)/a*b
		};				
		console.log([beacon, edge.id, np3]);
		if (!beacon.infoFromEdges) beacon.infoFromEdges = {};
		beacon.infoFromEdges[edge.id] = np3;
	}
}

function getUsingBeacons(edge) {
	var  data = edge.dataFile;
	if (edge.localizationID && $NC.loc.getById(edge.localizationID)) {
		data = $NC.loc.getById(edge.localizationID).dataFile;
	}
	if (data && data.length > 0 && data.split("\n")[0] && data.split("\n")[0].split(": ")[1]) {
		return data.split("\n")[0].split(": ")[1].split(",");
	}
	return [];
}

function investigateKnnMax() {
	//var result = "";
	for(var i=0; i < _localizations.length; i++) {
		//var max1 = _localizations[i].maxKnnDist;
		var r = calcKnnMax(_localizations[i].dataFile);
		//var max2 = r.max;
		_localizations[i].maxKnnDist = r.min*0.5;
		_localizations[i].minKnnDist = 0;
		
		//result += (r.min+"\t"+max1+"\t"+max2+"\t"+r.ave+"\t"+max1/max2+"\t"+r.num+"\t"+(max2/r.num)*Math.max(r.num,10)+"\n");
	}
	//console.log("\n"+result+"\n");
}

function calcKnnMax(data) {
	var lines = data.split("\n");
		
	var beacons = lines[0].split(": ")[1].split(",");
	beacons.splice(beacons.length-1,1);
	//console.log(beacons);
	var min = Number.MAX_VALUE;
	var max = 0;
	var ave = 0;
	for(var i = 1; i < lines.length; i++) {
		var items = lines[i].split(",");
		if (items.length < 2) {
			continue;
		}
		var dist = 0;
		for(var j = 0; j < parseInt(items[2]); j++) {
			//console.log([j,parseInt(items[3*j+5])]);
			dist += Math.pow(parseInt(items[3*j+5])-(-100), 2) 
		}
		if (max < dist) {
			max = dist;
		}
		if (dist < min) {
			min = dist;
		}
		ave += dist;
	}
	return {
		max:max,
		min:min,
		ave:ave/(lines.length-1),
		num:beacons.length
	};	
}

function removeBeacon(index, minor) {
	var dataFile = _localizations[index].dataFile; 
	var lines = dataFile.split("\n");
	
	var beacons = lines[0].split(": ")[1].split(",");
	for(var i = beacons.length-1; i >= 0; i--) {
		if (beacons[i] == minor) {
			beacons.splice(i,1);
		}
	}
	var header = "MinorID of "+beacons.length+" Beacon Used : "+beacons.join(",");
	for(var i = 1; i < lines.length; i++) {
		var line = lines[i];		
		var items = line.split(",");
		if (items.length < 2) {
			continue;
		}
		var c = 0;
		for(var j = 0; j < parseInt(items[2]); j++) {
			if (parseInt(items[j*3+4]) == minor) {
				items.splice(j*3+3,3);
				c++;
			}
		}
		items[2] = parseInt(items[2])-c;
		line = items.join(",");		
		lines[i] = line;
	}
	for(var i = lines.length-1; i>=0; i--) {
		var items = lines[i].split(",");
		if (parseInt(items[2]) < 2) {
			lines.splice(i,1);
		}
	}
	
	lines[0] = header;
	 _localizations[index].dataFile = lines.join("\n");
}