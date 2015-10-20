var i18n = (function(){
	
	var lang = "en-US"; //default
	
	var supported = {
			"ja": "ja-JP",
			"ja-JP": "ja-JP",
			"en": "en-US",
			"en-US": "en-US"
	};
	
	var loaded = {};
	
	function getText(id) {
		loadText(lang);
		var data = loaded[lang];
		
		if (data && data[id]) {
			return data[id];
		}
		return "__"+id+"__";
	}
	
	function loadText(lang) {
		if (!loaded[lang]) {
			$.ajax({
				url: "./i18n/"+lang+".json",
				async: false,
				dataType: "json",
				success: function(data) {
					loaded[lang] = data
				}			
			})
		}
	}
	
	function setLanguage(_lang) {
		console.log("set language "+_lang);
		if (supported[_lang]) {
			lang = supported[_lang];
		} 
	}
	function replaceAlli18nTextInDOM() {
		
		function traverse(el, replace) {
			if (el.nodeType == 3) {
				el.nodeValue = replace(el.nodeValue);				
			} 
			if (el.nodeType == 1) {
				for(var i = 0; i < el.childNodes.length; i++) {
					traverse(el.childNodes[i], replace);
				}
			}
		}
		traverse(document.body, function(text) {
			var tmp = text;
			while (tmp.match(/(\$\(([^\)]+)\))/) || tmp.match(/(\$\[([^\]]+)\])/)) {
				var a = RegExp.$1;
				var b = RegExp.$2;
				//console.log([a,b,getText(b)]);
				tmp = tmp.replace(a, getText(b));
			}
			return tmp;
		});
	}
	
	return {
		t: getText,
		setLanguage: setLanguage,
		scan: replaceAlli18nTextInDOM,
		loaded: loaded
	};
	
})();

$(document).ready(function() {
	var language = window.navigator.userLanguage || window.navigator.language;
	if (window.localStorage) {
		if (window.localStorage["LANGUAGE"]) {
			language = window.localStorage["LANGUAGE"];
		}
	}
	i18n.setLanguage(language);
	i18n.scan();
	$(document.body).show();
});

