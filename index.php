<?php

header('Content-Type: text/html; charset=utf-8');



?><!DOCTYPE html>
<html page="index">
<head>
	<title>TagMarks</title>
	<link rel="shortcut icon" href="res/img/favicon.ico" />
	<link rel="stylesheet" href="res/tagmarks.css" />
</head>

<body>

	<div id="center">

		&nbsp;

	</div>


	<div id="left">
		<div style="height: 20px; overflow: hidden;">&nbsp;</div>

		<div id="tag_nav_area"></div>

		<div id="controls_area">
			<div class="button add_icon add_site">
				Add Site
			</div>
		</div>
	</div>

	<div id="web_search_bar">
		<form id="web_search_form" autocomplete="off" method="get" action="https://duckduckgo.com/">
			<div class="logo_and_search_container">
				<a class="search_engine_logo" href="https://www.google.com/"
			        alt="Google Search" title="Google Search">&nbsp;</a>

				<span class="suggestions_pixel">
				    <div id="web_search_suggestions">
					    <div>hello</div>
					    <div>world</div>
				    </div>
				</span>

				<input type="text" tabindex="0" value="" name="q" />

				<span class="search_engine_logo_rigtside_balancer">&nbsp;</span>
			</div>

			<!--<input type="hidden" name="ie" value="utf-8" />
			<input type="hidden" name="oe" value="utf-8" />

			<input type="hidden" name="aq" value="t" />
			<input type="hidden" name="rls" value="1.0-alpha" />
			<input type="hidden" name="client" value="tagmarks-web-search" />

			<input type="hidden" name="num" value="10" />-->
		</form>
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
					<td id="upload_frame_container">&nbsp;</td>
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


	<script type="text/javascript" src="res/jquery-2.0.3.js"></script>
	<script type="text/javascript" src="res/jquery-ui-1.10.3.custom.js"></script>

	<script type="text/javascript" src="res/tagmarks-utils.js"></script>
	<script type="text/javascript" src="res/tagmarks.js"></script>


</body>
</html>
