<?php

namespace Tagmarks;


define('JSON_ENCODE_OPTIONS',
	JSON_NUMERIC_CHECK |
	JSON_UNESCAPED_SLASHES |
	JSON_PRETTY_PRINT);

define('JSON_DECODE_OPTIONS',
	JSON_BIGINT_AS_STRING);

define('JSON_OBJECT_AS_ASSOC_ARRAY', true);
define('JSON_DEFAULT_DEPTH', 512);
define('JSON_NONE', 0);


/**
 * Class Json
 * @package Tagmarks
 */
class Json {

	/**
	 * @param mixed $data - The value being encoded. Can be any type except a
	 *      resource. This function only works with UTF-8 encoded data.
	 * @param int $extraOptions - If specified, these options will be added
	 *      to the defaults from JSON_ENCODE_OPTIONS.
	 * @param int $excludeOptions - If specified, these options will be
	 *      excluded from the JSON_ENCODE_OPTIONS and anything in $extraOptions.
	 * @return string|bool - A JSON encoded string on success,
	 *      or FALSE on failure.
	 */
	static function encode($data, $extraOptions = JSON_NONE, $excludeOptions = JSON_NONE) {

		$options = JSON_ENCODE_OPTIONS;
		$options |= $extraOptions;
		$excludeMask = hexdec('ffffffff') ^ $excludeOptions;
		$options &= $excludeMask;

		return json_encode($data, $options);
	}

	/**
	 * @param string $json - The JSON encoded string to decode. Must contain
	 *      valid syntax, including correct use of UTF-8 encoding.
	 * @return mixed - The decoded data
	 * @throws \Exception - An exception is thrown if there is a problem
	 *      decoding the JSON. The exception will contain the error message
	 *      from json_last_error_msg() as $ex->message,
	 *      and the error code from json_last_error() as $ex->code.
	 */
	static function decode($json) {

		$data = @json_decode(
			$json,
			JSON_OBJECT_AS_ASSOC_ARRAY,
			JSON_DEFAULT_DEPTH,
			JSON_DECODE_OPTIONS
		);

		$lastError = json_last_error();
		if ($lastError === 0) {
			return $data;
		}

		$lastErrorMsg = json_last_error_msg();
		throw new \Exception($lastErrorMsg, $lastError);
	}



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
