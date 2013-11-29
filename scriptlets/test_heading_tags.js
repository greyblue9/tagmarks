
var scriptletJqVersion = '2.0.3';
var scriptletTitle = 'Simple outline of header tags indented by tag level/importance'

function customJqueryFunction() {
	// Custom code goes in this function
	var output = '';
	$(':header').each(function () {
		var $header = $(this);
		var tagName = $header[0].tagName;
		var headingLevel = tagName[1];
		var indentStr = '';
		for (var i = 1; i < headingLevel; i++) {
			indentStr += "\t";
		}
		output += indentStr + $.trim($header.text());
		output += "\n";
	});
	console.log(output);
}

// This block loads jQuery
(function () {
	function loadScript(url, callback) {
		var script = document.createElement("script")
		script.type = "text/javascript";
		script.onload = function () {
			callback();
		};
		script.src = url;
		document.getElementsByTagName("head")[0].appendChild(script);
	}
	loadScript('//ajax.googleapis.com/ajax/libs/jquery/'+scriptletJqVersion+
		'/jquery.min.js', customJqueryFunction);
})();

// Output "result" for console -- show title
scriptletTitle;

