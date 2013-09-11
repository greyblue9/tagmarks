<?php

// Generates an "about.json" file for your thumbnail set.
// The script generally assumes it is located in the same place as the
// folders for all thumbnail sets.

require_once('../src/include/common.inc');

define('PATH_TO_THUMBSETS', __DIR__);

if (!isset($_POST['thumbset'])) {
	$thumbset_select_options_html = '';
	$items = scandir(PATH_TO_THUMBSETS);
	foreach ($items as $item) {

		if (is_dir($item) && $item != '.' && $item != '..') {
			$thumbset_select_options_html .=
				'<option name="'.$item.'">'.$item.'</option>';
		}
	}
} else {

	// Here we generate the about.json file.
	$data = array();
	$data['site_data'] = array();
	$path = $_POST['path'];
	$set_name = $_POST['thumbset'];

	$items = scandir("$path/$set_name");
	foreach ($items as $item) {
		$filename = "$path/$set_name/$item";

		if (!is_dir($filename) && substr($item, strlen($item)-4, 4) == '.png') {
			// Found PNG image
			$size = getimagesize($filename);
			$width = $size[0];
			$height = $size[1];

			// Convert "CamelCase" to "Camel Case"
			preg_match_all('/((?:^|[A-Z])[a-z]+)/', $item, $regex_matches);
			$words = $regex_matches[0];
			$assumed_site_name = implode(' ', $words);

			$json_entry = array(
				"name" => $assumed_site_name,
				"thumbnail" => $item
			);

			$data['site_data'][] = $json_entry;
		}
	}
	print_r($data);
	exit;
	print(get_indented_json_string($data));
	exit();

}




?>
<form action="about-json-generator.php" method="POST" enctype="application/x-www-form-urlencoded">

	<label for="thumbset">Name of thumbset to generate for?</label>
	<select name="thumbset">
		<option value="" selected="selected">- Select a thumbset -</option>
		<?= $thumbset_select_options_html ?>
	</select>

	<input type="hidden" name="path" value="<?= PATH_TO_THUMBSETS ?>" />

	<button type="submit">Create starter <b>about.json</b></button>

</form>

<style type="text/css">
	body {
		font-family: sans-serif;
		font-size: 16px;
	}
	form {
		margin: 50px;
		border: 1px solid #ccc;
		padding: 20px;
	}
	.warning {
		padding: 30px 100px;
		background: #ffffaa;
	}
</style>
<div class="warning">
	<p>
		NOTE: The generator makes many assumptions when it writes the
		<b>about.json</b> file.	As an example, it assumes that CamelCaseSite.png
		would be a website called "Camel Case Site."
	</p>
	<p>
		For this reason, and others, you should go back over the generated file
		and check for any false assumptions or glitches in the result.
	</p>
</div>