<?php

require('include/common.inc.php');
use Tagmarks\Setup as Setup;
use Tagmarks\Errors as Errors;
use Tagmarks\Json as Json;
use Tagmarks\Common as Common;


// FirePHP library for FirePHP Firebug extension
require('include/firephp/fb.php');



Setup::readIniFiles();


// load datafile
if (!file_exists(MAIN_DATA_FILEPATH)) {
	Errors::exitWithFatalError(
		'Expecting '.MAIN_DATA_FILEPATH.' relative to script directory.');
}

$main_data_file_contents = file_get_contents(MAIN_DATA_FILEPATH);
$main_data = Json::decodeOrOutputError($main_data_file_contents, 'json');


$sites = &$main_data['sites'];
$sitesChanged = false;
foreach ($sites as &$site) {
	if (!isset($site['id'])) {
		$site['id'] = mt_rand(10000000, 99999999);
		$sitesChanged = true;
	}
}
if ($sitesChanged) {
	file_put_contents(MAIN_DATA_FILEPATH, Json::formatJson(json_encode($main_data, JSON_NUMERIC_CHECK)));
}


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
	Json::formatJson(json_encode($data_with_secvars, JSON_NUMERIC_CHECK)):
	json_encode($data_with_secvars, JSON_NUMERIC_CHECK);

print($output);


