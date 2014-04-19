<?php


namespace Tagmarks;

/**
 * Class Utils
 * @package Tagmarks
 */
class Utils {

	/**
	 * Mainly used to generate a deep copy of an array (main and sub-arrays
	 * can be associative or sequential).
	 *
	 * @param $input array - The array to be copied
	 * @return array - The copy
	 */
	static function getDeepVariableCopy($input)
	{
		switch (gettype($input)) {
			case 'array':
				// DBR note 2013-09-10: Still not sure if this makes a difference in PHP.
				if (self::isAssociative($input)) {
					$copy = [];
					foreach ($input as $key => $val) {
						$copy[$key] = self::getDeepVariableCopy($val);
					}

					return $copy;
				}
				else {
					$copy = [];
					foreach ($input as $val) {
						$copy[] = self::getDeepVariableCopy($val);
					}

					return $copy;
				}
			default:
				return $input;
		}
	}

	/**
	 * @param string $url - The URL for the HTTP GET request
	 * @return string - The HTTP response body
	 */
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

	/**
	 * Determines whether an array is associative (a map), or a list.
	 *
	 * NOTE: An array which would otherwise be a list, but is missing a
	 *      numeric key somewhere in the range from 0 to count-1, will
	 *      be considered associative.
	 *
	 * @param array $arr - The array to inspect
	 * @return bool - Boolean indicating the associative-ness of the array:
	 *      TRUE if the array is associative (a hashmap, etc)
	 *      FALSE if the array is a simple list (keys are numeric,
	 *          where an array key exists for each integer in the
	 *          range from 0 to the total count of array items - 1).
	 */
	static function isAssociative($arr)
	{
		return array_keys($arr) !== range(0, count($arr)-1);
	}

	/**
	 * This script accepts a long value representing a number of bytes,
	 * and it outputs the appropriate file size unit.
	 *
	 * @link http://www.phpshare.org/scripts/Format-Size-Units
	 * @author Added on August 2, 2007 by Zhay. Zhay accreditted the script to himself.
	 * @note DBR 2013-11-29 Modified 'KB' to 'kB' in accordance with SI convention
	 *
	 * @param int $bytes - Byte size of file
	 * @return string - Human-readable file size description
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

	/**
	 * Returns the specified filename along with its last modified time
	 * as a single GET variable named "lastmod" - The intended use for
	 * this is caching in browser HTML-specified resources.
	 *
	 * @param string $file - Path to the file to check modified time
	 * @return string - The filename as specified, with the "?lastmod=<time>"
	 *      appended, where <time> is a UNIX timestamp.
	 */
	static function getFilenameWithModifiedTime($file)
	{
		$mtime = filemtime($file);

		return $file.'?lastmod='.$mtime;
	}


	/**
	 * @param array|string $p_data
	 * @param array $secure_vars
	 * @return array|string
	 */
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

