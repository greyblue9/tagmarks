<?php

namespace Tagmarks;

require_once('include/common.inc.php');


$imageUrl = $_GET['image_url'];


$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $imageUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_VERBOSE, 1);
curl_setopt($ch, CURLOPT_HEADER, 1);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
$response = curl_exec($ch);


$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$headerLines = explode("\r\n", trim(substr($response, 0, $headerSize)));


/** @var $headers array Associative array of header field names to values
 * Note: The HTTP status line (e.g. "HTTP/1.1 200 OK") is included under the
 * 'Status-Line' array key. Blank lines (like the \r\n\r\n that separates the
 * header section from the body section) are not included in the array.
*/
$headers = array();

foreach ($headerLines as $line) {
	if (strpos($line, 'HTTP/') === 0) {
		$headers['Status-Line'] = $line;
	} else {
		$components = explode(':', $line);
		$headers[trim($components[0])] = trim($components[1]);
	}
}

$contentType = isset($headers['Content-Type'])?
	$headers['Content-Type']:
	'application/octet-stream';
$contentSizeBytes = isset($headers['Content-Length'])?
	$headers['Content-Length']: null;
$contentSizeKBytes = $contentSizeBytes? $contentSizeBytes / 1024: null;


$contentData = substr($response, $headerSize);

$imageSizeExtraInfo = array();
$imageSize = getimagesizefromstring($contentData, $imageSizeExtraInfo);
$iptc = array();
if (isset($imageSizeExtraInfo['APP13'])) {
	$iptc = iptcparse($imageSizeExtraInfo['APP13']);
	$iptcHeaderArray = array
	(
		'1#090' => 'Envelope.CharacterSet',
		'2#005' => 'ObjectName',
		'2#015' => 'Category',
		'2#020' => 'Supplementals',
		'2#025' => 'Keywords',
		'2#040' => 'SpecialsInstructions',
		'2#055' => 'DateCreated',
		'2#060' => 'TimeCreated',
		'2#062' => 'DigitalCreationDate',
		'2#063' => 'DigitalCreationTime',
		'2#080' => 'ByLine',
		'2#085' => 'ByLineTitle',
		'2#090' => 'City',
		'2#092' => 'Sublocation',
		'2#095' => 'ProvinceState',
		'2#100' => 'CountryCode',
		'2#101' => 'CountryName',
		'2#103' => 'OriginalTransmissionReference',
		'2#105' => 'Headline',
		'2#110' => 'Credits',
		'2#115' => 'Source',
		'2#116' => 'Copyright',
		'2#118' => 'Contact',
		'2#120' => 'Caption',
		'2#122' => 'CaptionWriter'
	);
	foreach ($iptc as $origKey => $value) {
		if (isset($iptcHeaderArray[$origKey])) {
			$iptc[$iptcHeaderArray[$origKey]] = $value[0];
		} else {
			$iptc[$origKey] = $value[0];
		}
		unset($iptc[$origKey]);
	}

}

$imagetypeConst = $imageSize[2];
$mimeType = image_type_to_mime_type($imagetypeConst);
$extension = image_type_to_extension($imagetypeConst);

$tempfile = file_put_contents('testimage', $contentData);
$exifData = @exif_read_data('testimage', 'ANY_TAG', true);


$outputArray = array(
	'url' => $imageUrl,
	'headers' => $headers,
	'http_status_line' => $headers['Status-Line'],
	'content_type' => $contentType,
	'size_bytes' => $contentSizeBytes,
	'size_kbytes' => $contentSizeKBytes,
	'size_string' => Common::formatSizeUnits($contentSizeBytes),
	'dimensions' => array(
		'width' => $imageSize[0],
		'height' => $imageSize[1],
		'mime_type' => $imageSize['mime'],
		'channels' => isset($imageSize['channels'])? $imageSize['channels']: null,
		'bits_per_color' => $imageSize['bits'],
		'imagetype' => array(
			'constant' => $imagetypeConst,
			'mime_type' => $mimeType,
			'extension' => $extension
		)
	),
	'iptc' => count($iptc)? $iptc: null,
	'exif' => $exifData? $exifData: null
);

header('Content-Type: application/json');
print(Json::formatJson(json_encode($outputArray, JSON_NUMERIC_CHECK)));


/*
print('<img src="data:'.$contentType.';base64,'.base64_encode($contentData).'" />');*/



