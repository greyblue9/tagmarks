<?php


define('NEWLINE', "\n");


/**
 * Displays information about a fatal error, and stops processing further.
 *
 * @param $error_text string Main text of the error
 * @param string $more_info string Additonal information which will be displayed
 *          as pre-formatted text.
 */
function exit_with_fatal_error($error_text, $more_info = '') {
	print('<!DOCTYPE html>
	<head>
		<link rel="stylesheet" href="advanced.css" />
	</head>
	<body>
		<div class="fatal_error">
			'.$error_text.'
			<pre class="more_info">'.$more_info.'</pre>
		</div>
	</body>
	');
	exit();
}



function decode_json_with_error_output($json_string) {

	$data = @json_decode($json_string, true);

	switch (json_last_error()) {
		case JSON_ERROR_NONE:
			// JSON parsed just fine
			return $data;
		case JSON_ERROR_DEPTH:
			exit_with_fatal_error('JSON error: Depth', 'JSON data is nested too deep.');
			break;
		case JSON_ERROR_STATE_MISMATCH:
			exit_with_fatal_error('JSON error: State Mismatch', 'Underflow or the modes mismatch.');
			break;
		case JSON_ERROR_CTRL_CHAR:
			exit_with_fatal_error('JSON error: Unexpected control character found');
			break;
		case JSON_ERROR_SYNTAX:
			exit_with_fatal_error('JSON error: Syntax', 'Syntax error, malformed JSON');
			break;
		case JSON_ERROR_UTF8:
			exit_with_fatal_error('JSON error UTF8', 'Malformed UTF-8 characters, possibly incorrectly encoded');
			break;
		default:
			exit_with_fatal_error('Unknown error');
	}

	exit();
}




function load_secure_vars($php_script_filename) {
	// load secure settings file, if file exists
	if (file_exists($php_script_filename)) {
		// All this file should do is define a $secure_vars variable with
		// a key-value array as its value.
		require_once($php_script_filename);
		if (!function_exists('get_secure_vars')) {
			exit_with_fatal_error('Problem with Secure Settings file',
				'The PHP script file included for secure settings '.NEWLINE.
				'('.SECURE_DATA_SCRIPT_FILENAME.') '.
				'does not have the requried function get_secure_vars().'.NEWLINE.
				'which must return an array of name => value pairs.'
			);
		}
		$secure_vars = get_secure_vars();
		return $secure_vars;
	}

	// No secure variables
	return array();
}




/**
 * Indents a flat JSON string to make it more human-readable.
 *
 * @param string $json The original JSON string to process.
 * @return string Indented version of the original JSON string.
 */
function get_indented_json_string($json) {

	$result      = '';
	$pos         = 0;
	$strLen      = strlen($json);
	$indentStr   = "\t";
	$newLine     = "\n";
	$prevChar    = '';
	$outOfQuotes = true;

	for ($i=0; $i<=$strLen; $i++) {

		// Grab the next character in the string.
		$char = substr($json, $i, 1);

		// Are we inside a quoted string?
		if ($char == '"' && $prevChar != '\\') {
			$outOfQuotes = !$outOfQuotes;

			// If this character is the end of an element,
			// output a new line and indent the next line.
		} else if(($char == '}' || $char == ']') && $outOfQuotes) {
			$result .= $newLine;
			$pos --;
			for ($j=0; $j<$pos; $j++) {
				$result .= $indentStr;
			}
		}

		// Add the character to the result string.
		$result .= $char;

		// If the last character was the beginning of an element,
		// output a new line and indent the next line.
		if (($char == ',' || $char == '{' || $char == '[') && $outOfQuotes) {
			$result .= $newLine;
			if ($char == '{' || $char == '[') {
				$pos ++;
			}

			for ($j = 0; $j < $pos; $j++) {
				$result .= $indentStr;
			}
		}

		$prevChar = $char;
	}

	return $result;
}



function is_assoc($arr)
{
	return array_keys($arr) !== range(0, count($arr) - 1);
}

/**
 * Mainly used to generate a deep copy of an array (main and sub-arrays
 * can be associative or sequential).
 *
 * @param $input array The array to be copied
 * @return array The copy
 */
function get_copy_of($input) {
	switch (gettype($input)) {
		case 'array':
			// DBR note 2013-09-10: Still not sure if this makes a difference in PHP.
			if (is_assoc($input)) {
				$copy = array();
				foreach ($input as $key => $val) {
					$copy[$key] = get_copy_of($val);
				}
				return $copy;
			} else {
				$copy = array();
				foreach ($input as $val) {
					$copy[] = get_copy_of($val);
				}
				return $copy;
			}
		default:
			return $input;
	}
}

function replace_secure_vars(&$p_data, $secure_vars) {
	$secvar_begin_marker = '$secure{';
	$secvar_end_marker = '}';

	switch (gettype($p_data)) {
		case 'array':
			foreach ($p_data as $idx_or_key => $val) {
				$p_data[$idx_or_key] = replace_secure_vars($p_data[$idx_or_key], $secure_vars);
			}
			return $p_data;
		case 'string':
			$secvar_marker_start_pos = strpos($p_data, $secvar_begin_marker, 0);
			if ($secvar_marker_start_pos !== false) {
				$secvar_end_marker_pos = strpos($p_data, $secvar_end_marker, $secvar_marker_start_pos);
				$secvar_name = substr(
					$p_data,
					$secvar_marker_start_pos + strlen($secvar_begin_marker),
					$secvar_end_marker_pos - ($secvar_marker_start_pos + strlen($secvar_begin_marker))
				);
				// Name in secvar tag: $secvar_name
				$replaced_string =
					substr($p_data, 0, $secvar_marker_start_pos).
					$secure_vars[$secvar_name].
					substr($p_data, $secvar_end_marker_pos + 1);
				//print("[$secvar_name] -- whole thing: [$replaced_string]<br/>\n");
				return $replaced_string;
			}
			return $p_data;
		default:
			return $p_data;
	}
}


