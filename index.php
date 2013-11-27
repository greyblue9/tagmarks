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
			<div class="button add_icon action_add_site">
				Add Site
			</div>
		</div>
	</div>


	<div id="add_site_dialog">
		<div class="titlebar">
			Add Site
		</div>
		<div class="padding">
			<table>
				<tr>
					<td>Site URL</td>
					<td>
						<input type="text" value="http://www.example.com/" />
					</td>
				</tr>
				<tr>
					<td>Site Name</td>
					<td>
						<input type="text" value="Example Site"/>
					</td>
				</tr>
				<tr>
					<td>Thumbnail URL</td>
					<td>
						<input type="text" value="/thumbsets/default/ExampleSite.png" />
					</td>
				</tr>
				<tr>
					<td>Site Tags</td>
					<td>
						<span class="tag">
							<input type="checkbox" />
							Daily
						</span>
						<span class="tag">
							<input type="checkbox"/>
							Daily
						</span>
					</td>
				</tr>
			</table>
		</div>
	</div>



	<script type="text/javascript" src="res/jquery-2.0.3.min.js"></script>
	<script type="text/javascript" src="res/jquery-ui-1.10.3.custom.min.js"></script>
	<script type="text/javascript" src="res/tagmarks-utils.js"></script>
	<script type="text/javascript" src="res/tagmarks.js"></script>


</body>
</html>
