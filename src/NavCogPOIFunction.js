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

		function getNearestSegmentXY(path, p1) {
			var min = Number.MAX_VALUE;
			var mini;
			var minp;
			for(var i = 0; i < path.length-1; i++) {
				var p2 = $geom.getNearestPointOnLineSegFromPoint({p1:path[i],p2:path[i+1]},p1);
				var d = $geom.getDistanceOfTwoPoints(p1,p2);
				if (d < min) {
					min = d;
					mini = i;
					minp = p2;
				}
			}
			return {p1:path[mini],p2:path[mini+1],p3:minp};
		}
		function getNearestSegment(path, latlng) {
			var p1 = _map.getProjection().fromLatLngToPoint(latlng);
			var min = Number.MAX_VALUE;
			var mini;
			var minp;
			for(var i = 0; i < path.length-1; i++) {
				var pp1 = _map.getProjection().fromLatLngToPoint(new google.maps.LatLng(path[i].lat,path[i].lng));
				var pp2 = _map.getProjection().fromLatLngToPoint(new google.maps.LatLng(path[i+1].lat,path[i+1].lng));				
				var p2 = $geom.getNearestPointOnLineSegFromPoint({p1:pp1,p2:pp2},p1);
				var d = $geom.getDistanceOfTwoPoints(p1,p2);
				if (d < min) {
					min = d;
					mini = i;
					minp = p2;
				}
			}
			return {p1:path[mini],p2:path[mini+1],p3:minp};
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
					orientation: this.orientation,
					side: this.side
				};
			},		
			/*
			 * calculate orientation
			 *      ll2(this)*
			 *            ll1|
			 *  node1 *------*------* node2
			 */
			update: function() {
				var ll1 = this.fromPointToLatlngOnEdge();
				var ll2 = this;
				var ll3 = this.node2;
				if (_map && _map.getProjection()) {
					var p1 = _map.getProjection().fromLatLngToPoint(ll1);
					if (this.edge.path) {
						var seg = getNearestSegment(this.edge.path, ll1);
						ll3 = seg.p2;
					}
					var p2 = _map.getProjection().fromLatLngToPoint(new google.maps.LatLng(ll2.lat, ll2.lng));
					var p3 = _map.getProjection().fromLatLngToPoint(new google.maps.LatLng(ll3.lat, ll3.lng));
					
					var d = -$geom.getAngle(p1, p2, p3) / Math.PI * 180;
					this.orientation = d;					
					if (Math.abs(this.orientation) < 30) {
						this.side = "front";
					}
					else if (Math.abs(this.orientation) > 150) {
						this.side = "back";
					}
					else if (this.orientation > 0) {
						this.side = "right";
					}
					else if (this.orientation < 0) {
						this.side = "left";
					}
				}
				delete this.direction;
			},
			// operator for the point on the edge
			setLatLngPoint: function(latLng) {
				var p = this.fromLatlngToPointOnEdge(latLng);
				this.setPoint(p);
				this.update();
			},			
			getLatLngPoint: function() {
				return this.fromPointToLatlngOnEdge();
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
				var mind = Number.MAX_VALUE;
				var mini;
				var n1 = this.node1;
				var i1 = n1.infoFromEdges[this.edge.id];
				var n2 = this.node2;
				var i2 = n2.infoFromEdges[this.edge.id];				

				if (this.edge.path) {
					var seg = getNearestSegmentXY(this.edge.path, this);
					i1 = seg.p1;
					i2 = seg.p2;
					n1 = seg.p1;
					n2 = seg.p2;
				}				
				var t = $geom.getDistanceOfTwoPoints(i1, this) / $geom.getDistanceOfTwoPoints(i1, i2);				
				return new google.maps.LatLng({
					lat: n1.lat + (n2.lat - n1.lat) * t,
					lng: n1.lng + (n2.lng - n1.lng) * t
				});
			},
			fromLatlngToPointOnEdge: function(p) {
				var pp = _map.getProjection().fromLatLngToPoint(p);				
				var n1 = this.node1;
				var n2 = this.node2;
				var ei1 = n1.infoFromEdges[this.edge.id];
				var ei2 = n2.infoFromEdges[this.edge.id];				

				if (this.edge.path) {
					var seg = getNearestSegment(this.edge.path, p);
					ei1 = seg.p1;
					ei2 = seg.p2;
					n1 = seg.p1;
					n2 = seg.p2;
				}				
				
				var n1p = _map.getProjection().fromLatLngToPoint(new google.maps.LatLng(n1.lat, n1.lng));
				var n2p = _map.getProjection().fromLatLngToPoint(new google.maps.LatLng(n2.lat, n2.lng));
				var t = $geom.getDistanceOfTwoPoints(n1p, pp) / $geom.getDistanceOfTwoPoints(n1p, n2p);
				return {
					x: ei1.x + (ei2.x - ei1.x) * t,
					y: ei1.y + (ei2.y - ei1.y) * t
				};
			},
			
			// operators for the POI point
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
							me.updatePosition(e.latLng);
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
							me.updateLatLngPoint(e.latLng);
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
			updatePosition: function(latLng) {
				this.marker.setPosition(latLng);
				this.setLatLng(latLng.lat(), latLng.lng());
				var path = [this.fromPointToLatlngOnEdge(), this.getLatLng()];
				this.line.setPath(path);
			},
			updateLatLngPoint: function(latLng) {
				this.setLatLngPoint(latLng);
				this.marker2.setPosition(this.fromPointToLatlngOnEdge());						
				var path = [this.fromPointToLatlngOnEdge(), this.getLatLng()];
				this.line.setPath(path);
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

