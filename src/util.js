$i18n = (function() {
	var ALL_LANGUAGES = {
		"ab" : "Abkhaz",
		"aa" : "Afar",
		"af" : "Afrikaans",
		"ak" : "Akan",
		"sq" : "Albanian",
		"am" : "Amharic",
		"ar" : "Arabic",
		"an" : "Aragonese",
		"hy" : "Armenian",
		"as" : "Assamese",
		"av" : "Avaric",
		"ae" : "Avestan",
		"ay" : "Aymara",
		"az" : "Azerbaijani",
		"bm" : "Bambara",
		"ba" : "Bashkir",
		"eu" : "Basque",
		"be" : "Belarusian",
		"bn" : "Bengali",
		"bh" : "Bihari",
		"bi" : "Bislama",
		"bs" : "Bosnian",
		"br" : "Breton",
		"bg" : "Bulgarian",
		"my" : "Burmese",
		"ca" : "Catalan",
		"ch" : "Chamorro",
		"ce" : "Chechen",
		"ny" : "Chichewa",
		"zh" : "Chinese",
		"cv" : "Chuvash",
		"kw" : "Cornish",
		"co" : "Corsican",
		"cr" : "Cree",
		"hr" : "Croatian",
		"cs" : "Czech",
		"da" : "Danish",
		"dv" : "Divehi",
		"nl" : "Dutch",
		"dz" : "Dzongkha",
		"en" : "English",
		"eo" : "Esperanto",
		"et" : "Estonian",
		"ee" : "Ewe",
		"fo" : "Faroese",
		"fj" : "Fijian",
		"fi" : "Finnish",
		"fr" : "French",
		"ff" : "Fula",
		"gl" : "Galician",
		"ka" : "Georgian",
		"de" : "German",
		"el" : "Greek (modern)",
		"gn" : "Guaraní",
		"gu" : "Gujarati",
		"ht" : "Haitian",
		"ha" : "Hausa",
		"he" : "Hebrew (modern)",
		"hz" : "Herero",
		"hi" : "Hindi",
		"ho" : "Hiri Motu",
		"hu" : "Hungarian",
		"ia" : "Interlingua",
		"id" : "Indonesian",
		"ie" : "Interlingue",
		"ga" : "Irish",
		"ig" : "Igbo",
		"ik" : "Inupiaq",
		"io" : "Ido",
		"is" : "Icelandic",
		"it" : "Italian",
		"iu" : "Inuktitut",
		"ja" : "Japanese",
		"jv" : "Javanese",
		"kl" : "Kalaallisut",
		"kn" : "Kannada",
		"kr" : "Kanuri",
		"ks" : "Kashmiri",
		"kk" : "Kazakh",
		"km" : "Khmer",
		"ki" : "Kikuyu",
		"rw" : "Kinyarwanda",
		"ky" : "Kyrgyz",
		"kv" : "Komi",
		"kg" : "Kongo",
		"ko" : "Korean",
		"ku" : "Kurdish",
		"kj" : "Kwanyama",
		"la" : "Latin",
		"lb" : "Luxembourgish",
		"lg" : "Ganda",
		"li" : "Limburgish",
		"ln" : "Lingala",
		"lo" : "Lao",
		"lt" : "Lithuanian",
		"lu" : "Luba-Katanga",
		"lv" : "Latvian",
		"gv" : "Manx",
		"mk" : "Macedonian",
		"mg" : "Malagasy",
		"ms" : "Malay",
		"ml" : "Malayalam",
		"mt" : "Maltese",
		"mi" : "Māori",
		"mr" : "Marathi (Marāṭhī)",
		"mh" : "Marshallese",
		"mn" : "Mongolian",
		"na" : "Nauru",
		"nv" : "Navajo",
		"nd" : "Northern Ndebele",
		"ne" : "Nepali",
		"ng" : "Ndonga",
		"nb" : "Norwegian Bokmål",
		"nn" : "Norwegian Nynorsk",
		"no" : "Norwegian",
		"ii" : "Nuosu",
		"nr" : "Southern Ndebele",
		"oc" : "Occitan",
		"oj" : "Ojibwe",
		"cu" : "Old Church Slavonic",
		"om" : "Oromo",
		"or" : "Oriya",
		"os" : "Ossetian",
		"pa" : "Panjabi",
		"pi" : "Pāli",
		"fa" : "Persian (Farsi)",
		"pl" : "Polish",
		"ps" : "Pashto",
		"pt" : "Portuguese",
		"qu" : "Quechua",
		"rm" : "Romansh",
		"rn" : "Kirundi",
		"ro" : "Romanian",
		"ru" : "Russian",
		"sa" : "Sanskrit (Saṁskṛta)",
		"sc" : "Sardinian",
		"sd" : "Sindhi",
		"se" : "Northern Sami",
		"sm" : "Samoan",
		"sg" : "Sango",
		"sr" : "Serbian",
		"gd" : "Scottish Gaelic",
		"sn" : "Shona",
		"si" : "Sinhala",
		"sk" : "Slovak",
		"sl" : "Slovene",
		"so" : "Somali",
		"st" : "Southern Sotho",
		"es" : "Spanish",
		"su" : "Sundanese",
		"sw" : "Swahili",
		"ss" : "Swati",
		"sv" : "Swedish",
		"ta" : "Tamil",
		"te" : "Telugu",
		"tg" : "Tajik",
		"th" : "Thai",
		"ti" : "Tigrinya",
		"bo" : "Tibetan Standard",
		"tk" : "Turkmen",
		"tl" : "Tagalog",
		"tn" : "Tswana",
		"to" : "Tonga (Tonga Islands)",
		"tr" : "Turkish",
		"ts" : "Tsonga",
		"tt" : "Tatar",
		"tw" : "Twi",
		"ty" : "Tahitian",
		"ug" : "Uyghur",
		"uk" : "Ukrainian",
		"ur" : "Urdu",
		"uz" : "Uzbek",
		"ve" : "Venda",
		"vi" : "Vietnamese",
		"vo" : "Volapük",
		"wa" : "Walloon",
		"cy" : "Welsh",
		"wo" : "Wolof",
		"fy" : "Western Frisian",
		"xh" : "Xhosa",
		"yi" : "Yiddish",
		"yo" : "Yoruba",
		"za" : "Zhuang",
		"zu" : "Zulu"
	}

	var lang = "en-US"; // default

	var supported = {}
	var languages = {}
	function addSupportedLanguage(lang, name, url, extra_codes) {
		lang = lang.toLowerCase();
		supported[lang] = lang;
		$(extra_codes).each(function(i, e) {
			supported[e.toLowerCase()] = lang;
		});

		languages[lang.toLowerCase()] = {
			name : name,
			url : url
		};
	}
	function getLanguages() {
		var ret = {};
		for ( var key in languages) {
			ret[key] = languages[key].name;
		}
		return ret;
	}

	var loaded = {};

	function getText(id) {
		var data = loaded[lang];

		if (data && data[id]) {
			return data[id];
		}
		return "__" + id + "__";
	}

	function setUILanguage(_lang) {
		_lang = _lang.toLowerCase();
		console.log("set language " + _lang);
		if (supported[_lang]) {
			lang = supported[_lang];
		}
		if (!loaded[lang]) {
			$.ajax({
				url : languages[lang].url, // "./i18n/"+_lang+".json",
				async : true,
				dataType : "json",
				success : function(data) {
					loaded[lang] = data;
					$i18n.trigger("initialized", lang);
				},
				error : function(ajx, error) {
					console.log(error);
				}
			})
		}
	}

	function getUILanguage() {
		return lang;
	}

	var codes = {};
	var code = "";
	function setLanguageCode(_code) {
		code = _code;
	}

	function getLanguageCode() {
		return code;
	}
	function getLanguageCodeString() {
		if (code == "") {
			return $i18n.t("Base");
		}
		return code;
	}

	function getLanguageCodes() {
		return codes;
	}

	function addLanguageCode(code, name) {
		codes[code] = name;
	}

	function deleteLanguageCode(code) {
		delete codes[code];
	}

	function replaceAlli18nTextInDOM() {
		function traverse(el, replace) {
			if (el.nodeType == 3) {
				el.nodeValue = replace(el.nodeValue);
			}
			if (el.nodeType == 1) {
				for (var i = 0; i < el.childNodes.length; i++) {
					traverse(el.childNodes[i], replace);
				}
			}
		}
		traverse(document.body, function(text) {
			return replaceAlli18nTextInString(text);
		});
	}

	function replaceAlli18nTextInString(tmp) {
		while (tmp.match(/(\$\(([^\)]+)\))/) || tmp.match(/(\$\[([^\]]+)\])/)) {
			var a = RegExp.$1;
			var b = RegExp.$2;
			// console.log([a,b,getText(b)]);
			tmp = tmp.replace(a, getText(b));
		}
		return tmp;
	}

	function getKeyCode(key, code) {
		code = code || this.getLanguageCode();
		return key + ((code == "") ? "" : ":" + code);
	}
	return $({}).extend({
		addSupportedLanguage : addSupportedLanguage,
		ALL_LANGUAGES : ALL_LANGUAGES,
		getText : getText,
		t : getText,
		convert : replaceAlli18nTextInString,
		getLanguages : getLanguages,
		setUILanguage : setUILanguage,
		scan : replaceAlli18nTextInDOM,

		addLanguageCode : addLanguageCode,
		deleteLanguageCode : deleteLanguageCode,
		setLanguageCode : setLanguageCode,
		getLanguageCode : getLanguageCode,
		getLanguageCodes : getLanguageCodes,
		getLanguageCodeString : getLanguageCodeString,

		getKeyCode : getKeyCode,
		k : getKeyCode
	});

})();

$util = $({}).extend({
	getSelectedOption : function(select_id) {
		var select = document.getElementById(select_id);
		var selected = select.options[select.selectedIndex];
		return selected;
	},
	setOptions : function(id, keyValues, select, kfunc, vfunc) {
		var $sel = (id.constructor == String) ? $("#" + id) : $(id);
		var kfunc = kfunc || function(i) {
			return i
		};
		var vfunc = vfunc || function(i) {
			return i
		};
		$sel.empty();
		for ( var key in keyValues) {
			var $opt = $("<option>").val(kfunc(key)).text(vfunc(keyValues[key])).attr("selected", select == key);
			$sel.append($opt);
		}
	},
	renewSelectWithProertyOfArray : function(array, property, chooser, select) {
		this.setOptions(chooser, array, select, function(k) {
			return array[k][property]
		}, function(v) {
			return v[property]
		});
	},

	getLangAttrs : function(hash, key, code) {
		code = code || $i18n.getLanguageCode();
		var ret = {};
		for ( var k in hash) {
			ret[k] = this.getLangAttr(hash[k], key, code);
		}
		return ret;
	},
	getLangAttr : function(obj, key, code) {
		code = code || $i18n.getLanguageCode();
		return obj[$i18n.getKeyCode(key, code)];
	},
	genReadableUUID: function(prefix) {
		var uuid = $util.genUUID();
		window._uuids = window._uuids || {};
		for(var i = 0; ; i++) {
			if (!_uuids[prefix+i]) {
				_uuids[prefix+i] = uuid;
				return prefix+i;
			}
		}
	},
	getUUID: function(rid) {
		return _uuids[rid];
	},
	genUUID: function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = crypto.getRandomValues(new Uint8Array(1))[0]%16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	},
});

$geom = {
	getNearestPointOnLineSegFromPoint: function(line, p) {
		var dx = line.p2.x - line.p1.x;
		var dy = line.p2.y - line.p1.y;
		var a = dx*dx + dy*dy;
		var b = dx*(line.p1.x-p.x) + dy*(line.p1.y-p.y);
		if (a == 0) {
			return line.p1;
		}
		var t = -b/a;
		t = (t<0)?0:t;
		t = (t>1)?1:t;
		var tx = line.p1.x + dx*t;
		var ty = line.p1.y + dy*t;
		return {x:tx, y:ty};
	},
	getDistanceOfTwoPoints: function(p1, p2){
		return Math.sqrt(Math.pow(p1.x-p2.x, 2)+Math.pow(p1.y-p2.y,2));
	},

	/*
	 * getDirectionOfPointFromEdge
	 * returns plus if right, minus if left, 0 if on the edge
	 * ex)
	 *     *p1
	 *
	 * *p3 <--------- *p2
	 * return plus value
	 */
	getDirectionOfPointFromEdge: function(p1, p2, p3) {
		//console.log([p1.x, p1.y, p2.x, p2.y, p3.x, p3.y]);
		return p1.x*(p2.y-p3.y) + p2.x*(p3.y-p1.y) + p3.x*(p1.y-p2.y);		
	}
};

var $db = (function() {
	var DB_NAME = 'navcog-map-editor';
	var DB_VERSION = 2;
	var DB_STORE_NAME = 'mapdata';
	var DATA_KEY = 'localmapdata';
	var db;

	function openDb() {
		var req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onsuccess = function(evt) {
			db = this.result;
			$db.trigger("dbopen");
		};
		req.onerror = function(evt) {
			console.error("openDb:", evt.target.errorCode);
		};
		req.onupgradeneeded = function(evt) {
			console.log("openDb.onupgradeneeded");
			var store = evt.currentTarget.result.createObjectStore(DB_STORE_NAME, {
				autoIncrement : false
			});
			store.createIndex("updated", "updated", {
				unique : false
			});
		};
	}

	function getObjectStore(store_name, mode) {
		var tx = db.transaction(store_name, mode);
		return tx.objectStore(store_name);
	}

	function clearObjectStore(store_name) {
		var store = getObjectStore(DB_STORE_NAME, 'readwrite');
		var req = store.clear();
		req.onsuccess = function(evt) {
			displayFiles();
		};
		req.onerror = function(evt) {
			console.error("clearObjectStore:", evt.target.errorCode);
		};
	}

	function getData(callback) {
		var store = getObjectStore(DB_STORE_NAME, 'readonly');
		req = store.get(DATA_KEY);
		req.onsuccess = function(e) {
			if (callback) {
				callback(this.result?this.result.data:{});
			}
		}
		req.onerror = function(e) {
			console.error("error", this.error);
		}
	}
	
	function clearData() {
		var store = getObjectStore(DB_STORE_NAME, 'readwrite');
		var req = store.openCursor();
		req.onsuccess = function(evt) {
			var cursor = evt.target.result;

			if (cursor) {
				if (cursor.key == DATA_KEY) {
					req = cursor["delete"]();
					req.onerror = function() {
						console.error("error", this.error);
					};
				} else {
					cursor["continue"]();
				}
			}
		};
		req.onerror = function() {
			console.error("error", this.error);
		};
	}
	
	var overlay = null;
	function showCover() {
		if (!overlay) {
			overlay = $("<div>").css({
				"position":"absolute",
				"left":"0px", "top":"0px", "bottom":"0px", "right":"0px",
				"background-color": "black", "opacity": 0.3
			}).appendTo(document.body);
		}
		$(document.body).css({"filter": "blur(4px)","-webkit-filter":"blur(4px)"});
		overlay.show();
	}
	function hideCover() {
		$(document.body).css({"filter": "blur(0px)","-webkit-filter":"blur(0px)"});
		overlay.hide();
	}

	function saveData(data) {
		showCover();
		var obj = {
			updated : new Date(),
			data : JSON.parse(JSON.stringify(data)) 
		};
		console.log(obj);
		var store = getObjectStore(DB_STORE_NAME, 'readwrite');
		var req = store.openCursor();
		req.onsuccess = function(evt) {
			var cursor = evt.target.result;

			if (cursor) {
				if (cursor.key == DATA_KEY) {
					req = cursor.update(obj, DATA_KEY);
					req.onerror = function() {
						console.error("error", this.error);
					};
					req.onsuccess = function() {
						console.log("successfully saved");
						hideCover();
					};
				} else {
					cursor["continue"]();
				}
			} else {
				req = store.add(obj, DATA_KEY);
				req.onerror = function() {
					console.error("error", this.error);
				};
				req.onsuccess = function() {
					console.log("successfully saved");
					hideCover();
				};
			}
		};
		req.onerror = function() {
			console.error("error", this.error);
		};
	}
	//openDb();

	return $({}).extend({
		saveData : saveData,
		getData : getData,
		open: openDb,
		clearData : clearData
	});
})();
