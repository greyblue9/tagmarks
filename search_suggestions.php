<?php



$query = $_GET['q'];

$url = 'http://www.google.com/complete/search?hl=en-US&q='.urlencode($query).'&client=ie8&inputencoding=UTF-8&outputencoding=UTF-8';


$ch = curl_init();
curl_setopt($ch, CURLOPT_HTTPHEADER, array('User-Agent: Mozilla/5.0 (Windows NT 6.3; WOW64; Trident/7.0; rv:11.0) like Gecko'));
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_VERBOSE, 1);
curl_setopt($ch, CURLOPT_HEADER, 1);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
$response = curl_exec($ch);


$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$header = trim(substr($response, 0, $headerSize));
$contentData = substr($response, $headerSize);


$xml = new SimpleXMLElement($contentData);


$idx = 0;

$output = array();

while (isset($xml->Section->Item[$idx])) {
	$item = $xml->Section->Item[$idx];

	$idx++;

	if (isset($item->Url)) continue;
	$text = $item->Text;
	$output[] = (string)$text;


}


print(json_encode($output, JSON_NUMERIC_CHECK));


