<?php

require('include/common.inc.php');
use Tagmarks\Setup as Setup;
use Tagmarks\Errors as Errors;
use Tagmarks\Json as Json;
use Tagmarks\Common as Common;

Setup::readIniFiles();


// load datafile
if (!file_exists(MAIN_DATA_FILEPATH)) {
	Errors::exitWithFatalError(
		'Expecting '.MAIN_DATA_FILEPATH.' relative to script directory.');
}

$main_data_file_contents = file_get_contents(MAIN_DATA_FILEPATH);
$main_data = Json::decodeOrOutputError($main_data_file_contents, 'json');


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



$secure_vars = Setup::getSecureVars(SECURE_DATA_SCRIPT_FILENAME);

if ($secure_vars) {
	// The variable $data_with_secvars will contain any secure data in plaintext
	$data_with_secvars = Common::getDeepVariableCopy($main_data);
	Setup::replaceSecureVars($data_with_secvars, $secure_vars);
} else {
	$data_with_secvars = $main_data;
}



header('Content-Type: application/json; charset=utf-8');

$output = JSON_INDENTED_OUTPUT?
	get_indented_json_string(json_encode($data_with_secvars, JSON_NUMERIC_CHECK)):
	json_encode($data_with_secvars, JSON_NUMERIC_CHECK);

print($output);


