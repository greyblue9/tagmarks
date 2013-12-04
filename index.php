<?php

namespace Tagmarks;

require_once('include/common.inc.php');

header('Content-Type: text/html; charset=utf-8');



Setup::readIniFiles();

$debugMode = DEBUG_MODE? true: false;


?><!DOCTYPE html>
<html page="index">
<head>
	<title>TagMarks</title>
	<link rel="shortcut icon" href="res/images/favicon.ico" />
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
			<div class="button add_icon add_site">
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
						<input type="text" class="site_url" value="" />
					</td>
				</tr>
				<tr>
					<td>Site Name</td>
					<td>
						<input type="text" class="site_name" value=""/>
					</td>
				</tr>
				<tr>
					<td>Thumbnail (from URL):</td>
					<td>
						<input type="text" class="thumbnail_url" value="" />
					</td>
				</tr>
				<tr>
					<td>Thumbnail (upload):</td>
					<td>
						<iframe src="upload_frame.php"></iframe>
					</td>
				</tr>
				<tr>
					<td>Chosen thumbnail</td>
					<td id="current_thumbnail_container">
						&nbsp;
					</td>
				</tr>
				<tr>
					<td>Site Tags</td>
					<td class="tags_container"></td>
				</tr>
				<tr>
					<td>&nbsp;</td>
					<td>
						<div class="button save">
							Save
						</div>
						<div class="button cancel">
							Cancel
						</div>
					</td>
				</tr>
			</table>
		</div>
	</div>



	<!--
	<script type="text/javascript" data-main="res/main.js" src="res/require.js"></script>
	<script type="text/javascript" src="res/jquery-2.0.3.min.js"></script>
	<script type="text/javascript" src="res/jquery-ui-1.10.3.custom.min.js"></script>

	<script type="text/javascript"
	        src="<?= Common::getFilenameWithModifiedTime('res/tagmarks-utils.js') ?>"></script>
	<script type="text/javascript"
	        src="<?= Common::getFilenameWithModifiedTime('res/tagmarks.js') ?>"></script>
	-->

	<!--
	<script type="text/javascript" src="min/g=tagmarks-all.js"></script>
	-->


	<script type="text/javascript" data-main="js/main.js" src="js/lib/require.js"></script>


	<script type="text/x-tmpl" id="tmpl-site">
		<div class="templated_site">
			<h1>{%=o.name%}</h1>
			<div>Site URL: <a href="{%=o.url%}">{%=o.url%}</a></div>
			<div>Thumbnail: <img src="{%=o.thumbnail%}" /></div>
		</div>
	</script>

</body>
</html>
