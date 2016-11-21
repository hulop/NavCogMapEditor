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

 var GOOGLE_MAP_DEFAULT_STYLE = {
		featureType: "poi",
		elementType: "labels",
		stylers : [
			{visibility: "off"}
		]
	};

function getNewGoogleMap() {
	function CoordMapType(tileSize) {
		  this.tileSize = tileSize;
		}

		CoordMapType.prototype.maxZoom = 24;
		CoordMapType.prototype.name = 'Tile #s';
		CoordMapType.prototype.alt = 'Tile Coordinate Map Type';

		CoordMapType.prototype.getTile = function(coord, zoom, ownerDocument) {
		  var div = ownerDocument.createElement('div');
		  div.style.width = this.tileSize.width + 'px';
		  div.style.height = this.tileSize.height + 'px';
		  div.style.backgroundColor = '#E5E3DF';
		  return div;
		};
	var map =  new google.maps.Map(document.getElementById("google-map-view"), {
		zoom : 21,
		center : {
		    lat : 40.44341980831697,
		    lng : -79.94513064622879
		},
		disableDefaultUI: true,
		styles : [GOOGLE_MAP_DEFAULT_STYLE],
		zoomControl: true,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		mapTypeControlOptions: {
		      mapTypeIds: ['nomap', google.maps.MapTypeId.ROADMAP],
		      style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
		    }
    });
	  map.mapTypes.set('nomap',
              new CoordMapType(new google.maps.Size(256, 256)));
	  return map;
}

function getNewLayer(opt) {
	return $.extend({
		z: 0,
		regions: {

		},
		nodes: {

		},
		edges: {

		},
		beacons: {

		}
	}, opt);
}

function getNewRegion(opt) {
	return $.extend({
		name: "",
		image: "", // data url or path to image
		lat: 0,
		lng: 0,
		ppm: 16,
		rotate: 0.0
	}, opt);
}

function getNewEdge(opt) {
	return $.extend({
		id: 0,
		type: 0,
		len: 0,
		node1: 0,
		node2: 0,
		infoFromNode1: "",
		infoFromNode2: "",
		oriFromNode1: 0,
		oriFromNode2: 180,
		minKnnDist: 0,
		maxKnnDist: 0,
		dataFile: "",
	}, opt);
}

function getNewNode(opt) {
	return $.extend({
		id: 0,
		name: "",
		type: 0,
		building: "None",
		floor: 1,
		layerZ: 0,
		lat: 0,
		lng: 0,
		infoFromEdges: {

		},
		transitInfo: {

		},
		knnDistThres: 0.1,
		posDistThres: 5
	}, opt);
}

function getNewTransitInfoToLayer(layer) {
	return {
		layerZ: layer.z,
		enabled: false,
		node: "0",
		info: "",
	}
}

function getNewNodeInfoFromEdge(edge) {
	return {
		edgeID: edge.id,
		x: 0,
		y: 0,
		info: "",
		destInfo: "",
		beTricky: false,
		trickyInfo: ""
	}
}

function getNewBeacon(opt) {
	return $.extend({
		lat: 0,
		lng: 0,
		id: 0,
		uuid: "",
		major: 0,
		minor: 0,
		prdid: "",
		bePOI: false,
		poiInfo: ""
	}, opt);
}


function getNewLocalization(opt) {
	return $.extend({
		id: $util.genUUID(),
		name: "",
		dataFile: "",
		type: ""
	}, opt);
}

function getNewPOI(opt) {
	return $.extend({
		name: "",
		id: 0,
		description: "",
		x: 0,
		y: 0,
		side: "unknown",
		forward: true,
		backward: true
	}, opt);
}

/*
 * IndoorMapOverlay displays an indoor map image on a google map.
 * It calculates bounds from @width, @height, and center point (@lat, @lng)
 * @rotate makes the image (@src) rotated in degrees.
 *
 * @lat:     latitude of the center
 * @lng:     longitude of the center
 * @rotate:  rotate angle of the image (degrees, default 0)
 * @width:   width in meter
 * @height:  height in meter
 * @src:     image src
 * @opacity: opacity of the image (default 1.0)
 */
function FloorPlanOverlay(options) {
    this.setOption(options);
    this.dom = null;
}

FloorPlanOverlay.prototype = window.google?new google.maps.OverlayView():{setMap:function(){}};

FloorPlanOverlay.prototype.setOption = function(options) {
    if (options) {
    	for(var key in options) {
    	    this[key] = options[key];
    	}
    }
}

FloorPlanOverlay.prototype.onAdd = function() {
    var div = document.createElement('div');
    div.style.borderStyle = 'none';
    div.style.borderWidth = '0px';
    div.style.position = 'absolute';

    var img = document.createElement('img');
    img.style.width = '100%';
    img.style.position = 'absolute';
    img.style.opacity = this.opacity || 1.0;
    img.src = this.src;

    div.appendChild(img);
    this.dom = div;

    var panes = this.getPanes();
    panes.overlayLayer.appendChild(div);
};

FloorPlanOverlay.prototype.draw = function() {
    var center = new google.maps.LatLng(this.lat, this.lng);
    var width = this.width / this.ppm;
    var height = this.height / this.ppm;

    var len = Math.sqrt(Math.pow(width/2,2)+Math.pow(height/2,2));
    var dne = Math.atan2(+width/2, +height/2);
    var dsw = Math.atan2(-width/2, -height/2);
    var ne = google.maps.geometry.spherical.computeOffset(center, len, dne*180/Math.PI);
    var sw = google.maps.geometry.spherical.computeOffset(center, len, dsw*180/Math.PI);

    var prj = this.getProjection();
    sw = prj.fromLatLngToDivPixel(sw);
    ne = prj.fromLatLngToDivPixel(ne);

    var div = this.dom;
    div.style.left = sw.x + 'px';
    div.style.top = ne.y + 'px';
    div.style.width = (ne.x - sw.x) + 'px';
    div.style.height = (sw.y - ne.y) + 'px';

    //var img = this.dom.firstChild;


    // cross browser
    div.style.webkitTransform = "rotate("+this.rotate+"deg)";
    div.style.oTransform = "rotate("+this.rotate+"deg)";
    div.style.transform = "rotate("+this.rotate+"deg)";

    //console.log(sw.x+", "+sw.y+", "+ne.x+", "+ne.y);
};

FloorPlanOverlay.prototype.move = function(options) {
    var center = new google.maps.LatLng(this.lat, this.lng);
    center = google.maps.geometry.spherical.computeOffset(center, options.length, options.direction);
    this.lat = center.lat();
    this.lng = center.lng();
    return center;
}

FloorPlanOverlay.prototype.onRemove = function() {
    this.dom.parentNode.removeChild(this.dom);
    this.dom = null;
};

FloorPlanOverlay.prototype.setMap = (function(_super) {
    return function(map) {
	   return _super.call(this, map?map:null);
    }
})(FloorPlanOverlay.prototype.setMap);