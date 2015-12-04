var _logFunction = new $NavCogLogFunction();

$(document).ready(function() {
	document.getElementById("log-data-chooser").addEventListener("change", _logFunction.loadFile);
});

function $NavCogLogFunction() {
	var logLocations = [];

	function loadFile(e) {
		var file = this.files[0];
		if (file) {
			var fr = new FileReader();
			fr.addEventListener("load", function(e) {
				parseLogData(fr.result);
			});
			fr.readAsText(file);
		}
	}

	function parseLogData(text) {
		text.split("\n").forEach(function(line, i) {
			if (line) {
				var params = line.match(/(.*?) (.*?) (.*?) (.*)/);
				if (params && params.length == 5) {
					var msgs = params[4].split(",");
					var obj;
					switch (msgs[0]) {
					case "FoundCurrentLocation":
						obj = {
							"edge" : msgs[3],
							"x" : msgs[4],
							"y" : msgs[5],
							"dist" : msgs[6]
						};
						break;
					case "CurrentPosition":
						obj = {
							"edge" : msgs[3],
							"x" : msgs[4],
							"y" : msgs[5],
							"dist" : msgs[6]
						};
						break;
					}
					if (obj) {
						obj.event = msgs[0];
						obj.timestamp = params[1] + " " + params[2];
						// console.log(JSON.stringify(obj));
						logLocations.push(obj);
					}
				}
			}
		});
	}

	function renderLayer(layer) {
		for ( var edgeID in layer.edges) {
			drawMarkers(layer.edges[edgeID]);
		}
	}

	function drawMarkers(edge) {
		for (var i = 0; i < logLocations.length; i++) {
			var log = logLocations[i];
			if (log.edge == edge.id) {
				var marker = logLocations[i].marker;
				if (!marker) {
					var node1 = _currentLayer.nodes[edge.node1], node2 = _currentLayer.nodes[edge.node2];
					var info1 = node1.infoFromEdges[edge.id], info2 = node2.infoFromEdges[edge.id]
					// console.log(log);
					// console.log(edge);
					// console.log(node1);
					// console.log(node1.lat + "," + node1.lng);
					// console.log(node2.lat + "," + node2.lng);
					// console.log(info1.x + "," + info1.y);
					// console.log(info2.x + "," + info2.y);
					var ratio = (log.y - info1.y) / (info2.y - info1.y);
					var lat = node1.lat + (node2.lat - node1.lat) * ratio;
					var lng = node1.lng + (node2.lng - node1.lng) * ratio;
					// console.log(ratio + "," + lat + "," + lng);
					var title = log.timestamp.substr(17, 2); // i + 1;
					var hover = (log.event == "CurrentPosition" ? "Navigation position" : "Current location");
					hover += "\n" + log.timestamp;
					hover += "\n";
					hover += "\npos.x: " + log.x + "\npos.y: " + log.y + "\npos.knndist: " + log.dist;
					hover += "\n";
					hover += "\nedge.id: " + edge.id;
					hover += "\nedge.minKnnDist: " + edge.minKnnDist;
					hover += "\nedge.maxKnnDist: " + edge.maxKnnDist;
					hover += "\n";
					hover += "\nnode1.id: " + node1.id;
					hover += "\nnode1.knnDistThres: " + node1.knnDistThres;
					hover += "\nnode1.posDistThres: " + node1.posDistThres;
					hover += "\n";
					hover += "\nnode2.id: " + node2.id;
					hover += "\nnode2.knnDistThres: " + node2.knnDistThres;
					hover += "\nnode2.posDistThres: " + node2.posDistThres;
					var options = {
						position : new google.maps.LatLng(lat, lng),
						draggable : false,
						raiseOnDrag : false,
						labelContent : title,
						labelClass : "labels",
						title : hover,
						labelAnchor : new google.maps.Point(10.5, 35)
					};
					if (log.event == "CurrentPosition") {
						options.icon = {
							size : new google.maps.Size(25, 25),
							anchor : new google.maps.Point(12.5, 12.5),
							url : "./img/round-blue.png"
						};
						options.shape = {
							coords : [ 12.5, 12.5, 25 ],
							type : "circle",
						};
						options.labelAnchor = new google.maps.Point(10.5, 6.25);
					}
					logLocations[i].marker = marker = new MarkerWithLabel(options);
				}
				marker.setMap(_map);
			}
		}
	}

	$editor.on("derender", function(e, layer) {
		for (var i = 0; i < logLocations.length; i++) {
			var marker = logLocations[i].marker;
			if (marker) {
				marker.setMap(null);
			}
		}
	});

	return {
		"loadFile" : loadFile,
		"renderLayer" : renderLayer
	};
}