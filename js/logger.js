/**
 * @file logger.js
 * @author David Reilly <greylue9@gmail.com>
 * @see {@link http://github.com/greyblue9/tagmarks}
 */

/**
 * @name logger
 * @namespace
 */
define('logger', ['jquery'], function($) {
	'use strict';

	var logger = (function() {

		/** @const {Boolean} */
		var LOGGING_ENABLED = true;

		/**
		 * Contains all valid log types recognized by logger.
		 * @readonly
		 * @const {String[]} */
		var LOG_TYPES_ALL = ['error', 'warning', 'info', 'log', 'debug'];

		/**
		 * Only the subset of valid log types included in this array will be
		 * processed. Modify to suppress/include certain log types from
		 * being displayed in the console.
		 * @const {String[]} */
		var LOG_TYPES_ENABLED = ['error', 'warning', 'info', 'log', 'debug'];


		return {
			/**
			 * Log to console, if LOGGING_ENABLED = true and specified log type
			 * is enabled (see LOG_TYPES_ENABLED). If not specified, assumes
			 * default log type ('log').
			 *
			 * @public
			 * @name logger.log
			 * @function
			 * @param {...*} message - Any number of variables to log, followed
			 * by the log type (one of the recognized log type strings defined
			 * in LOG_TYPES_ALL).
			 */
			log: function (message) {
				if (LOGGING_ENABLED !== true || typeof console != 'object') return;

				var argsArray = $.makeArray(arguments);

				var messages = argsArray.slice(0, argsArray.length - 1);
				var logType = argsArray[argsArray.length - 1];

				if (typeof logType === 'undefined') {
					// Default log type
					logType = 'log';
				}

				if (!$.inArray(logType, LOG_TYPES_ALL)) {
					// Last argument is a log item, not the log type to use
					logType = 'log';
					messages = argsArray;
				}

				if (!$.inArray(logType, LOG_TYPES_ENABLED)) {
					// LOGS_ENABLED specifies to ignore this log type
					return;
				}

				switch (logType) {
					case 'error':
						console.error.apply(console, messages);
						break;
					case 'warning':
						console.warn.apply(console, messages);
						break;
					case 'info':
						console.info.apply(console, messages);
						break;
					case 'log':
						console.warn.apply(console, messages);
						break;
					case 'debug':
						console.log.apply(console, messages);
						break;
					default:
						console.warn('Tagmarks Logger - Unknown logType',
							logType);
						console.log.apply(console, argsArray);
				}
			},

			/**
			 * @public
			 * @name logger.jQueryAjaxErrorHandler
			 * @function
			 *
			 * @param {jquery#jqXHR} jqXHR - jQuery XMLHttpRequest (jqXHR)
			 * object, a superset of the browser's native XMLHttpRequest object
			 * @see {@link http://api.jquery.com/jQuery.ajax/#jqXHR}
			 * @param {String} textStatus - Possible values (besides null)
			 * are "timeout", "error", "abort", and "parsererror"
			 * @param {String} errorThrown - When an HTTP error occurs,
			 * errorThrown receives the textual portion of the HTTP status,
			 * such as "Not Found" or "Internal Server Error."
			 */
			jqueryAjaxErrorHandler: function (jqXHR, textStatus, errorThrown) {
				logger.log('logger - jQuery AJAX error handler', {
					jqXHR: jqXHR,
					textStatus: textStatus,
					errorThrown: errorThrown
				}, 'error');
			}
		}

	})();

	// return public interface for module
	return logger;

});





