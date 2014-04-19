<?php

namespace Tagmarks;

require_once('include/common.inc');
require_once('include/Tagmarks/common.inc');



$setup = new Setup(
	WEB_ROOT.'/defaults', // defaults dir
	TAGMARKS_PRIVATE_DIR // private data dir
);
$dataSource = new DataSource(
	TAGMARKS_PRIVATE_DIR.'/data.json'
);


$method = $_SERVER['REQUEST_METHOD'];
switch ($method) {

	case 'GET':
		$secureVars = $setup->getSecureVars();
		$mainData = $dataSource->getMainData($secureVars);
		$tldData = $setup->getTldData();

		$responseArray = [
			'data' => $mainData,
			'tlds' => $tldData
		];
		break;


	case 'POST':
		$postBody = file_get_contents('php://input');
		$postData = Json::decode($postBody, true);

		if (isset($postData['sites'])) {
			$saveResult = $dataSource->saveSites($postData['sites']);
			$responseArray = $saveResult;
		} else {
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





