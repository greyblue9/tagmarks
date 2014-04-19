<?php

namespace Tagmarks;

require_once('include/common.inc');
require_once('include/Tagmarks/common.inc');



$setup = new Setup(
	WEB_ROOT.'/defaults', // defaults dir
	TAGMARKS_PRIVATE_DIR // private data dir
);


$cacheControlValue = CACHE_LEVEL === 'production'?
	'max-age=86400;public':
	'no-cache';

$debugMode = DEBUG_MODE? true: false;

$allowedMimeTypes = [
	'image/jpeg',
	'image/png',
	'image/gif'
];

$uploadInfo = [];


if (isset($_FILES) && isset($_FILES['thumbnail_file_upload'])) {
	$fileInfo = $_FILES['thumbnail_file_upload'];
	$tempFilename = $fileInfo['tmp_name']; // full path to temporary (uploaded) file
	$filesizeBytes = $fileInfo['size'];

	$sizeInfo = getimagesize($tempFilename);
	$mime = image_type_to_mime_type($sizeInfo[2]);
	if (!in_array($mime, $allowedMimeTypes)) {
		unlink($tempFilename);
		header('Location: upload_frame.php?error=unsupported_mime');
		exit;
	}

	if (!file_exists('thumbsets/uploaded')) {
		mkdir('thumbsets/uploaded');
	}

	$ext = image_type_to_extension($sizeInfo[2], true); // include dot
	$newFilename = 'thumbsets/uploaded/'.uniqid('uploaded_thumb_').$ext;
	move_uploaded_file($tempFilename, $newFilename);

	/** @var array|null $error */
	$error = error_get_last();
	if ($error !== null) {
		header('Content-Type: text/html;charset=UTF-8');
		var_dump($error);
		exit();
	}

	$uploadInfo = [
		'upload_uri' => $newFilename,
		'upload_url' => 'http://'.$_SERVER['HTTP_HOST'].'/'.$newFilename,
		'width' => $sizeInfo[0],
		'height' => $sizeInfo[1],
		'mime_type' => $mime,
		'extension' => image_type_to_extension($sizeInfo[2], false),
		'size_bytes' => $filesizeBytes
	];
}

$uploadInfoJson = Json::encode($uploadInfo);


header('Content-Type: text/html;charset=UTF-8');
header("Cache-Control: {$cacheControlValue}");


?><!doctype html>
<html page="upload_frame">
<head>
	<title>Thumbnail Upload Frame</title>
	<style type="text/css">
		html {
			margin: 0;
		}

		body {
			background-color: #777777;
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

		input[type=file] {
			float: left;
			width: 75%;
			padding: 0;
		}

		button[type=submit] {
			float: right;
			width: 25%;
			padding: 0;
		}

		div.clear {
			clear: both;
		}
	</style>
</head>
<body>


<form
	action="upload_frame.php"
	method="POST"
	enctype="multipart/form-data"
	autocomplete="off">

	<input type="file" name="thumbnail_file_upload">
	<button type="submit">Upload</button>

	<div class="clear"></div>

</form>


<input type="hidden"
       id="upload_info"
       value="<?= htmlentities($uploadInfoJson); ?>" />


<script type="text/javascript" src="/res/jquery-2.0.3.js"></script>
<script type="text/javascript" src="/res/jquery-ui-1.10.3.custom.js"></script>
<script type="text/javascript" src="/res/tagmarks-utils.js"></script>
<script type="text/javascript" src="/res/tagmarks.js"></script>
<script type="text/javascript" src="/res/tagmarks-upload-frame.js"></script>

</body>
</html>
