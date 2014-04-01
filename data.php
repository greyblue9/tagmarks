<?php

namespace Tagmarks;

require('include/common.inc.php');


Setup::readIniFiles();



function saveSites($sites)
{
	$mainDataJson = file_get_contents(MAIN_DATA_FILEPATH);
	$mainData = Json::decodeOrOutputError($mainDataJson, 'json');

	$mainData['sites'] = $sites;
	$mainDataJson = json_encode($mainData, JSON_NUMERIC_CHECK | JSON_UNESCAPED_SLASHES);

	$bytesWrittenOrFalse = file_put_contents(MAIN_DATA_FILEPATH, Json::formatJson($mainDataJson));
	$saveSucceeded =
		$bytesWrittenOrFalse !== false &&
		$bytesWrittenOrFalse === strlen($mainDataJson);

	return array(
		'server_action' => 'save_sites',
		'site_count' => count($sites),
		'save_file' => MAIN_DATA_FILEPATH,
		'save_file_realpath' => realpath(MAIN_DATA_FILEPATH),
		'save_bytes_attempted' => strlen($mainDataJson),
		'save_bytes_written' => intval($bytesWrittenOrFalse),
		'save_failure' => $bytesWrittenOrFalse === false,
		'save_succeeded' => $saveSucceeded,
		'result' => $saveSucceeded
	);

}

$method = $_SERVER['REQUEST_METHOD'];
$responseArray = array();

if ($method == 'POST') {
	$postData = json_decode(file_get_contents('php://input'), true);

	if (isset($postData['sites'])) {
		$responseArray = saveSites($postData['sites']);
	} else {
		$responseArray = array(
			'error' => true,
			'errorText' => 'Unsupported post context',
			'postData' => $postData
		);
	}

} else if ($method == 'GET') {

	// load datafile
	if (!file_exists(MAIN_DATA_FILEPATH)) {
		Errors::exitWithFatalError(
			'Expecting '.MAIN_DATA_FILEPATH.' relative to script directory.');
	}

	$main_data_file_contents = file_get_contents(MAIN_DATA_FILEPATH);
	$main_data = Json::decodeOrOutputError($main_data_file_contents, 'json');


	$sites = & $main_data['sites'];
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
		$responseArray = Common::getDeepVariableCopy($main_data);
		Setup::replaceSecureVars($responseArray, $secure_vars);
	}
	else {
		$responseArray = $main_data;
	}


} else {
	// Unsupported HTTP request method
	$responseArray = array(
		'error' => true,
		'errorCode' => 9,
		'errorText' => 'Unsupported request method',
		'requestMethod' => $method
	);
}




header('Content-Type: application/json; charset=utf-8');

$jsonEncodeStr = json_encode($responseArray, JSON_NUMERIC_CHECK | JSON_UNESCAPED_SLASHES);

$output = JSON_INDENTED_OUTPUT?
	Json::formatJson($jsonEncodeStr):
	$jsonEncodeStr;

print($output);



