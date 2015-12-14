/*******************************************************************************
 * Copyright (c) 2015 Daisuke Sato, dsato@jp.ibm.com
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

$NC.poi = (function() {
	
	var POI = (function() {	
		function _POI(data) {
			this.marker = null;
			this.marker2 = null;
			this.line = null;
			for(var k in data) {
				this[k] = data[k];
			}
			if (this.point) {
				var p = this.fromLatlngToPointOnEdge(this.point);
				this.setPoint(p);
			}
			this.update();
		}

		_POI.prototype = {	
			toJSON: function() {
				console.log("POI.toJSON is called"); 
				return {
					id: this.id,
					name: this.name,
					description: this.description,
					x: this.x,
					y: this.y,
					lat: this.lat,
					lng: this.lng,
					side: this.side
				};
			},
			update: function() {
				var ll1 = this.fromPointToLatlngOnEdge();
				var ll2 = this;
				var ll3 = this.node2;
				if (_map && _map.getProjection()) {
					var p1 = _map.getProjection().fromLatLngToPoint(ll1);
					var p2 = _map.getProjection().fromLatLngToPoint(new google.maps.LatLng(ll2.lat, ll2.lng));
					var p3 = _map.getProjection().fromLatLngToPoint(new google.maps.LatLng(ll3.lat, ll3.lng));
					var d = -$geom.getAngle(p1, p2, p3) / Math.PI * 180;
					this.orientation = d;
				}
				delete this.direction;
			},
			setLatLngPoint: function(latLng) {
				var p = this.fromLatlngToPointOnEdge(latLng);
				this.setPoint(p);
				this.update();
			},			
			setPoint: function(p) {
				this.x = Math.round(p.x*10)/10;
				this.y = Math.round(p.y*10)/10;
				this.update();
			},
			getPoint: function() {
				return {x: this.x, y: this.y}
			},
			
			fromPointToLatlngOnEdge: function() {
				var i1 = this.node1.infoFromEdges[this.edge.id];
				var i2 = this.node2.infoFromEdges[this.edge.id];
				var t = $geom.getDistanceOfTwoPoints(i1, this) / $geom.getDistanceOfTwoPoints(i1, i2);
				
				return new google.maps.LatLng({
					lat: this.node1.lat + (this.node2.lat - this.node1.lat) * t,
					lng: this.node1.lng + (this.node2.lng - this.node1.lng) * t
				});
			},
			
			fromLatlngToPointOnEdge: function(p) {
				var ei1 = this.node1.infoFromEdges[this.edge.id];
				var ei2 = this.node2.infoFromEdges[this.edge.id];				
				var n1p = _map.getProjection().fromLatLngToPoint(new google.maps.LatLng(this.node1.lat, this.node1.lng));
				var n2p = _map.getProjection().fromLatLngToPoint(new google.maps.LatLng(this.node2.lat, this.node2.lng));
				var pp = _map.getProjection().fromLatLngToPoint(p);				
				var t = $geom.getDistanceOfTwoPoints(n1p, pp) / $geom.getDistanceOfTwoPoints(n1p, n2p);
				return {
					x: ei1.x + (ei2.x - ei1.x) * t,
					y: ei1.y + (ei2.y - ei1.y) * t
				};
			},
			getLatLng: function() {
				return new google.maps.LatLng({
					lat: this.lat,
					lng: this.lng
				});
			},
			setLatLng: function(lat, lng) {
				this.lat = lat;
				this.lng = lng;
				this.update();
			},
			
			render: function() {
				if (!this.marker) {
					var me = this;
					this.marker = new MarkerWithLabel({
					    	position: new google.maps.LatLng(this.lat, this.lng),
					    	draggable: true,
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
							labelContent: this.id,
							labelClass: "labels",
					    	labelAnchor: new google.maps.Point(10.5, 6.25)
					    });
					this.marker.id = this.id;

					this.marker.addListener("click", function(e) {
						me.showInfo();
					});
					["drag", "dragend"].forEach(function(name) {
						me.marker.addListener(name, function(e) {
							this.setPosition(e.latLng);
							me.setLatLng(e.latLng.lat(), e.latLng.lng());
							var path = [me.fromPointToLatlngOnEdge(), me.getLatLng()];
							me.line.setPath(path);
						});
					});
				}
				if (!this.marker2) {
					var me = this;
					this.marker2 = new MarkerWithLabel({
					    	position: this.fromPointToLatlngOnEdge(),
					    	draggable: true,
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
							labelClass: "labels",
					    	labelAnchor: new google.maps.Point(10.5, 6.25)
					    });
					this.marker2.id = this.id;

					["drag", "dragend"].forEach(function(name) {
						me.marker2.addListener(name, function(e) {
							me.setLatLngPoint(e.latLng);
							this.setPosition(me.fromPointToLatlngOnEdge());						
							var path = [me.fromPointToLatlngOnEdge(), me.getLatLng()];
							me.line.setPath(path);
						});
					});
				}
				this.marker.setMap(_map);
				this.marker.setPosition(this.getLatLng());
				this.marker2.setMap(_map);
				this.marker2.setPosition(this.fromPointToLatlngOnEdge());
				
				if (!this.line) {
					this.line = newLine(_map, [this.fromPointToLatlngOnEdge(), this.getLatLng()]);
				}
				this.line.setMap(_map);
				this.line.setPath([this.fromPointToLatlngOnEdge(), this.getLatLng()]);
			},

			derender: function() {
				console.log("derender poi");
				if (this.marker) this.marker.setMap(null);
				if (this.marker2) this.marker2.setMap(null);
				if (this.line) this.line.setMap(null);
			},

			showInfo: function() {
				_currentPOI = this;
				_poiInfoWindow.setPosition(new google.maps.LatLng(this.lat, this.lng));
				$NC.infoWindow.trigger("closeall");
				_poiInfoWindow.open(_map);
				_poiInfoWindow.target = this;
				var me = this;
				if (!_poiInfoWindow.initialized) {
					_poiInfoWindow.initialized = true;
					["name", "description", "x", "y"].forEach(function(key) {
						$("#poi-info-"+key).on("keyup", function() {
							var me = _poiInfoWindow.target;
							me[key] = $("#poi-info-"+key).val();
							me.update();
						});
						$("#poi-info-"+key).on("change", function() {
							var me = _poiInfoWindow.target;
							me[key] = $("#poi-info-"+key).val();
							me.update();
							me.render();
						});
					});
					$("#poi-info-optional").on("change", function() {
						if ($("#poi-info-optional").attr("checked")) {
							$("#poi-info-optional-settings").show();
						} else {
							$("#poi-info-optional-settings").hide();
						}
					});
					["forward", "backward"].forEach(function(key) {
						$("#poi-info-"+key).on("change", function() {
							var me = _poiInfoWindow.target;
							me[key] = $("#poi-info-"+key).attr("checked") == "checked";
							me.update();
							me.render();
						});
					});
					$("#poi-info-delete").on("click", function() {
						removeCurrentPOI();
					});
				};
				$("#poi-info-optional-settings").hide();
				$("#poi-info-optional").attr("checked", false);
				$("#poi-info-edge").val(this.edge.id);
				$("#poi-info-from-node1-id").text(this.edge.node1);
				$("#poi-info-from-node2-id").text(this.edge.node2);
				$("#poi-info-forward").attr("checked", me["forward"]);
				$("#poi-info-backward").attr("checked", me["backward"]);
				["name", "description", "x", "y"].forEach(function(key) {
					$("#poi-info-"+key).val(me[key]);
				});
			}
		}
		
		return _POI;	
	})();
	
	function addNewPOI(latLng, edge, line, layer) {
		var id = $util.genReadableUUID("P");
		var data = getNewPOI({lat:latLng.lat(), lng:latLng.lng(), id:id, point:line.getPath().getAt(1), 
			edge:edge, line:line, node1: layer.nodes[edge.node1], node2: layer.nodes[edge.node2]});		
		var newPOI = _currentPOI = new POI(data);
		edge.pois = edge.pois || {};
		edge.pois[id] = newPOI;
		newPOI.render();
		newPOI.showInfo();
	}

	function renderPOIsInLayer(layer) {
		for (var e in layer.edges) {
			var edge = layer.edges[e];
			for (var poiID in edge.pois) {
				var poi = edge.pois[poiID];
				if (!(poi instanceof POI)) {
					poi = edge.pois[poiID] = 
						new POI($.extend(poi, {
							edge: edge,
							node1: layer.nodes[edge.node1], 
							node2: layer.nodes[edge.node2]
						}));
				}
				poi.render();
			}
		}
		_currentPOI = null;
	}
	
	$editor.on("derender", function(e, layer) {
		for (var l in _layers) {
			for (var e in _layers[l].edges) {
				for(var p in _layers[l].edges[e].pois) {
					if (_layers[l].edges[e].pois[p] instanceof POI) {
						_layers[l].edges[e].pois[p].derender();
					}
				}
			}
		}
		_currentPOI = null;
	});

	function removeCurrentPOI() {
		_currentPOI.derender();
		delete _currentPOI.edge.pois[_currentPOI.id];
		_currentPOI = null;
		_poiInfoWindow.close();
	}

	function newLine(map, path) {
		return new google.maps.Polyline({
			map: map,
			path: path,
			strokeColor: "#0000B4",
			strokeWeight: 5,
			strokeOpacity: 0.7,
		});
	}
	
	return $({}).extend({
		add: addNewPOI,
		renderInLayer: renderPOIsInLayer,
		removeCurrent: removeCurrentPOI,
		newLine: newLine
	});
})();

