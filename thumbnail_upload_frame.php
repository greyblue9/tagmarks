<?php
/*
$_FILES = array(
    [thumbnail_file_upload] => Array
        (
            [name] => 172_553830547043_6132_n.jpg
            [type] => image/jpeg
            [tmp_name] => C:\wamp\tmp\phpB7D8.tmp
            [error] => 0
            [size] => 40550
        )

)
 */
	if (isset($_FILES) && isset($_FILES['thumbnail_file_upload'])) {
		$fileInfo = $_FILES['thumbnail_file_upload'];
		$tempFilename = $fileInfo['tmp_name']; // full path to temporary (uploaded) file

		$sizeInfo = getimagesize($tempFilename);
		$mime = image_type_to_mime_type($sizeInfo[2]);
		if (!in_array($mime, array('image/jpeg', 'image/png', 'image/gif'))) {
			unlink($tempFilename);
			header('Location: thumbnail_upload_frame.php?error=unsupported_mime');
			exit;
		}

		if (!file_exists('thumbsets/uploaded')) {
			mkdir('thumbsets/uploaded');
		}

		$ext = image_type_to_extension($sizeInfo[2], true); // include dot
		$newFilename = 'thumbsets/uploaded/'.uniqid('uploaded_thumb_').$ext;
		$result = move_uploaded_file($tempFilename, $newFilename);

		header('Location: thumbnail_upload_frame.php?upload_uri='.urlencode($newFilename));
		exit;
	}


?><!doctype html>
<html>
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
			background: #743;
			height: 100%;
		}
	</style>
</head>
<body>


<form autocomplete="off" enctype="multipart/form-data" method="POST" action="thumbnail_upload_frame.php">

	<input type="file" name="thumbnail_file_upload" style="width: 75%; float: left; padding: 0px;">

	<button style="width: 25%; float: right; padding: 0px;" type="submit">
		Upload
	</button>

	<div style="clear: both"></div>

</form>

<script type="text/javascript" src="res/jquery-2.0.3.min.js"></script>
<script type="text/javascript" src="res/tagmarks-upload-frame.js"></script>

</body>
</html>
