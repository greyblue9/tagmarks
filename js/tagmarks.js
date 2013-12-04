/**
 * @file tagmarks.js
 * @author David Reilly <greylue9@gmail.com>
 * @see {@link http://github.com/greyblue9/tagmarks}
 */

/**
 * @name tagmarks
 * @namespace
 */
define('tagmarks', ['jquery', 'logger', 'model', 'view'], function($, logger, model, view) {
	'use strict';


	var tagmarks = (function() {


		return {
			/**
			 * A copy of the model for reference or development purposes.
			 *
			 * @public
			 * @type {tagmarks#model}
			 * @property
			 */
			model: model,

			/**
			 * Main invoke point for Tagmarks. Initializes model and view
			 * modules and dispatches the rendering process.
			 *
			 * @public
			 * @name tagmarks#init
			 * @function
			 */
			init: function() {
				model.loadData();
				model.loadState();
			}
		};

		view.addEditSiteDialog

	})();

	// return public interface for module
	return tagmarks;

});

