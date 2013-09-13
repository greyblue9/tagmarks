<?php

// Generates an "thumbset.json" file for your thumbnail set.
// The script generally assumes it is located in the same place as the
// folders for all thumbnail sets.

// This script also is set up to call Google's Custom Search API to query
// the names of websites based on thumbnail filenames and hopefully get back
// a URL as one of the results that it can include on the JSON as the site URL.
// Unfortunately, at the moment, Google's free tier only allows 100 queries/day
// which I immediately exhausted of course just in testing. I'm including my
// API key and context here so that if there's low interest (which I'm sure
// there will be) you will be able to glean some advantage from my daily free
// Google Custom Search calls and all the coding effort I put into that
// part (kind of disappointing). Any alternative service ideas?

// NOTE: The URL search query limit is initially set quite low. But I certainly
// say raise it to 100 if you are actually reading and will benefit from this
// script (it was mostly written for my own benefit).


require_once('../src/include/common.inc');

define('PATH_TO_THUMBSETS', __DIR__);

define('URL_SEARCH_QUERY_LIMIT', 0);
define('GOOGLE_CUSTSEARCH_KEY', 'AIzaSyCTHyk3LC9RKsruLGr-T1p7obuHnKfNOJs');
define('GOOGLE_CUSTSEARCH_CTX', '016630067908230657427:ovcwn0xtatk');
set_time_limit(0);

if (!isset($_POST['thumbset'])) {
	$thumbset_select_options_html = '';
	$filenames = scandir(PATH_TO_THUMBSETS);
	foreach ($filenames as $filename) {

		if (is_dir($filename) && $filename != '.' && $filename != '..') {
			$thumbset_select_options_html .=
				'<option name="'.$filename.'">'.$filename.'</option>';
		}
	}
} else {

	// Here we generate the thumbset.json file.
	$data = array(
		'items' => array()
	);

	$path = $_POST['path'];
	$set_name = $_POST['thumbset'];

	$filenames = scandir("$path/$set_name");
	$urlsearch_query_count = 0;
	foreach ($filenames as $filename) {
		$filepath = "$path/$set_name/$filename";

		if (!is_dir($filepath) && substr($filename, strlen($filename)-4, 4) == '.png') {
			// Found PNG image, record size in pixels
			$size = getimagesize($filepath);
			$thumb_width = $size[0];
			$thumb_height = $size[1];

			// Remove extension
			$filetitle = substr($filename, 0, strlen($filename)-4);

			// Convert "SiteName" to "Site Name" -- hopefully.
			// The RegEx replace attempts to change CamelCase names into
			// a string of space-separated words, but it's far from perfect.
			$possible_site_name = preg_replace('/(?!^)[[:upper:]]+/', ' \0', $filetitle);
			$possible_site_name = ucfirst($possible_site_name);

			// Attempt to use DuckDuckGo API to get official website location
			$possible_url = '';
			if ($urlsearch_query_count < URL_SEARCH_QUERY_LIMIT) {
				$search_api_url = 'https://www.googleapis.com/customsearch/v1'.
					'?key='.GOOGLE_CUSTSEARCH_KEY.
					'&cx='.GOOGLE_CUSTSEARCH_CTX.
					'&q='.urlencode($possible_site_name).
					'&format=json';

				$response = get_web_response($search_api_url);

				$response_data = json_decode($response, true);
				$resp_items = $response_data['items'];
				foreach ($resp_items as $resp_item) {
					if ($resp_item['kind'] == 'customsearch#result') {
						$possible_url = $resp_item['link'];
						break;
					}
				}
				$urlsearch_query_count++;
			}

			$json_entry = array(
				"thumbnail" => $filename,
				"width" => $thumb_width,
				"height" => $thumb_height,
				"site_name" => $possible_site_name
			);
			if ($possible_url) {
				$json_entry['url'] = $possible_url;
			}


			$data['items'][] = $json_entry;
		}
	}

	// Write the output to a "thumbset.generated-<timestamp>.json" file
	$output = get_indented_json_string(json_encode($data, JSON_UNESCAPED_SLASHES));
	$out_filepath = "$path/$set_name/thumbset.generated-".time().".json";
	file_put_contents($out_filepath, $output);

	print('<div>Your generated thumbset JSON file can be found at:</div>');
	print('<input type="text" value="'.$out_filepath.'" class="long" />');
	exit();

}




?>
<form action="generate_thumbset_json.php" method="POST" enctype="application/x-www-form-urlencoded">

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