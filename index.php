<?php

define('MAIN_DATA_FILENAME', 'data.json');
define('SECURE_DATA_SCRIPT_FILENAME', 'secure_vars.php');

require('common.inc.php');

// load datafile
if (!file_exists(MAIN_DATA_FILENAME)) {
	exit_with_fatal_error("Expecting '${MAIN_DATA_FILENAME}' in script directory.");
}

$secure_vars = load_secure_vars(SECURE_DATA_SCRIPT_FILENAME);
$main_data_file_contents = file_get_contents(MAIN_DATA_FILENAME);
$main_data = decode_json_with_error_output($main_data_file_contents);

// The variable $all_data will contain any secure data in plaintext
$data_with_secvars = get_copy_of($main_data);
replace_secure_vars($data_with_secvars, $secure_vars);

// This is for debugging the JSON parsing and secure variable parsing/replacement
if (isset($_GET['show_parsed_json'])) {
	header('Content-type: application/json');
	$data_to_output = $main_data;
	if (isset($_GET['secvars']) && $_GET['secvars'] == "true") {
		$data_to_output = $data_with_secvars;
	}
	print(get_indented_json_string(json_encode($data_to_output)));
	exit;
}

// From now on, we are referring to the main data array with replaced secure variables.
$data = $data_with_secvars;


$tags = get_copy_of($data['tags']);
function tag_sorter($a, $b) {
	$pria = PHP_INT_MAX;
	$prib = PHP_INT_MAX;
	if (isset($a['priority'])) $pria = intval($a['priority']);
	if (isset($b['priority'])) $prib = intval($b['priority']);
	if ($pria != $prib) {
		return $pria - $prib;
	} else {
		return strcmp(strtoupper($a['name']), strtoupper($b['name']));
	}
}
usort($tags, 'tag_sorter'); // sorts tags by priority, then by name
foreach ($tags as $tag_info) {

	$tag_name = $tag_info['name'];
	$tag_description = isset($tag_info['description'])? $tag_info['description']: '';
	$tag_priority = isset($tag_info['priority'])? $tag_info['priority']: 0;

	$tags_nav_html .= '<div class="tag">'.$tag_name.'</div>';

}



// Build the final HTML
$doctype_html = '<!DOCTYPE html>';

$header_html = '
<head>
	<title>TagMarks</title>
	<link rel="shortcut icon" href="favicon.ico" />
	<link rel="stylesheet" href="main.css" />
</head>';

$body_html = '
<body>
	<div class="non-scroll">
		<nav class="tags">
			'.$tags_nav_html.'
		</nav>
	</div>
	<script type="text/javascript" src="advanced.js"></script>
</body>';

print($doctype_html);
print($header_html);
print($body_html);