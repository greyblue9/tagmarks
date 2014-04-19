<?php

namespace Tagmarks;

/**
 * Class Errors
 * @package Tagmarks
 */
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

			if (!headers_sent()) {
				header('Content-Type: text/html;charset=UTF-8');
			}

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

			$response = [
				'error_occurred' => true,
				'error' => [
					'text' => $error_text,
					'more_info' => $more_info
				]
			];

			if (!headers_sent()) {
				header('Content-Type: application/json;charset=UTF-8');
			}
			print(Json::encode($response));

		} else {

			if (!headers_sent()) {
				header('Content-Type: text/plain;charset=UTF-8');
			}
			print('Error occurred, but output format "'.$format.'" is '.
				'not supported by exitWithFatalError().');

		}

		exit();
	}

}
