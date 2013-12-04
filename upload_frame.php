<?php

namespace Tagmarks;

require_once('include/common.inc.php');

header('Content-Type: text/html; charset=utf-8');



Setup::readIniFiles();

$debugMode = DEBUG_MODE? true: false;


$uploadInfo = array();


if (isset($_FILES) && isset($_FILES['thumbnail_file_upload'])) {
	$fileInfo = $_FILES['thumbnail_file_upload'];
	$tempFilename = $fileInfo['tmp_name']; // full path to temporary (uploaded) file
	$filesizeBytes = $fileInfo['size'];

	$sizeInfo = getimagesize($tempFilename);
	$mime = image_type_to_mime_type($sizeInfo[2]);
	if (!in_array($mime, array('image/jpeg', 'image/png', 'image/gif'))) {
		unlink($tempFilename);
		header('Location: upload_frame.php?error=unsupported_mime');
		exit;
	}

	if (!file_exists('thumbsets/uploaded')) {
		mkdir('thumbsets/uploaded');
	}

	$ext = image_type_to_extension($sizeInfo[2], true); // include dot
	$newFilename = 'thumbsets/uploaded/'.uniqid('uploaded_thumb_').$ext;
	$result = move_uploaded_file($tempFilename, $newFilename);

	$uploadInfo = array(
		'upload_uri' => $newFilename,
		'upload_url' => 'http://'.$_SERVER['HTTP_HOST'].'/'.$newFilename,
		'width' => $sizeInfo[0],
		'height' => $sizeInfo[1],
		'mime_type' => $mime,
		'extension' => image_type_to_extension($sizeInfo[2], false),
		'size_bytes' => $filesizeBytes
	);
}


?><!doctype html>
<html page="upload_frame">
<head>
	<title>Thumbnail Upload Frame</title>
	<style type="text/css">
		html {
			margin: 0;
		}
		body {
			background: none repeat scroll 0 0 #777777;
			color: #FFFFFF;
			font-family: sans-serif;
			font-size: 12px;
			margin: 0;
			overflow: hidden;
			position: relative;
		}

		form {
			display: block;
			background: #414965;
			height: 100%;
		}
	</style>
</head>
<body>


<form autocomplete="off" enctype="multipart/form-data" method="POST" action="upload_frame.php">

	<input type="file" name="thumbnail_file_upload" style="width: 75%; float: left; padding: 0px;">

	<button style="width: 25%; float: right; padding: 0px;" type="submit">
		Upload
	</button>

	<div style="clear: both"></div>

</form>

<input type="hidden" id="upload_info" value="<?= htmlentities(json_encode($uploadInfo, JSON_NUMERIC_CHECK)) ?>" />

<? /* TODO: insert required js for upload frame */ ?>

</body>
</html>
