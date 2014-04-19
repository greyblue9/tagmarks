<?php

namespace Tagmarks;

require_once('include/common.inc');
require_once('include/Tagmarks/common.inc');

// TODO: Support DuckDuckGo suggestions API

$query = $_GET['q'];

$client = 'ie8'; // using now for compatibility; doesn't work with custom value
$url = 'http://www.google.com/complete/search'.
	'?hl=en-US'.
	'&q='.urlencode($query).
	'&client='.$client.
	'&inputencoding=UTF-8'.
	'&outputencoding=UTF-8';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_VERBOSE, 1);
curl_setopt($ch, CURLOPT_HEADER, 1);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
$response = curl_exec($ch);


$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$header = trim(substr($response, 0, $headerSize));
$contentData = substr($response, $headerSize);


$xml = new \SimpleXMLElement($contentData);


$idx = 0;

$output = [];

// FIXME: Remove magic method use
while (isset($xml->Section->Item[$idx])) {
	$item = $xml->Section->Item[$idx];

	$idx++;

	if (isset($item->Url)) {
		continue;
	}
	$text = $item->Text;
	$output[] = (string)$text;
}



header('Content-Type: application/json;charset=UTF-8');

$outputJson = Json::encode($output);
print($outputJson);
exit();
