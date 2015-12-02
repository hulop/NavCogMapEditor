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
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 ******************************************************************************/
// for namespace
var $NC = {};

// used to load/save data locally
var _dataStorageLabel = "NavCogManagerData";

// Editing States
var EditMode = {
	File : 0,
	Map : 1,
	Topo : 2,
	Beacon : 3
};
var TopoEditState = {
	Doing_Nothing : 3,
	Adding_Node : 4,
	Adding_Edge : 5,
	Draging_Node : 9
};
var BeaconEditState = {
	Doing_Nothing : 7,
	Adding_Beacon : 8
}
var EdgeEditState = {
	Doing_Nothing : "Doing Nothing",
	Waiting_Next_Node : "Waiting Next Node",
	Edge_Done : "Edge Done"
}
var _currentEditMode = EditMode.Map;
var _currentTopoEditState = TopoEditState.Doing_Nothing;
var _currentBeaconEditState = BeaconEditState.Doing_Nothing;
var _currentEdgeEditState = EdgeEditState.Doing_Nothing;
var _tmpEdgeLine = null;
var _tmpEdgeNode1 = null;
var _tmpEdgeNode2 = null;

var _map = null;
var _edgeInfoWindow = null;
var _nodeInfoWindow = null;
var _beaconInfoWindow = null;

var _maxNodeID = 0;
var _maxEdgeID = 0;
var _maxBeaconID = 0;
var _lastUUID = "";
var _lastMajorID = "";
var _lastMinorID = 0;

// ui datas
var _regionOverlays = {};
var _nodeMarkers = {};
var _edgePolylines = {};
var _beaconMarkers = {};
var _buildings = [];

// map data
var _data = null;
var _layers = {};
var _currentLayer = null;
var _currentNode = null;
var _currentEdge = null;
var _currentBeacon = null;
var _currentRegion = null;

var _mapDataChooser;
var _mapEditorLayerChooser;
var _mapEditorLayerInput;
var _mapEditorImgChooser;
var _mapEditorRegionNameInput;
var _mapEditorRegionLatInput;
var _mapEditorRegionLngInput;
var _mapEditorRegionChooser;
var _topoEditorLayerChooser;
var _topoEditorBuildingChooser;
var _beaconEditorLayerChoose;

// ui for node info editor
var _nodeInfoEditorTypeChooser;
var _nodeInfoEditorNameInput;
var _nodeInfoEditorIDInput;
var _nodeInfoEditorBuildingChooser;
var _nodeInfoEditorFloor;
var _nodeInfoEditorDestInfo;
var _nodeInfoEditorEdgeChooser;
var _nodeInfoEditorTopoXInput;
var _nodeInfoEditorTopoYInput;
var _nodeInfoEditorNodeInfoInput;
var _nodeInfoEditorTrickyEnableChecker;
var _nodeInfoEditorTrickyInfoInput;
var _nodeInfoEditorTransitLayerChooser;
var _nodeInfoEditorTransitEnableChecker;
var _nodeInfoEditorTransitNodeChooser;
var _nodeInfoEditorTransitInfoInput;
var _nodeInfoEditorKnnDistInput;
var _nodeInfoEditorPosDistInput;

// ui for edge info editor
var _edgeInfoEditorIDInput;
var _edgeInfoEditorLenInput;
var _edgeInfoEditorOriInput;
var _edgeInfoEditorXInput1;
var _edgeInfoEditorYInput1;
var _edgeInfoEditorXInput2;
var _edgeInfoEditorYInput2;
var _edgeInfoEditorMinKnnDistInput;
var _edgeInfoEditorMaxKnnDistInput;
var _edgeInfoEditorDataFileName;
var _edgeInfoEditorDataFileChooser;
var _edgeInfoEditorNodeID1;
var _edgeInfoEditorNodeID2;
var _edgeInfoEditorInfo1;
var _edgeInfoEditorInfo2;

// ui for beacon info editor
var _beaconInfoEditorUUID;
var _beaconInfoEditorMajor;
var _beaconInfoEditorMinor;
var _beaconInfoEditorPrd;
var _beaconInfoEditorID;
var _beaconInfoEditorEnablePOI;
var _beaconInfoEditorPOIInfo;

var _regionPosLargeStep = 5;
var _regionPosSmallStep = 0.3;
var _regionSizeLargeStep = 0.5;
var _regionSizeSmallStep = 0.1;
var _regionRotateLargeStep = 2;
var _regionRotateSmallStep = 0.1;

$editor = $({});

$(document).ready(function() {
	// elements
	_mapDataChooser = document.getElementById("map-data-chooser");
	_mapEditorLayerChooser = document.getElementById("map-editor-layer-chooser");
	_mapEditorLayerInput = document.getElementById("map-editor-layer-input");
	_mapEditorImgChooser = document.getElementById("region-image-chooser");
	_mapEditorRegionNameInput = document.getElementById("region-name-input");
	_mapEditorRegionLatInput = document.getElementById("region-center-latitude");
	_mapEditorRegionLngInput = document.getElementById("region-center-longitude");
	_mapEditorRegionChooser = document.getElementById("region-chooser");
	_topoEditorLayerChooser = document.getElementById("topo-layer-chooser");
	_topoEditorBuildingChooser = document.getElementById("topo-building-chooser");
	_beaconEditorLayerChooser = document.getElementById("beacon-info-layer-chooser");

	function mapEditorLayerChanged(chooser, e) {
		if (_currentLayer != null) {
			$editor.trigger("derender", _currentLayer);
		}
		_currentLayer = _layers[chooser.value];
		$editor.trigger("layerChange", _currentLayer);
		renderLayer(_currentLayer);
	}

	// UI Events
	_mapEditorLayerChooser.addEventListener("change", function(e) {
		mapEditorLayerChanged(this, e);
	});
	_mapEditorRegionChooser.addEventListener("change", function(e) {
		mapEditorRegionChanged(this, e);
	});
	_topoEditorLayerChooser.addEventListener("change", function(e) {
		mapEditorLayerChanged(this, e);
	});
	_beaconEditorLayerChooser.addEventListener("change", function(e) {
		mapEditorLayerChanged(this, e);
	});

	_topoEditorBuildingChooser.addEventListener("change", function(e) {
		$editor.trigger("buildingChange");
	});

	_mapDataChooser.addEventListener("change", function(e) {
		var file = this.files[0];
		if (file) {
			var fr = new FileReader();
			fr.addEventListener("load", function(e) {
				_data = JSON.parse(fr.result);
				$editor.trigger("dataLoaded");
			});
			fr.readAsText(file);
			// dataFileChooser.value = "";
		}
	});
	
	document.getElementById("log-data-chooser").addEventListener("change", function(e) {
		var file = this.files[0];
		if (file) {
			var fr = new FileReader();
			fr.addEventListener("load", function(e) {
				parseLogData(fr.result);
			});
			fr.readAsText(file);
		}
	});

	function parseLogData(text) {
		window._logData = text;
		window._logLocations = [];
		text.split("\n").forEach(function(line, i){
			if (line) {
//				console.log(line);
				var params = line.match(/(.*?) (.*?) (.*?) (.*)/);
				if (params && params.length==5) {
					var date = params[1], time = params[2], msgs = params[4].split(",");
					switch (msgs[0]) {
					case "FoundCurrentLocation":
						var obj = {"date":date, "time":time, "layer":msgs[2], "edge":msgs[3], "x":msgs[4], "y":msgs[5]};
						console.log(JSON.stringify(obj));
						_logLocations.push(obj);
						break;
					}
				}
			}
		});
	}
	
});



function mapEditorRegionChanged(chooser, e) {
	_currentRegion = _currentLayer.regions[chooser.value];
}


// Internationalization

$i18n.on("initialized", function() {
	_edgeInfoWinHtmlString = $i18n.convert(_edgeInfoWinHtmlString);
	_nodeInfoWinHtmlString = $i18n.convert(_nodeInfoWinHtmlString);
	_beaconInfoWinHtmlString = $i18n.convert(_beaconInfoWinHtmlString);

	_edgeInfoWindow = window.google ? new google.maps.InfoWindow({
		content : _edgeInfoWinHtmlString
	}) : null;
	_nodeInfoWindow = window.google ? new google.maps.InfoWindow({
		content : _nodeInfoWinHtmlString
	}) : null;
	_beaconInfoWindow = window.google ? new google.maps.InfoWindow({
		content : _beaconInfoWinHtmlString
	}) : null;
});

$(document).ready(function() {
	// add supported languages
	$i18n.addSupportedLanguage("ja-JP", "Japanese 日本語", "i18n/ja-JP.json", ["ja"]); 
	$i18n.addSupportedLanguage("en-US", "English (US)", "i18n/en-US.json", ["en"]); 
	
	// load language resource
	var language = window.navigator.userLanguage || window.navigator.language;
	if (window.localStorage) {
		if (window.localStorage["LANGUAGE"]) {
			language = window.localStorage["LANGUAGE"];
		}
	}
	$i18n.setUILanguage(language);
	$util.setOptions("language_select", $i18n.getLanguages(), language);
	

	// set event handler
	function checkUI() {
		function check(select, button) {
			if ($util.getSelectedOption(select)) {
				$("#"+button).attr("disabled", $util.getSelectedOption(select).value == "");
			}
		}
		check("i18n_language_list", "i18n_language_add_button");
		check("i18n_language_selection", "i18n_language_delete_button");
	}
	$("#i18n_language_list").change(checkUI);

	$editor.on("languageChange", function(e, languages) {
		console.log(["languageChange", $.extend({"" : $i18n.t("Base")}, languages)]);
		$util.setOptions("i18n_language_selection", $.extend({"" : $i18n.t("Base")}, languages), $i18n.getLanguageCode());
		checkUI();
	});

	$("#i18n_language_selection").change(function() {
		var option = $util.getSelectedOption('i18n_language_selection');
		$i18n.setLanguageCode(option.value);
		$("#i18n_language_delete_button").attr("disabled", (option.value == ""));
		$editor.trigger("buildingChange");
	});
	$("#i18n_language_delete_button").click(function() {
		var option = $util.getSelectedOption('i18n_language_selection');
		var code = option.value;
		$i18n.deleteLanguageCode(code);
		$i18n.setLanguageCode("");
		_data.languages = $i18n.getLanguageCodes();
		destroyLanguageEntries(code);
		$editor.trigger("languageChange", _data.languages);
		$editor.trigger("buildingChange");
	});
	$("#i18n_language_add_button").click(function() {
		var option = $util.getSelectedOption('i18n_language_list');
		var code = option.value;
		var name = option.innerHTML;
		$i18n.addLanguageCode(code, name);
		_data.languages = $i18n.getLanguageCodes();
		prepareLanguageEntries(code);
		$editor.trigger("languageChange", _data.languages);
		$editor.trigger("buildingChange");
	});
	$("#language_select").change(function(e) {
		var sel = $("#language_select")[0];
		var lang = (sel.options[sel.selectedIndex].value);
		if (window.localStorage) {
			window.localStorage["LANGUAGE"] = lang;
		}
		window.location.reload();
	});

	function deleteLanguageEntries(obj, key, code) {
		delete obj[$i18n.k(key,code)];
	}
	function addLanguageEntries(obj, key, code) {
		var codekey = $i18n.k(key,code);
		if (!obj[codekey]) {
			obj[codekey] = obj[key];
		}
	}
	function prepareLanguageEntries(code) {
		traverseLanguageEntries(addLanguageEntries, code);
	}
	function destroyLanguageEntries(code) {
		traverseLanguageEntries(deleteLanguageEntries, code);
	}
	function traverseLanguageEntries(func, code) {
		for ( var l in _data.layers) {
			var layer = _data.layers[l];
			for ( var n in layer.nodes) {
				var node = layer.nodes[n];
				func(node, "name", code);
				for ( var i in node.infoFromEdges) {
					var info = node.infoFromEdges[i];
					func(info, "info", code);
					func(info, "destInfo", code);
					func(info, "trickyInfo", code);
				}
				for ( var i in node.transitInfo) {
					var info = node.transitInfo[i];
					func(info, "info", code);
				}
			}
			for ( var e in layer.edges) {
				var edge = layer.edges[e];
				func(edge, "infoFromNode1", code);
				func(edge, "infoFromNode2", code);
			}

			for ( var b in layer.beacons) {
				var beacon = layer.beacons[b];
				func(beacon, "poiInfo", code);
			}
		}
		for ( var b in _data.buildings) {
			var building = _data.buildings[b];
			func(building, "name", code);
		}
	}
});


$i18n.on("initialized", function(e, language) {
	// show all language list
	var all = $.extend({}, $i18n.ALL_LANGUAGES);
	for ( var k in all) {
		all[k] = all[k] + " (" + k + ")";
	}
	all = $.extend({
		"" : $i18n.t("Select Language")
	}, all);
	$util.setOptions("i18n_language_list", all);
	
	$i18n.scan();
	$(document.body).show();
	loaded();
});
