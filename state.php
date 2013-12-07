<?php

namespace Tagmarks;

require_once('include/common.inc.php');


Setup::readIniFiles();

define('STATE_FILE', 'state.dat');



function saveState($stateData) {

	$stateDataJson = json_encode($stateData, JSON_NUMERIC_CHECK);

	$bytesWrittenOrFalse = file_put_contents(STATE_FILE, $stateDataJson);
	$saveSucceeded =
		$bytesWrittenOrFalse !== false &&
		$bytesWrittenOrFalse === strlen($stateDataJson);

	return array(
		'server_action' => 'save_state',
		'state' => $stateData,
		'save_file' => STATE_FILE,
		'save_file_realpath' => realpath(STATE_FILE),
		'save_bytes_attempted' => strlen($stateDataJson),
		'save_bytes_written' => intval($bytesWrittenOrFalse),
		'save_failure' => $bytesWrittenOrFalse === false,
		'save_succeeded' => $saveSucceeded,
		'result' => $saveSucceeded
	);

}


function loadState() {

	if (!file_exists(STATE_FILE)) {
		return array(
			'error' => true,
			'errorIdName' => 'NoSavedState',
			'errorText' => 'State file does not exist at expected location',
			'method' => $_SERVER['REQUEST_METHOD'],
			'server_action' => 'load_state',
			'save_file' => STATE_FILE,
			'save_file_realpath' => realpath(STATE_FILE)
		);
	}

	$stateDataJson = file_get_contents(STATE_FILE);
	if ($stateDataJson === false) {
		return array(
			'error' => true,
			'errorText' => 'Attempt to load saved state file failed',
			'method' => $_SERVER['REQUEST_METHOD'],
			'server_action' => 'load_state',
			'save_file' => STATE_FILE,
			'save_file_realpath' => realpath(STATE_FILE)
		);
	}

	$stateData = json_decode($stateDataJson, true); // decode as array structure
	return array(
		'state' => $stateData,
		'last_modified_timestamp' => filemtime(STATE_FILE),
		'last_modified' => gmdate('D, d M Y H:i:s \G\M\T', filemtime(STATE_FILE))
	);
}




$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {

	$postData = json_decode(file_get_contents('php://input'), true);

	if (isset($postData['state'])) {
		$responseArray = saveState($postData['state']);
	} else {
		$responseArray = array(
			'error' => true,
			'errorText' => 'Unsupported post context',
			'postData' => $postData
		);
	}


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


