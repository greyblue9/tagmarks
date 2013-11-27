<?php

require_once('include/common.inc.php');

header('Content-Type: text/html; charset=utf-8');

?><!DOCTYPE html>
<html>
<head>
	<title>TagMarks</title>
	<link rel="shortcut icon" href="res/img/favicon.ico" />
	<link rel="stylesheet" href="res/tagmarks.css" />
</head>

<body>
	<div id="center">

		&nbsp;

	</div>
	<div id="left_bg">&nbsp;</div>
	<div id="left">

		<div style="height: 20px; overflow: hidden;">&nbsp;</div>

		<div id="tag_nav_area"></div>


		<div id="controls_area">



			<div class="button add_icon">
				Add Site
			</div>

		</div>

	</div>



	<script type="text/javascript" src="res/jquery-2.0.3.min.js"></script>
	<script type="text/javascript" src="res/jquery-ui-1.10.3.custom.min.js"></script>
	<script type="text/javascript" src="res/tagmarks-utils.js"></script>
	<script type="text/javascript" src="res/tagmarks.js"></script>


</body>
</html>
