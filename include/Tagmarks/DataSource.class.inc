<?php

namespace Tagmarks;


/**
 * Class DataSource
 * @package Tagmarks
 */
class DataSource {

	/** @var string */
	private $mainDataFilepath;
	private $stateDataFilepath;

	/**
	 * @param string $mainDataFilepath - Path to the file containing main data
	 *      (sites, tags, settings)
	 * @param string $stateDataFilepath - Path to the file containing
	 *      user display state (which tags are turned on/off, etc.)
	 */
	function __construct($mainDataFilepath, $stateDataFilepath = '') {
		$this->mainDataFilepath = $mainDataFilepath;

		if (strlen($stateDataFilepath)) {
			$this->stateDataFilepath = $stateDataFilepath;
		}
	}

	/**
	 * @param array $sites - List of site data items
	 *      (list-array of assoc-arrays)
	 * @return array - Save information
	 * @throws \Exception - If the save operation fails, an Exception is thrown
	 *      with an $ex->message including the filepath where the write was
	 *      attempted, and the number of bytes attempted in $ex->code.
	 */
	function saveSites($sites)
	{
		// Decode existing data
		$mainDataJson = file_get_contents($this->mainDataFilepath);
		$mainData = Json::decode($mainDataJson);

		// Overwrite "sites" array and re-encode
		$mainData['sites'] = $sites;
		$mainDataJson = Json::encode($mainData);


		$bytesWritten = file_put_contents($this->mainDataFilepath,
			$mainDataJson);

		$saveSucceeded =
			$bytesWritten !== false &&
			$bytesWritten === strlen($mainDataJson);

		if ($saveSucceeded === false) {
			throw new \Exception(
				"saveSites() failed to write to '{$this->mainDataFilepath}'",
				strlen($mainDataJson)
			);
		}

		return [
			'server_action' => 'save_sites',
			'site_count' => count($sites),
			'save_file' => $this->mainDataFilepath,
			'save_file_realpath' => realpath($this->mainDataFilepath),
			'save_bytes_attempted' => strlen($mainDataJson),
			'save_bytes_written' => $bytesWritten,
			'save_failure' => $bytesWritten === false,
			'save_succeeded' => $saveSucceeded,
			'result' => $saveSucceeded
		];

	}

	/**
	 * @param array $secureVars [optional] - An associative array mapping
	 *      secure variable names to their values, such as the one generated
	 *      by Setup::getSecureVars().
	 * @see Setup::getSecureVars
	 * @return array - An associative array with the following keys:
	 *      sites: An array of sites, where each item contains site data
	 *      tags: An array of tags, where each item contains tag data
	 *      settings: An associative array of settings mapping setting
	 *          parameter names to values
	 * @throws \Exception - An exception is thrown if the main data file
	 *      cannot be read, or if the save operation fails when the main data
	 *      file must be updated to ensure integrity (e.g., re-saving to add
	 *      site unique IDs).
	 */
	function getMainData($secureVars = []) {

		// Decode existing data
		$mainDataJson = file_get_contents($this->mainDataFilepath);
		if ($mainDataJson === false) {
			throw new \Exception(
				"getSites() failed to read '{$this->mainDataFilepath}'");
		}
		$mainData = Json::decode($mainDataJson);

		// Reference to 'sites' list in $mainData
		$sites = &$mainData['sites'];
		$sitesChanged = false;

		// Update each site with an 'id' if one is not already present
		foreach ($sites as &$site) {
			if (!isset($site['id'])) {
				// Generate a random numeric ID from 0x10000000 and 0x7fffffff
				// (maximum 32-bit signed integer)
				$site['id'] = mt_rand(hexdec('10000000'), hexdec('7fffffff'));
				$sitesChanged = true;
			}
		}

		// Re-save main datafile if updates were made
		if ($sitesChanged) {
			$mainDataJson = Json::encode($mainData);
			$bytesWritten = file_put_contents($this->mainDataFilepath, $mainDataJson);

			if ($bytesWritten === false) {
				throw new \Exception(
					"getSites() failed to save while adding necessary values ".
					"to existing data. File: '{$this->mainDataFilepath}'");
			}
		}

		if (count($secureVars)) {
			// The variable $data_with_secvars will contain any secure data in plaintext
			$mainDataSec = Utils::getDeepVariableCopy($mainData);
			Utils::replaceSecureVars($mainDataSec, $secureVars);

			return $mainDataSec;
		} else {
			return $mainData;
		}
	}

	/**
	 * @param array $stateData
	 * @return array - Save information
	 * @throws \Exception - If the save operation fails, an Exception is thrown
	 *      with an $ex->message including the filepath where the write was
	 *      attempted, and the number of bytes attempted in $ex->code.
	 */
	function saveState($stateData) {

		$stateDataJson = Json::encode($stateData);

		$bytesWritten = file_put_contents($this->stateDataFilepath,
			$stateDataJson);

		$saveSucceeded =
			$bytesWritten !== false &&
			$bytesWritten === strlen($stateDataJson);

		if ($saveSucceeded === false) {
			throw new \Exception(
				"saveState() failed to write to '{$this->stateDataFilepath}'",
				strlen($stateDataJson)
			);
		}

		return [
			'server_action' => 'save_state',
			'state' => $stateData,
			'save_file' => $this->stateDataFilepath,
			'save_file_realpath' => realpath($this->stateDataFilepath),
			'save_bytes_attempted' => strlen($stateDataJson),
			'save_bytes_written' => intval($bytesWritten),
			'save_failure' => $bytesWritten === false,
			'save_succeeded' => $saveSucceeded,
			'result' => $saveSucceeded
		];

	}

	/**
	 * @return array - An array containing at least the key 'state', which
	 *      maps to a structure describing state information. Other information
	 *      may also be provided.
	 */
	function getState() {

		if (file_exists($this->stateDataFilepath)) {
			$stateDataJson = file_get_contents($this->stateDataFilepath);
			$stateData = Json::decode($stateDataJson, true);

			$lastModTS = filemtime($this->stateDataFilepath);
			$lastModString = gmdate('D, d M Y H:i:s \G\M\T', $lastModTS);

			return [
				'state' => $stateData,
				'state_source' => $this->stateDataFilepath,
				'last_modified_timestamp' => $lastModTS,
				'last_modified' => $lastModString
			];
		}

		// No state file:
		// Build default state data based on every tag
		// found in the main site list
		$mainData = $this->getMainData();
		$tagsList = [];
		foreach ($mainData['tags'] as $tag) {
			$tagsList[] = $tag['id_name'];
		}

		return[
			'state' => [
				'selectedTagIds' => $tagsList
			],
			'state_source' => 'default'
		];
	}

}
