var scriptletJqVersion = '2.0.3';
var scriptletTitle = 'Output a table as a delimited string, with columns re-ordered'

function customJqueryFunction() {
	// Custom code goes in this function
	$mostRowsTable = null;
	mostRows = 0;

	$('table').each(function () {
		var $table = $(this);
		var rows = 0;
		if ($table.find('tbody').length) {
			rows = $table.find('tbody > tr').length;
		} else {
			rows = $table.find('tr').length;
		}
		console.log('Table with ' + rows + ' row(s)');
		if (rows > mostRows) {
			$mostRowsTable = $table;
			mostRows = rows;
		}
	});

	console.info('Using table with ' + mostRows + ' rows.');
	var $table = $mostRowsTable;

	var outputCols =
		[
			1,
			0
		];
	var outputColSep = '|';
	var outputRowSep = "\n";

	var output = outputRowSep;
	$table.find('tr').each(function () {
		var $row = $(this);
		var rowOutput = '';
		$.each(outputCols, function (outputIdx, colIdx) {
			if (outputIdx > 0) rowOutput += outputColSep;
			rowOutput +=
				$.trim($row.find('*:nth-child(' + (colIdx + 1) + ')').text());
		});
		output += rowOutput + "\n";
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

	loadScript('//ajax.googleapis.com/ajax/libs/jquery/' + scriptletJqVersion + '/jquery.min.js',
		customJqueryFunction);
})();

// Output "result" for console -- show title
scriptletTitle;
