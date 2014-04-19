<?php

namespace Tagmarks;

require_once('include/common.inc');
require_once('include/Tagmarks/common.inc');







$dataSource = new DataSource(
	TAGMARKS_PRIVATE_DIR.'/data.json',
	TAGMARKS_PRIVATE_DIR.'/state.dat'
);

$method = $_SERVER['REQUEST_METHOD'];
switch ($method) {

	case 'GET':
		$responseArray = $dataSource->getState();
		break;


	case 'POST':
		$postBody = file_get_contents('php://input');
		$postData = Json::decode($postBody);

		if (isset($postData['state'])) {
			$saveResult = $dataSource->saveState($postData['state']);
			$responseArray = $saveResult;
		}
		else {
			$responseArray = [
				'error' => true,
				'errorText' => 'Unsupported post context',
				'postData' => $postData
			];
		}
		break;


	default:
		// Unsupported HTTP request method
		$responseArray = [
			'error' => true,
			'errorCode' => 9,
			'errorText' => 'Unsupported request method',
			'requestMethod' => $method
		];
}



header('Content-Type: application/json;charset=UTF-8');

$outputJson = Json::encode($responseArray);
print($outputJson);
exit();


