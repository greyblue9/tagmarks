/**
 * @file site.js
 * @author David Reilly <greylue9@gmail.com>
 * @see {@link http://github.com/greyblue9/tagmarks}
 */

/** @module site */
define('site', ['jquery'], function($) {
	'use strict';


	/**
	 * @public
	 * @name Site
	 * @class
	 *
	 * @param data {Object}
	 * @constructor
	 */
	var Site = function (data) {

		/** @type {String} */
		this.name = data.name;

		/** @type {String} */
		this.url = data.url;

		/** @type {String} */
		this.thumbnail = data.thumbnail;

		/** @type {number} */
		this.width = data.width;

		/** @type {number} */
		this.height = data.height;

		/** @type {String} */
		this.mime_type =
			'mime_type' in data ? data.mime_type : 'application/octet-stream';

		/** @type {String[]} */
		this.tags = data.tags;

		/** @type {number} */
		this.id = data.id;

		/** @type {number} */
		this.order = 'order' in data ? data.order : this.DEFAULT_ORDER;
	};
	/** @constant {number} */
	Site.prototype.DEFAULT_ORDER = 32767;

	// return public interface for module
	return Site;

});

