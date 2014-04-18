<?php


define('DB_LASTERROR_BOTH', 0);
define('DB_LASTERROR_CODE', 1);
define('DB_LASTERROR_MESSAGE', 2);
define('DB_ADD_INSERT_IDS', 0);
define('DB_RETURN_INSERT_IDS', 1);
define('DB_IGNORE_INSERT_IDS', 2);

/**
 * Class DB
 */
class DB {

	/** @var SQLite3 */
	private static $db;
	/** @var SQLite3Stmt */
	private static $stmt;
	/** @var SQLite3Result */
	private static $result;

	/**
	 * @param string $sqlite3DbFile PHP-compatible filepath pointing to the
	 *      SQLite3 database to open.
	 * @return bool TRUE on success; FALSE on failure.
	 */
	static function connect($sqlite3DbFile) {
		if (isset(self::$db)) return true;

		self::$db = new SQLite3($sqlite3DbFile,
			SQLITE3_OPEN_READWRITE | SQLITE3_OPEN_CREATE);

		return self::$db? true: false;
	}

	/**
	 * @param string $sql The SQLite3 statement including named params/values,
	 *      like "WHERE id=:id" or "VALUES (:name, :age)".
	 * @param array [optional] $namedParams Associative array mapping parameter names
	 *      as used in the query string to their actual values.
	 * @return array|int|bool One of the following:
	 *      - [array] The resulting rows, if the result is a dataset.
	 *      - [int] The insertID, if one exists.
	 *      - TRUE if the statement succeeded, but produced no result.
	 *      - FALSE otherwise.
	 */
	static function execute($sql, $namedParams = []) {

		if (gettype(self::$result) === 'SQLite3Result') {
			self::$result->finalize();
		}

		self::$stmt = self::$db->prepare($sql);
		foreach ($namedParams as $paramName => $value) {

			$type = SQLITE3_BLOB;
			if ($value === null) {
				$type = SQLITE3_NULL;
			} else if (gettype($value) === 'integer') {
				$type = SQLITE3_INTEGER;
			} else if (gettype($value) === 'double') {
				$type = SQLITE3_FLOAT;
			} else if (gettype($value) === 'boolean') {
				$type = SQLITE3_INTEGER;
				$value = $type? 1: 0;
			} else if (gettype($value) === 'string') {
				$type = SQLITE3_TEXT;
			} else if (gettype($value) === 'array') {
				$type = SQLITE3_TEXT;
				$value = json_encode($value, JSON_BIGINT_AS_STRING | JSON_UNESCAPED_SLASHES);
			} else if (gettype($value) === 'object') {
				$type = SQLITE3_TEXT;
				$value = json_encode($value, JSON_BIGINT_AS_STRING | JSON_UNESCAPED_SLASHES);
			} else if (gettype($value) === 'NULL') {
				$type = SQLITE3_NULL;
			}

			$bindSucceeded = self::$stmt->bindValue($paramName, $value, $type);
			if (!$bindSucceeded) {
				return false;
			}
		}

		self::$result = self::$stmt->execute();

		if (self::$result !== false) {
			if (self::$result->numColumns() > 0) {
				// dataset
				$data = [];
				do {
					$row = self::$result->fetchArray(SQLITE3_ASSOC);
					if ($row !== false) {
						$data[] = $row;
					}
				} while ($row !== false);
				return $data;
			} else if (self::$db->lastInsertRowID() > 0) {
				// Last insertID (presumably only w/ auto-increment col)
				return self::$db->lastInsertRowID();
			} else if (self::$db->changes() > 0) {
				// Number of affected rows > 0
				return self::$db->changes();
			} else {
				return true;
			}
		} else {
			return false;
		}
	}

	/**
	 * @param string $table SQLite3 DB table name.
	 * @param array $data Array (list) of arrays (rows) to insert
	 * @param array $keyToColMapping An associative array mapping keys in the
	 *      $data array to column names in the SQLite3 table.
	 * @param int $addInsertIDs How to return the corresponding insertIDs.
	 *      DB_ADD_INSERT_IDS (the default): adds 'insert_id' to each $data
	 *          row, by reference.
	 *      DB_RETURN_INSERT_IDS: Returns a flat array of insert IDs, in
	 *          the order of the specified $data rows, instead of the raw count.
	 *      DB_IGNORE_INSERT_IDS: Do nothing with the insert IDs.
	 *
	 * @return int|array|bool The number of rows inserted upon success (unless
	 *      DB_RETURN_INSERT_IDS is specified), or FALSE on failure. NOTE:
	 *      not an atomic operation. Partial data may be inserted. For this
	 *      reason, using DB_ADD_INSERT_IDS is recommended to gain full insight.
	 */
	static function insertData($table, &$data, $keyToColMapping,
		$addInsertIDs = DB_ADD_INSERT_IDS) {

		$query = "insert into `{$table}` \n";
		$tickedColNamesCSV = '';
		$ParamNamesSetOffCSV = '';
		$rowsInserted = 0;
		$insertIDs = [];

		foreach ($keyToColMapping as $key => $colName) {
			if (strlen($tickedColNamesCSV)) {
				$tickedColNamesCSV .= ', ';
				$ParamNamesSetOffCSV .= ', ';
			}
			$tickedColNamesCSV .= "`{$colName}`";
			$ParamNamesSetOffCSV .= ":{$colName}";
		}

		$query .= "({$tickedColNamesCSV}) \n";
		$query .= "values \n";
		$query .= "({$ParamNamesSetOffCSV})";

		foreach ($data as &$row) {
			$paramsArray = [];
			foreach ($keyToColMapping as $key => $colName) {
				$paramsArray[$colName] = $row[$key];
			}

			$result = self::execute($query, $paramsArray);

			if ($result === false) {
				return false;
			}

			$insertID = self::getLastInsertID();
			if ($insertID) {
				$row['insert_id'] = $insertID;
				$insertIDs[] = $insertID;
				$rowsInserted++;
			}
		}

		return $addInsertIDs === DB_RETURN_INSERT_IDS?
			$insertIDs:
			$rowsInserted;
	}

	/**
	 * @param int $which [optional] What to return:
	 *      DB_LASTERROR_BOTH (the default),
	 *      DB_LASTERROR_CODE, or
	 *      DB_LASTERROR_MESSAGE.
	 * @return array|int|string
	 *      By default, an associative array with keys for the error code (code)
	 *      and the message string (message). Otherwise, either an error code
	 *      or the error message string, depending on $which parameter.
	 * @throws InvalidArgumentException
	 */
	static function getLastError($which = DB_LASTERROR_BOTH) {
		if ($which === DB_LASTERROR_BOTH) {
			return [
				'message' => self::$db->lastErrorMsg(),
				'code' => self::$db->lastErrorCode()
			];
		} else if ($which === DB_LASTERROR_CODE) {
			return self::$db->lastErrorCode();
		} else if ($which === DB_LASTERROR_MESSAGE) {
			return self::$db->lastErrorMsg();
		} else {
			throw new InvalidArgumentException('getLastError(): Invalid parameter `'.$which.'`');
		}
	}

	/**
	 * Returns the row ID of the most recent INSERT into the database.
	 * @return int
	 */
	static function getLastInsertID() {
		return self::$db->lastInsertRowID();
	}

	/**
	 * Returns the number of database rows changed (or inserted or deleted)
	 *      by the most recent SQL statement.
	 * @return int
	 */
	static function getNumAffectedRows() {
		return self::$db->changes();
	}

	/**
	 * @return bool TRUE if the database closed successfully; FALSE otherwise.
	 */
	static function disconnect() {
		$closed = self::$db->close();
		if ($closed) {
			unset(self::$db);
			return true;
		}
		return false;
	}


}



