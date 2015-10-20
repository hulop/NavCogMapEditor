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
 
 // used to load/save data locally
var _dataStorageLabel = "NavCogManagerData";

// Editing States
var EditMode = {File:0, Map:1, Topo:2, Beacon:3};
var TopoEditState = {Doing_Nothing:3, Adding_Node:4, Adding_Edge:5, Draging_Node: 9};
var BeaconEditState = {Doing_Nothing:7, Adding_Beacon:8}
var EdgeEditState = {Doing_Nothing:"Doing Nothing", Waiting_Next_Node:"Waiting Next Node", Edge_Done:"Edge Done"}
var _currentEditMode = EditMode.Map;
var _currentTopoEditState = TopoEditState.Doing_Nothing;
var _currentBeaconEditState = BeaconEditState.Doing_Nothing;
var _currentEdgeEditState = EdgeEditState.Doing_Nothing;
var _tmpEdgeLine = null;
var _tmpEdgeNode1 = null;
var _tmpEdgeNode2 = null;

var _map = null;
var _edgeInfoWindow = window.google?new google.maps.InfoWindow({content: _edgeInfoWinHtmlString}):null;
var _nodeInfoWindow =  window.google?new google.maps.InfoWindow({content: _nodeInfoWinHtmlString}):null;
var _beaconInfoWindow =  window.google?new google.maps.InfoWindow({content: _beaconInfoWinHtmlString}):null;

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
var _buildingNames = [];

// map data
var _data = null;
var _layers = {};
var _currentLayer = null;
var _currentNode = null;
var _currentEdge = null;
var _currentBeacon = null;
var _currentRegion = null;

var _mapDataChooser = document.getElementById("map-data-chooser");
var _mapEditorLayerChooser = document.getElementById("map-editor-layer-chooser");
var _mapEditorLayerInput = document.getElementById("map-editor-layer-input");
var _mapEditorImgChooser = document.getElementById("region-image-chooser");
var _mapEditorRegionNameInput = document.getElementById("region-name-input");
var _mapEditorRegionLatInput = document.getElementById("region-center-latitude");
var _mapEditorRegionLngInput = document.getElementById("region-center-longitude");
var _mapEditorRegionChooser = document.getElementById("region-chooser");
var _topoEditorLayerChooser = document.getElementById("topo-layer-chooser");
var _topoEditorBuildingChooser = document.getElementById("topo-building-chooser");
var _beaconEditorLayerChooser = document.getElementById("beacon-info-layer-chooser");

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

// UI Events
_mapEditorLayerChooser.addEventListener("change", function(e) {mapEditorLayerChanged(this, e);});
_mapEditorRegionChooser.addEventListener("change", function(e) {mapEditorRegionChanged(this, e);});
_topoEditorLayerChooser.addEventListener("change", function(e) {mapEditorLayerChanged(this, e);});
_beaconEditorLayerChooser.addEventListener("change", function(e) {mapEditorLayerChanged(this, e);});

_mapDataChooser.addEventListener("change", function(e) {
	var file = this.files[0];
	if (file) {
	    var fr = new FileReader();
	    fr.addEventListener("load", function(e) {
			_data = JSON.parse(fr.result);

			_layers = _data["layers"];
			_maxNodeID = _data["maxNodeID"] || 0;
			_maxEdgeID = _data["maxEdgeID"] || 0;
			_maxBeaconID = _data["maxBeaconID"] || 0;
			_layers = _data.layers;
			_buildingNames = _data.buildings;
			_lastUUID = _data["lastUUID"];
			_lastMajorID = _data["lastMajorID"];
			_lastMinorID = _data["lastMinorID"];

			while (_topoEditorBuildingChooser.value) {
				_topoEditorBuildingChooser.remove(_topoEditorBuildingChooser.selectedIndex);
			}
			for (var name in _buildingNames) {
				addOptionToSelect(_buildingNames[name], _topoEditorBuildingChooser);
			}
			renewSelectWithProertyOfArray(_layers, "z", _mapEditorLayerChooser)
			renewSelectWithProertyOfArray(_layers, "z", _topoEditorLayerChooser)
		        renewSelectWithProertyOfArray(_layers, "z", _beaconEditorLayerChooser)

			for (var nodeID in _nodeMarkers) {
				_nodeMarkers[nodeID].setMap(null);
				delete _nodeMarkers[nodeID];
			}

			for (var edgeID in _edgePolylines) {
				_edgePolylines[edgeID].setMap(null);
				delete _edgePolylines[edgeID];
			}

			for (var beaconID in _beaconMarkers) {
				_beaconMarkers[beaconID].setMap(null);
				delete _beaconMarkers[beaconID];
			}
			//_currentLayer = _layers[_mapEditorLayerChooser.value];
			//renderLayer(_currentLayer);
			reloadMap();
	    });
	    fr.readAsText(file);
	    //dataFileChooser.value = "";
	}
});

function mapEditorLayerChanged(chooser, e) {
	if (_currentLayer != null) {
		deRenderLayer(_currentLayer);
	};
	_currentLayer = _layers[chooser.value];

	selectOptWithText(_currentLayer.z, _mapEditorLayerChooser);
	selectOptWithText(_currentLayer.z, _topoEditorLayerChooser);
	selectOptWithText(_currentLayer.z, _beaconEditorLayerChooser);
	renderLayer(_currentLayer);
}

function mapEditorRegionChanged(chooser, e) {
	_currentRegion = _currentLayer.regions[chooser.value];
}

function getSelectedOption(select_id) {
    var select = document.getElementById(select_id);
    var selected = select.options[select.selectedIndex];
    return selected;
}
