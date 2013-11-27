<?php


$imageUrl = $_GET['image_url'];


$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $imageUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_VERBOSE, 1);
curl_setopt($ch, CURLOPT_HEADER, 1);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
$response = curl_exec($ch);

$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$headerLines = array_filter(explode("\r\n", substr($response, 0, $headerSize)), function($headerLine) {
	return trim($headerLine) != '';
});

$headerArray = array();
array_walk($headerLines, function($lineIdx, $headerLine) {
	if (strpos($headerLine, ':') === false) {
		$headerArray['Response-Line'] = $headerLine;
	} else {
		$components = explode(':', $headerLine);
		$headerArray[trim($components[0])] = trim($components[1]);
	}
});


$imageBody = substr($response, $headerSize);


var_dump($headerLines);
var_dump($headerArray);
var_dump($imageBody);



