<?php



define('CR', "\r");
define('LF', "\n");
define('CRLF', "\r\n");


if (is_dir(__DIR__.'/../private/tagmarks')) {
	define('PRIVATE_DIR_PATH', '../private/tagmarks');
} else if (is_dir(__DIR__.'/../../private')) {
	define('PRIVATE_DIR_PATH', '../../private/tagmarks');
} else if (is_dir(__DIR__.'/../../../private')) {
	define('PRIVATE_DIR_PATH', '../../../private/tagmarks');
} else {
	die('Unable to find private/ directory.');
}


class Setup {

	static function readIniFiles()
	{
		$defaults_ini = parse_ini_file('defaults/tagmarks.ini', false);
		$user_ini = parse_ini_file(PRIVATE_DIR_PATH.'/tagmarks.ini', false);

		$inidata = self::iniMerge($defaults_ini, $user_ini);

		define('MAIN_DATA_FILEPATH', $inidata['main_data_relative_path'].
			'/'.$inidata['main_data_filename']);
		define('MAIN_DATA_FILENAME', $inidata['main_data_filename']);

		define('SECURE_DATA_SCRIPT_FILEPATH', $inidata['secure_vars_filename']);
		define('SECURE_DATA_SCRIPT_FILENAME', $inidata['secure_vars_relative_path']
			.'/'.$inidata['secure_vars_filename']);

		define('TLDS_LIST_FILEPATH', $inidata['tld_list_filename']);
		define('TLDS_LIST_FILENAME', $inidata['tld_list_relative_path']
			.'/'.$inidata['tld_list_filename']);

		define('JSON_INDENTED_OUTPUT', $inidata['json_indented_output']);

		define('DEBUG_MODE', $inidata['debug_mode']);
		define('CACHE_LEVEL', $inidata['cache_level']);
	}

	private static function iniMerge($config_ini, $custom_ini)
	{
		foreach ($custom_ini AS $k => $v) {
			if (is_array($v)) {
				$config_ini[$k] = self::iniMerge($config_ini[$k], $custom_ini[$k]);
			}
			else {
				$config_ini[$k] = $v;
			}
		}

		return $config_ini;
	}

	/**
	 * @param string $secvarsIniFilename Path to PHP script containing
	 *      get_secure_vars() function, which returns an array associating
	 *      secure var names to values
	 * @return array The associative array mentioned above
	 */
	static function getSecureVars($secvarsIniFilename)
	{
		// Only try to load secure vars if ini filename is not blank.
		if ($secvarsIniFilename) {

			// Load secure variables file, if it exists
			$realpathToSecvarsIni = realpath(__DIR__).'/../'.$secvarsIniFilename;
			if (file_exists($realpathToSecvarsIni)) {

				$secureVars = parse_ini_file($realpathToSecvarsIni, false);
				return $secureVars;

			}

			Errors::exitWithFatalError(
				'Problem with Secure Variables file',
				'The INI file "'.SECURE_DATA_SCRIPT_FILENAME.'" was not found '.
					'relative to the tagmarks web-root.'
			);

		}

		// No secure variables
		return array();
	}


	static function replaceSecureVars(&$p_data, $secure_vars)
	{
		$secvar_begin_marker = '$secure{';
		$secvar_end_marker = '}';

		switch (gettype($p_data)) {
			case 'array':
				foreach ($p_data as $idx_or_key => $val) {
					$p_data[$idx_or_key] = self::replaceSecureVars($p_data[$idx_or_key], $secure_vars);
				}

				return $p_data;
			case 'string':
				$secvar_marker_start_pos = strpos($p_data, $secvar_begin_marker, 0);
				if ($secvar_marker_start_pos !== false) {
					$secvar_end_marker_pos = strpos($p_data, $secvar_end_marker, $secvar_marker_start_pos);
					$secvar_name = substr(
						$p_data,
						$secvar_marker_start_pos+strlen($secvar_begin_marker),
						$secvar_end_marker_pos-($secvar_marker_start_pos+strlen($secvar_begin_marker))
					);
					// Name in secvar tag: $secvar_name
					$replaced_string =
						substr($p_data, 0, $secvar_marker_start_pos).
						$secure_vars[$secvar_name].
						substr($p_data, $secvar_end_marker_pos+1);

					//print("[$secvar_name] -- whole thing: [$replaced_string]<br/>\n");
					return $replaced_string;
				}

				return $p_data;
			default:
				return $p_data;
		}
	}

}


class Errors {

	/**
	 * Displays information about a fatal error, and stops processing further.
	 *
	 * @param string $error_text Main text of the error
	 * @param string $more_info Additonal information (to be displayed
	 *      as pre-formatted text when applicable)
	 * @param string $format [optional] Output format for error
	 *      <p>Acceptable values are <b>html, json</b></p>
	 */
	static function exitWithFatalError($error_text, $more_info = '', $format = 'html')
	{
		if ($format == 'html') {
			print('<!DOCTYPE html>
				<html>
					<body>
						<div>
							<div style="font-weight: bold; font-size: 150%">'.$error_text.'</div>
							<pre>'.$more_info.'</pre>
						</div>
					</body>
				</html>');
		} else if ($format == 'json') {
			print(json_encode(array(
				'error_occurred' => true,
				'error' => array(
					'text' => $error_text,
					'more_info' => $more_info
				)
			), JSON_NUMERIC_CHECK | JSON_UNESCAPED_SLASHES));
		} else {
			print('Error occurred, but output format "'.$format.'" is '.
				'not supported by exitWithFatalError().');
		}

		exit();
	}

}

class Json {

	/**
	 * @param string $json_string
	 * @param string $format [optional] Only formats accepted
	 *      by exitWithFatalError are valid (default is "html")
	 * @see Errors::exitWithFatalError()
	 * @return array Nested array structure (decoded JSON data)
	 *      <p><b>NOTE:</b>
	 *      Will not return to caller upon error in decoding JSON.</p>
	 */
	static function decodeOrOutputError($json_string, $format = 'html')
	{

		$data = @json_decode($json_string, true);

		switch (json_last_error()) {
			case JSON_ERROR_NONE:
				// JSON parsed just fine
				return $data;
			case JSON_ERROR_DEPTH:
				Errors::exitWithFatalError('JSON error: Depth',
					'JSON data is nested too deep.', $format);
				break;
			case JSON_ERROR_STATE_MISMATCH:
				Errors::exitWithFatalError('JSON error: State Mismatch',
					'Underflow or the modes mismatch.', $format);
				break;
			case JSON_ERROR_CTRL_CHAR:
				Errors::exitWithFatalError('JSON error: Control Character',
					'Unespected control character encountered in JSON.', $format);
				break;
			case JSON_ERROR_SYNTAX:
				Errors::exitWithFatalError('JSON error: Syntax',
					'Syntax error due to malformed JSON.', $format);
				break;
			case JSON_ERROR_UTF8:
				Errors::exitWithFatalError('JSON error UTF8',
					'Malformed UTF-8 characters - incorrectly encoded?', $format);
				break;
			default:
				Errors::exitWithFatalError('Unknown error',
					'Unrecognized error code returned by json_last_error.', $format);
		}

		exit();
	}

	/**
	 * Indents a flat JSON string to make it more human-readable.
	 *
	 * TODO: Optimize this function -- it is very slow
	 *
	 * @param string $json The original JSON string to process.
	 * @return string Indented version of the original JSON string.
	 */
	static function formatJson($json)
	{

		$result = '';
		$pos = 0;
		$strLen = strlen($json);
		$indentStr = "\t";
		$newLine = "\n";
		$prevChar = '';
		$outOfQuotes = true;

		for ($i = 0; $i <= $strLen; $i++) {

			// Grab the next character in the string.
			$char = substr($json, $i, 1);

			// Are we inside a quoted string?
			if ($char == '"' && $prevChar != '\\') {
				$outOfQuotes = !$outOfQuotes;

				// If this character is the end of an element,
				// output a new line and indent the next line.
			}
			else if (($char == '}' || $char == ']') && $outOfQuotes) {
				$result .= $newLine;
				$pos--;
				for ($j = 0; $j < $pos; $j++) {
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
					$pos++;
				}

				for ($j = 0; $j < $pos; $j++) {
					$result .= $indentStr;
				}
			}

			$prevChar = $char;
		}

		return $result;
	}
}


class Common {

	/**
	 * Mainly used to generate a deep copy of an array (main and sub-arrays
	 * can be associative or sequential).
	 *
	 * @param $input array The array to be copied
	 * @return array The copy
	 */
	static function getDeepVariableCopy($input)
	{
		switch (gettype($input)) {
			case 'array':
				// DBR note 2013-09-10: Still not sure if this makes a difference in PHP.
				if (self::isAssociative($input)) {
					$copy = array();
					foreach ($input as $key => $val) {
						$copy[$key] = self::getDeepVariableCopy($val);
					}

					return $copy;
				}
				else {
					$copy = array();
					foreach ($input as $val) {
						$copy[] = self::getDeepVariableCopy($val);
					}

					return $copy;
				}
			default:
				return $input;
		}
	}


	static function getHttpResponse($url)
	{
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
		$data = curl_exec($ch);
		curl_close($ch);

		return $data;
	}


	static function isAssociative($arr)
	{
		return array_keys($arr) !== range(0, count($arr)-1);
	}

	/**
	 * This script accepts a long value representing a number of bytes, and it outputs the appropriate file size unit.
	 *
	 * @link http://www.phpshare.org/scripts/Format-Size-Units
	 * @author Added on August 2, 2007 by Zhay. Zhay accreditted the script to himself.
	 * @note DBR 2013-11-29 Modified 'KB' to 'kB' in accordance with SI convention
	 * @param int $bytes Byte size of file
	 * @return string Human-readable file size description
	 */
	static function formatSizeUnits($bytes)
	{
		if ($bytes >= 1073741824) {
			$bytes = number_format($bytes/1073741824, 2).' GB';
		}
		elseif ($bytes >= 1048576) {
			$bytes = number_format($bytes/1048576, 2).' MB';
		}
		elseif ($bytes >= 1024) {
			$bytes = number_format($bytes/1024, 2).' kB';
		}
		elseif ($bytes > 1) {
			$bytes = $bytes.' bytes';
		}
		elseif ($bytes == 1) {
			$bytes = $bytes.' byte';
		}
		else {
			$bytes = '0 bytes';
		}

		return $bytes;
	}

	static function getFilenameWithModifiedTime($file)
	{
		$mtime = filemtime($file);

		return $file.'?lastmod='.$mtime;
	}

	static function getHtmlTable($data, $columns = array('__key', '__value'))
	{

		$rows = array();

		foreach ($data as $key => $val) {
			$row = array();
			foreach ($columns as $column) {
				$cellval = '&nbsp;';
				if ($column == '__key') {
					$cellval = $key;
				}
				else if ($column == '__value') {
					$cellval = $val;
				}
				$row[] = $cellval;
			}
			$rows[] = $row;
		}

		$html = '';

		if (headers_sent() === false) {
			$html .= '<!DOCTYPE html><html><head><body>';
		}

		$html .= '<style type="text/css">
			table.getHtmlTable {
				border-spacing: 0;
				border: 1px solid #000;
				border-collapse: separate;
				width: 600px;
				padding: 0;
				margin: 0;
				font-family: Consolas, monospace;
			}
			table.getHtmlTable tr {
				padding: 0;
				margin: 0;
			}
			table.getHtmlTable tr:nth-child(odd) {
				background: #f0f3f7;
			}
			table.getHtmlTable thead > tr:first-child {
				background: #dae2e9;
			}
			table.getHtmlTable td {
				width: 600px;
				padding: 4px 10px;
				margin: 0;
				border-bottom: 1px solid #aaa;
			}
			table.getHtmlTable td + td {
				border-left: 1px solid #ddd;
			}
			table.getHtmlTable td.blank:after {

			}
		</style>';

		$html .= '<table class="getHtmlTable"><thead><tr>';
		foreach ($columns as $column) {
			$html .= '<th>'.htmlspecialchars($column).'</th>';
		}
		$html .= '</tr></thead><tbody>';

		foreach ($rows as $rowCells) {
			$cellsHtml = array();
			foreach ($rowCells as $cellval) {
				$cellsHtml[] = ($cellval !== '')?
					htmlspecialchars($cellval):
					'';
			}
			$html .= '<tr><td>'.implode('</td><td>', $cellsHtml).'</td></tr>';
		}
		$html .= '</table>';

		if (headers_sent() === false) {
			$html .= '</body></html>';
		}

		return $html;
	}

}








