<?php

$inidata = parse_ini_file('tagmarks.ini');

define('MAIN_DATA_FILEPATH', $inidata['main_data_relative_path'].'/'.$inidata['main_data_filename']);
define('MAIN_DATA_FILENAME', $inidata['main_data_filename']);
define('SECURE_DATA_SCRIPT_FILEPATH', $inidata['secure_vars_filename']);
define('SECURE_DATA_SCRIPT_FILENAME', $inidata['secure_vars_relative_path'].'/'.$inidata['secure_vars_filename']);

require('src/include/common.inc');


// load datafile
if (!file_exists(MAIN_DATA_FILEPATH)) {
	exit_with_fatal_error("Expecting '${MAIN_DATA_FILEPATH}' relative to script directory.");
}

$main_data_file_contents = file_get_contents(MAIN_DATA_FILEPATH);
$main_data = decode_json_with_error_output($main_data_file_contents);

// sort the tags by priority
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
usort($main_data['tags'], 'tag_sorter'); // sorts tags by priority, then by name

// output as JSON here if requested
if (isset($_GET['raw']) && $_GET['raw'] == 1) {
	// Used by Javascript to get the main data
	header('Content-type: application/json');
	print(json_encode($main_data));
	exit();
}






// stop temporarily before decoding secvars
exit();


$secure_vars = load_secure_vars(SECURE_DATA_SCRIPT_FILEPATH);
// The variable $data_with_secvars will contain any secure data in plaintext
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



