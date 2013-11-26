<?php

require_once('include/common.inc.php');
use Tagmarks\Json as Json;
use Tagmarks\Setup as Setup;

Setup::readIniFiles();


define('SAVE_FILE', 'state.dat');



function saveState($post) {

	$expectedPostFields = array(
		'selTagIdNamesCSV'
	);

	$missingFields = array();
	foreach ($expectedPostFields as $postFieldName) {
		if (!isset($post[$postFieldName])) {
			$missingFields[] = $postFieldName;
		}
	}

	if (count($missingFields)) {
		return array(
			'error' => true,
			'errorText' => 'Missing required POST field(s)',
			'missingFields' => $missingFields
		);
	}



	$selTagIdNamesCSV = $post['selTagIdNamesCSV'];
	$selTagIdNames = explode(',', $selTagIdNamesCSV);

	$serializableStateData = array(
		'selected_tags' => $selTagIdNames
	);
	$jsonEncodedStateData = json_encode($serializableStateData, JSON_NUMERIC_CHECK);


	$bytesWrittenOrFalse = file_put_contents(SAVE_FILE, $jsonEncodedStateData.LF);
	$saveSucceeded =
		$bytesWrittenOrFalse !== false &&
		$bytesWrittenOrFalse === strlen($jsonEncodedStateData);

	return array(
		'method' => $_SERVER['REQUEST_METHOD'],
		'server_action' => 'save_state',
		'state' => $serializableStateData,
		'save_file' => SAVE_FILE,
		'save_file_realpath' => realpath(SAVE_FILE),
		'save_bytes_attempted' => strlen($jsonEncodedStateData),
		'save_bytes_written' => intval($bytesWrittenOrFalse),
		'save_failure' => $bytesWrittenOrFalse === false,
		'save_succeeded' => $saveSucceeded,
		'result' => $saveSucceeded
	);

}


function loadState() {

	if (!file_exists(SAVE_FILE)) {
		return array(
			'error' => true,
			'errorText' => 'Saved state file does not exist',
			'method' => $_SERVER['REQUEST_METHOD'],
			'server_action' => 'load_state',
			'save_file' => SAVE_FILE,
			'save_file_realpath' => realpath(SAVE_FILE)
		);
	}

	$jsonEncodedStateData = file_get_contents(SAVE_FILE);

	if ($jsonEncodedStateData === false) {
		return array(
			'error' => true,
			'errorText' => 'Attempt to load saved state file failed',
			'method' => $_SERVER['REQUEST_METHOD'],
			'server_action' => 'load_state',
			'save_file' => SAVE_FILE,
			'save_file_realpath' => realpath(SAVE_FILE)
		);
	}

	$stateData = json_decode($jsonEncodedStateData, true); // decode as array structure

	return array(
		'state' => $stateData,
		'last_modified_timestamp' => filemtime(SAVE_FILE),
		'last_modified' => gmdate('D, d M Y H:i:s \G\M\T', filemtime(SAVE_FILE))
	);
}


$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {

	$responseArray = saveState($_POST);

} else if ($method == 'GET') {

	$responseArray = loadState();

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

$jsonEncodeStr = json_encode($responseArray, JSON_NUMERIC_CHECK);

$output = JSON_INDENTED_OUTPUT?
	Json::formatJson($jsonEncodeStr):
	$jsonEncodeStr;

print($output);


