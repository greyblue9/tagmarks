<?php


namespace Tagmarks;

/**
 * Class Setup
 * @package Tagmarks
 */
class Setup {

	private $defaultsDirPath = '';
	private $privateDirPath = '';

	private $iniData;
	private $tldData;

	/**
	 * @param string $defaultsDirPath
	 * @param string $privateDirPath
	 */
	function __construct($defaultsDirPath, $privateDirPath) {
		$this->defaultsDirPath = $defaultsDirPath;
		$this->privateDirPath = $privateDirPath;

		$this->readIniFiles();
	}

	/**
	 * Reads values from default tagmarks INI file, as well as the specific
	 * INI in the configuration (private) dir, and merges them together. Private
	 * tagmarks INI values override any default values.
	 */
	private function readIniFiles()
	{
		$defaultsIni = parse_ini_file($this->defaultsDirPath.'/tagmarks.ini',
			false); // ignore sections
		$userIni = parse_ini_file($this->privateDirPath.'/tagmarks.ini',
			false); // ignore sections

		$this->iniData = self::iniMerge($defaultsIni, $userIni);

		define('JSON_INDENTED_OUTPUT', $this->iniData['json_indented_output']);
		define('DEBUG_MODE', $this->iniData['debug_mode']);
		define('CACHE_LEVEL', $this->iniData['cache_level']);
	}

	private function readTldData() {
		$this->tldData = [];
		$columnHeaders = [];

		$csv = fopen($this->defaultsDirPath.'/TLDs.csv', 'r');
		if ($csv === false) {
			throw new \Exception('Expected file "TLDs.csv" in defaults directory.');
		}

		$rowIdx = 0;
		do {
			$row = fgetcsv($csv, 1000, ',', '"', '"');

			if ($rowIdx === 0) {
				$columnHeaders = $row;
			} else if ($row !== false) {
				$tldInfo = [];
				foreach ($row as $idx => $val) {

					$val = preg_replace('/\p{Cc}+/u', '', $val);
					$tldInfo[$columnHeaders[$idx]] = $val;
				}

				$this->tldData[] = $tldInfo;
			}

			$rowIdx++;
		} while ($row !== false);

		fclose($csv);
	}

	function getTldData() {
		if (!isset($this->tldData)) {
			$this->readTldData();
		}

		return $this->tldData;
	}

	/**
	 * @param array $config_ini
	 *      The INI file containing a base set of default values.
	 *      Also the output of parse_ini_file() with the $process_sections
	 *          parameter set to FALSE. In other words, a flat
	 *          array mapping ini keys to values.
	 * @param array $custom_ini
	 *      The INI file containing the preferred set of values. Any values
	 *          specified therein will override those (with corresponding keys)
	 *          in the file designated by $config_ini.
	 *      Also the output of parse_ini_file() with the $process_sections
	 *          parameter set to FALSE. In other words, a flat
	 *          array mapping ini keys to values.
	 * @return array - The resulting combined INI map.
	 */
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
	 * @return array An array mapping secure variables to their values
	 *      from secure_vars.ini in the private directory specified in
	 *      the constructor
	 * @see Setup::__construct
	 */
	function getSecureVars()
	{
		// Only try to load secure vars if ini filename is not blank.
		$secvarsIniFilepath = $this->privateDirPath.'/secure_vars.ini';
		if (!file_exists($secvarsIniFilepath)) {
			// No secure variables
			return [];
		}

		$secureVars = parse_ini_file($secvarsIniFilepath, false);
		return $secureVars;
	}


}
