/**
 * @file model.js
 * @author David Reilly <greylue9@gmail.com>
 * @see {@link http://github.com/greyblue9/tagmarks}
 */

/**
 * @name model
 * @namespace
 */
define('model', ['jquery','logger','site','tag','settings','state','tmpl'],
	function($, logger, Site, Tag, Settings, State, tmpl) {
	'use strict';

	var model = (function () {

		/**
		 * @public
		 * @property
		 * @name model#tags
		 * @type {Tag[]} */
		var tags = [];

		/**
		 * @public
		 * @property
		 * @name model#sites
		 * @type {Site[]} */
		var sites = [];

		/**
		 * @public
		 * @name model#settings
		 * @type {Settings} */
		var settings = new Settings({});

		/**
		 * @public
		 * @name model#state
		 * @type {State} */
		var state = new State({});

		/**
		 * Object mapping tag_id => Tag
		 * Initialized during tag data load
		 * @private
		 * @type {Object}
		 */
		var tagsById = {};

		/**
		 * @public
		 * @name model#getTagById
		 * @param {String} tagId
		 * @returns {Tag}
		 * @function
		 */
		var getTagById = function(tagId) {
			return tagsById[tagId];
		};


		/**
		 * Sorter for array of Sites; Sorts first on Site.order, then by the
		 * site having the tag with the highest precedence (Tag.priority), then
		 * alphabetically in the case of matching high-precedence tags, and
		 * finally sorts alphabetically by site name.
		 * @param {Site} a
		 * @param {Site} b
		 * @returns {number}
		 *      -1 if a comes first in precedence,
		 *      1 if b comes first in precedence,
		 *      0 if equal precedence
		 */
		var siteSorter = function(a, b) {
			if (a.order != b.order) {
				return a.order < b.order ? -1 : 1;
			}

			/**
			 * @param {Site} site
			 * @returns {Tag}
			 */
			var getBestTagForSite = function(site) {
				/** @type {Tag} */
				var bestTagForSite = null;
				$.each(site.tags, function(idx, tagId) {
					var tag = getTagById(tagId);
					if (bestTag === null) {
						bestTag = tag;
					} else if (tag.priority > bestTag.priority) {
						bestTag = tag;
					} else if (tag.priority == bestTag.priority) {
						bestTag = tag;
					} else {
						return;
					}
				});
				return bestTagForSite;
			}

			var bestTagFromSiteA = getBestTagForSite(a);
			var bestTagFromSiteB = getBestTagForSite(b);

			if (bestTagFromSiteA.id_name == bestTagFromSiteB.id_name) {
				// both sites have same highest-priority tag
				// sort by site name alphabetically
				return a.name < b.name ? -1 : (a.name == b.name ? 0 : 1);
			} else if (bestTagFromSiteA.priority < bestTagFromSiteB.priority) {
				return -1;
			} else if (bestTagFromSiteB.priority < bestTagFromSiteA.priority) {
				return 1;
			} else if (bestTagFromSiteA.priority == bestTagFromSiteB.priority) {
				// Sites' best tags each have same priority
				// Sort based on alphabetically first tag
				return bestTagFromSiteA.name < bestTagFromSiteB.name ? -1 : 1;
			} else {
				logger.log('Unknown site sorting condition',
					'Comparison values:', a, b, 'error');
				return 0;
			}
		}; // siteSorter()


		var sortSites = function() {
			sites.sort(siteSorter);
		};

		var generateSiteId = function () {
			return Math.floor(Math.random() * 89999999) + 10000000;
		};

		var saveSites = function () {
			$.ajax({
				url: 'state.php',
				type: 'POST',
				data: JSON.stringify({
					sites: sites
				}),
				contentType: 'application/json',
				success: function (data, textStatus, jqXHR) {
					logger.log('Save sites success', data, 'debug');
				},
				error: logger.jqueryAjaxErrorHandler
			});
		};

		/**
		 * Sorter for array of Tags
		 * @param {Tag} a
		 * @param {Tag} b
		 * @returns {number}
		 *      -1 if a comes first in precedence,
		 *      1 if b comes first in precedence,
		 *      0 if equal precedence
		 */
		var tagSorter = function(a, b) {
			if (a.priority < b.priority) {
				return -1;
			} else if (b.priority < a.priority) {
				return 1;
			} else if (a.priority == b.priority) {
				// Sites' best tags each have same priority
				// Sort based on alphabetically first tag
				return a.name < b.name ? -1 : 1;
			} else {
				logger.log('Unknown site sorting condition',
					'Comparing tags:', a, b, 'error');
				return 0;
			}
		};

		var sortTags = function() {
			tags.sort(tagSorter);
		};

		var saveState = function () {
			$.ajax({
				url: 'state.php',
				type: 'POST',
				data: JSON.stringify({
					state: state
				}),
				contentType: 'application/json',
				success: function (data, textStatus, jqXHR) {
					Logger.log('saveState success', data, 'debug');
				},
				error: Logger.jqueryAjaxErrorHandler
			});
		};



		/**
		 * Creates Tag/Site/Settings instance(s) using the dataset received
		 * from the server and inserts them into the model.
		 *
		 * @param {Object} response - An object whose keys (tags, sites, and
		 * optionally, settings) contain array or object representations of
		 * those entities in the user's main Tagmarks dataset
		 * @param {Object[]} response.tags - Array of objects containing raw
		 * data for each tag
		 * @param {Object[]} response.sites - Array of objects containing raw
		 * data for each site
		 * @param {Object} [response.settings] - Object mapping recognized
		 * settings keys to their corresponding values as set according to the
		 * user's preferences or environment.
		 */
		var onDataReceived = function (response) {
			$.each(response.tags, function (tagIdx, tagData) {
				var tag = new Tag(tagData);
				tags.push(tag);
				tagsById[tag.id_name] = tag;
			})

			$.each(response.sites, function (siteIdx, siteData) {
				sites.push(new Site(siteData));
			})

			if ('settings' in response) {
				settings = new Settings(response.settings);
			}

			logger.log('Main dataset loaded',
				{tags: tags, sites: sites, settings: settings}, 'info');

			var result = tmpl('tmpl-site', sites[0]);
			logger.log(result, 'info');
		};

		/**
		 * Creates a State instance using the state data received from the
		 * server and inserts it into the model.
		 *
		 * @param {Object} response
		 */
		var onStateReceived = function (response) {
			state = new State(response.state);

			logger.log('State data loaded', {state: state}, 'info');
		};


		return {
			tags: tags,
			sites: sites,
			settings: settings,
			state: state,

			/**
			 * @public
			 * @name model#loadData
			 * @function
			 */
			loadData: function () {
				logger.log('Loading main dataset...', 'debug');
				$.ajax({
					url: 'data.php',
					type: 'GET',
					data: {format: 'json'},
					dataType: 'json',
					success: onDataReceived,
					error: logger.jqueryAjaxErrorHandler
				});
			},

			/**
			 * @public
			 * @name model#loadState
			 * @function
			 */
			loadState: function () {
				logger.log('Loading state data...', 'debug');
				$.ajax({
					url: 'state.php',
					type: 'GET',
					data: {},
					success: onStateReceived,
					error: logger.jqueryAjaxErrorHandler
				});
			}
		}
	})();

	// return public interface for module
	return model;

});

