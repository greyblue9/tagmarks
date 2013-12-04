/**
 * @file tag.js
 * @author David Reilly <greylue9@gmail.com>
 * @see {@link http://github.com/greyblue9/tagmarks}
 */

/** @module tag */
define('tag', ['jquery'], function($) {
	'use strict';


	/**
	 * @public
	 * @name Tag
	 * @class
	 *
	 * @param data {Object}
	 * @constructor
	 */
	var Tag = function (data) {
		/** @type {String} */
		this.name = data.name;

		/** @type {String} */
		this.description = 'description' in data ? data.description : '';

		/**
		 * Lower-numbered priorities have higher precedence. For example,
		 * a tag with priority 3 would be displayed before another with
		 * priority 4.
		 * @type {number} */
		this.priority = data.priority;

		/**
		 * Background color used when rendering tag names. Expressed as a
		 * 6-digit hexadecimal string prefixed by '#'
		 * @type {String} */
		this.background_color = data.background_color;

		/**
		 * Text color used when rendering tag names with the tag's
		 * specific background color. Expressed as a 6-digit hexadecimal
		 * string prefixed by '#'
		 * @type {String} */
		this.foreground_color =
			'foreground_color' in data ? data.foreground_color :
				this.DEFAULT_FOREGROUND_COLOR;

		/** @type {String} */
		this.id_name =
			'mime_type' in data ? data.mime_type : 'application/octet-stream';
	};
	/** @constant {String} */
	Tag.prototype.DEFAULT_FOREGROUND_COLOR = '#ffffff';

	// return public interface for module
	return Tag;

});

