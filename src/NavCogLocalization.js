$NC.loc = (function() {
	var TYPES = ["1D_Beacon", "2D_Beacon_PDR"];
	var ATTRS = {
		"1D_Beacon" : {
			"dataFile" : {name: "Data File", type: "File", filetype: "text"},
			"minKnnDist" : {name: "Min KnnDist", type: "Number", value: "0"},
			"maxKnnDist" : {name: "Max KnnDist", type: "Number", value: "999"}
		},
		"2D_Beacon_PDR" : {
			"dataFile": {name: "Zip File", type: "File", filetype: "binary"},
			"floors": {name: "Floors", type: "Text", placeholder: "1,2,3"}
		}
	};
	
	var current_loc;
	var isAdvanced = false;
	
	function addLocalization(opt) {
		var loc = getNewLocalization(opt);
		_localizations.push(loc);
		showLocalizations(loc);
	}
	function removeLocalization(loc) {
		for(var i = 0; i < _localizations.length; i++) {
			if (_localizations[i] == loc) {
				_localizations.splice(i,1);
				break;
			}
		}
		showLocalizations();
	}
	
	function showLocalizations(loc) {
		console.log("showLocalizations");
		$util.setOptions("localization-select", _localizations, loc, $util.first, function(o){return o.name});
		showLocalization(loc);
	}
	function showLocalization(loc) {		
		var option = $util.getSelectedOption("localization-select");		
		if (option) { loc = current_loc = _localizations[option.value]; }
		console.log(["showLocalization", loc.type]);
		$util.setOptions("localization-type", TYPES, loc?loc.type:null, function(i){return TYPES[i];}, $i18n.t);
		$("#localization-name-edit").val(loc?loc.name:"").attr("placeholder", $i18n.t("ex.) Edge 1 (1D)"));
		showAttributes(loc);
	}
	
	function showAttributes(loc) {
		loc = loc || current_loc;
		var type = $util.getSelectedOption("localization-type").value;
		loc.type = type;
		var attrs = ATTRS[type];
		
		console.log(["showAttributes", type]);
		var i = 0;
		var $target = $("#localization-attributes");
		$target.empty();
		for(var key in attrs) {
			var id = "localization-attr"+(i++); 
			$target.append($("<label>").text($i18n.t(attrs[key].name)+": ").attr("for",id));
			if (attrs[key].type == "Number" || attrs[key].type == "Text") {
				var $input = $("<input type='"+attrs[key].type.toLowerCase()+"'>").attr("id", id);
				["value", "placeholder"].forEach(function(v) {
					$input.attr(v, attrs[key][v]?attrs[key][v]:"");	
				});
				if (loc && loc[key]) {
					$input.val(loc[key]);
				}				
				$input.change((function(loc, key) {
					return function() {
						loc[key] = $(this).val();
					}
				})(loc, key));
				$target.append($input);
			}
			else if (attrs[key].type == "File") {
				var $input = $("<input type='file'>").attr("id", id);
				var $size = $("<span>").text("0 byte");
				if (loc && loc[key]) {					
					$size.text($util.getSizeString(loc[key].length));
				}
				var $name = $("<span class='attr'>");
				if (loc && loc[key+"Name"]) {
					$name.text(loc[key+"Name"]);
				}
				$input.change((function($input, $size, $name, loc, key, filetype) {
					return function() {
						var file = $input[0].files[0];
						if (file) {
							loc[key+"Name"] = file.name;
							$name.text(file.name);
							var fileReader = new FileReader();
							fileReader.onload = function(e) {
								var data = e.target.result;

								loc[key] = data;
								$size.text($util.getSizeString(data.length));
							}
							switch (filetype) {
							case "text":
								fileReader.readAsText(file);
								break;
							case "binary":
								fileReader.readAsDataURL(file);
								break;
							}
						}					
					}
				})($input, $size, $name, loc, key, attrs[key].filetype));
				$target.append($input);
				$target.append("<br>");
				$target.append($("<label>").text($i18n.t("File Name")+": "));
				$target.append($name);
				$target.append("<br>");
				$target.append($("<label>").text($i18n.t("Size")+": "));
				$target.append($size);
			}
			$target.append("<br>");
		}
	}
	function changeMode() {
		if (isAdvanced && window._isAdvanced) {
			$(document.body).addClass("advanced");
			$("#localization-tab").removeClass("hidden");

			// convert data from v1.0 -> v1.1
			for(var l in _layers) {
				console.log(l);
				for(var e in _layers[l].edges) {
					var edge = _layers[l].edges[e];
					if (edge.dataFile && !edge.localizationID) {
						var id = $util.genUUID();
						_localizations.push({
							name: "Edge "+edge.id+" (1D)",
							dataFile: edge.dataFile,
							maxKnnDist: edge.maxKnnDist,
							minKnnDist: edge.minKnnDist,
							type: "1D_Beacon",
							id: id
						});
						edge.localizationID = id;
					}
					delete edge.dataFile;
					delete edge.maxKnnDist;
					delete edge.minKnnDist;
				}
			}
		} else {
			if (isAdvanced) {
				alert($i18n.t("This editor is not support advanced data"));
			}
			$(document.body).removeClass("advanced");
			$("#localization-tab").addClass("hidden");

			
			// v1.0 and v1.1 compatible data (duplicate data)
			for(var l in _layers) {
				console.log(l);
				for(var e in _layers[l].edges) {
					var edge = _layers[l].edges[e];
					if (edge.localizationID) {
						var loc = getById(edge.localizationID);
						edge.dataFile = loc.dataFile;
						edge.maxKnnDist = loc.maxKnnDist;
						edge.minKnnDist = loc.minKnnDist;
					}
				}
			}
		}
	}

	$editor.on("localizationChange", function(e, loc) {
		showLocalizations();
	});
	
	$(document).ready(function() {
		$("#localization-add-button").click(function() {
			var name = $("#localization-name").val();
			addLocalization({name: name});
		});

		$("#localization-select").change(function() {
			showLocalization();
		});
		$("#localization-name-edit").change(function() {
			current_loc.name = $(this).val();
			showLocalizations(current_loc);
		});
		$("#localization-type").change(function() {
			showAttributes();
		});
		$("#localization-delete").click(function() {
			if (confirm($i18n.t("Are you sure to delete?"))) {
				removeLocalization(current_loc);
			}
		});
		$("#advanced-mode-check").change(function() {
			isAdvanced = ($("#advanced-mode-check").attr("checked") == "checked");
			changeMode();
			showLocalizations();
		});
		
		if (location.search.match(/advanced/)) {
			$("#advanced-mode-check").parent().removeClass("hidden");
			_isAdvanced = true;
		}
	});
	
	function getById(id) {
		var ret = null;
		_localizations.forEach(function(l) {
			if (l.id == id) { ret = l }
		});
		return ret;
	}
	
	function getNameById(id) {
		var ret = getById(id);
		return ret?ret.name:null;
	}

	return {
		getNameById: getNameById,
		getById: getById,
		isAdvanced: function() { return isAdvanced;},
		setAdvanced: function(flag) {isAdvanced = flag;}
	};
})();
