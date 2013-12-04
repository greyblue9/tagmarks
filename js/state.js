/**
 * @file state.js
 * @author David Reilly <greylue9@gmail.com>
 * @see {@link http://github.com/greyblue9/tagmarks}
 */

/** @module state */
define('state', ['jquery'], function($) {
	'use strict';


	/**
	 * @public
	 * @name State
	 * @class
	 *
	 * @class State
	 * @param data {Object}
	 * @constructor
	 */
	var State = function (data) {
		/**
		 * Array of tag ids
		 * @see {Tag.id}
		 * @type {String[]} */
		this.selectedTagIds = data.selectedTagIds;
	};

	// return public interface for module
	return State;

});

