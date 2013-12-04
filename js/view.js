/**
 * @file view.js
 * @author David Reilly <greylue9@gmail.com>
 * @see {@link http://github.com/greyblue9/tagmarks}
 */

/** @module view */
define('view', ['jquery','logger','site','tag','state'], function($) {
	'use strict';


	var view = (function(){

		/**
		 * @function
		 * @public
		 * @name view#renderSites
		 */
		var renderSites = function (sites, tagsByIdFunc, siteOrderChangedCallback,
			removeSiteCallback, $container) {

			$container.html('');
			$.each(sites, function (siteIdx, site) {

				var $a = $('<a />');
				$a.attr('href', site.url);
				$a.attr('title', site.name);
				$a.addClass('thumbnail_link');
				$a.attr('tags', site.tags.join(' '));
				$a.attr('site_id', site.id);
				$a.attr('site_idx', siteIdx);
				$a.css('z-index', sites.length - siteIdx);
				$a.disableSelection();

				var $img = $('<img />');
				$img.attr('src', site.thumbnail);
				$img.attr('title', site.name);
				$img.disableSelection();

				if ($img.get(0).complete) {
					$img.trigger('load');
				}

				var $tagStrip = $('<div class="tag_strip" />');
				$.each(site.tags, function (tagIdx, tagIdName) {

					var tag = tagsByIdFunc(tagIdName);
					var $tag = $('<div class="tag" />');
					$tag.text(tag.name);
					$tag.css('background-color', tag.background_color);
					if ('foreground_color' in tag) {
						$tag.css('color', tag.foreground_color);
					}
					$tagStrip.append($tag);

				});

				var $label = $('<span class="label"><span>' + htmlEntities(site.name) + '</span></span>');
				var $controls = $('' + '<div class="controls">' + '  <div class="remove">&nbsp;</div>' + '  <div class="edit">&nbsp;</div>' + '</div>');

				$controls.find('> .remove').on('click', function (event) {
					event.preventDefault();
					View.Dialogs.RemoveSite.show($a, site, removeSiteCallback);
				});

				$a.append($img);
				$a.append($label);
				$a.append($controls);
				$a.append($tagStrip);

				$container.append($a);
			});

			$container.sortable({
				revert: false,
				containment: 'parent',
				helper: 'clone',
				opacity: 0.5,
				scroll: true,
				zIndex: 200,
				tolerance: "pointer",
				stop: siteOrderChangedCallback
			});

			$container.disableSelection();

		}; // renderSites()

		/**
		 * @function
		 * @public
		 * @name view#renderTags
		 */
		var renderTags = function (tags, selectedTagsChangedCallback, $container) {

			$container.html('');

			$.each(tags, function (idx, tag) {
				// Make new tag
				var $tag = $('<div class="tag">' + tag.name + '</div>');

				// Set CSS background color
				$tag.css('background-color', tag.background_color);
				// Can calculate "deselected" color now that CSS bg color is set
				var color_rgb_str = $tag.css('background-color');
				var color_rgb = TagmarksUtils.css_color_string_to_rgb(color_rgb_str); // [r,g,b]
				var color_hsl = // color_hsl is 3 values in range 0-1
					TagmarksUtils.rgbToHsl(color_rgb[0], color_rgb[1],
						color_rgb[2]);
				var dark_color_rgb = TagmarksUtils.hslToRgb(color_hsl[0],
					color_hsl[1], color_hsl[2] * .53);
				// Final result (darkened color for "deselected" state)
				var dark_color_str = 'rgb(' + dark_color_rgb.join(',') + ')'; // rgb(x,y,z)

				if ('foreground_color' in tag) {
					$tag.css('color', tag.foreground_color);
				}

				$tag.attr('tag', tag.id_name);
				$tag.attr('sel_color', tag.background_color);
				$tag.attr('desel_color', dark_color_str);

				// Tag class/color selected toggle
				$tag.on('click', function () {
					$tag.trigger('setSelectedState', !$tag.hasClass('selected'));
					selectedTagsChangedCallback();
				});

				$tag.on('setSelectedState', function (event, selected) {
					if (selected) {
						$tag.addClass('selected');
						$tag.css('background-color', $tag.attr('sel_color'));
					} else {
						$tag.removeClass('selected');
						$tag.css('background-color', $tag.attr('desel_color'));
					}
				});

				$tag.trigger('setSelectedState', false);

				// Insert tag into container element (dials container)
				$container.append($tag);

			});
		} // renderTags();

		/**
		 * @public
		 * @name model~viewport
		 * @namespace
		 */
		var viewport = (function () {

			var outerMarginTotal = null;
			var outerMarginWidth = null;
			var thumbnailSepSize = null;
			var sitesContainerMinWidth = null; // size limited by scrollbar

			var windowInnerHeight = null;
			var windowInnerHeight_last = null;
			var availHeightChangeTotal = 0;
			var timeoutActive = false;

			var onFindOpenedCallback = null;
			var onFindDismissedCallback = null;

			var recalculate = function () {
				var $body = $('body');
				$body.css('overflow', 'scroll');
				sitesContainerMinWidth = $sitesContainer.innerWidth();

				$body.css('overflow', 'auto');
				outerMarginTotal = $body.outerWidth(true) - $body.width();
				outerMarginWidth = Math.floor(outerMarginTotal / 2);
				thumbnailSepSize = outerMarginWidth;

				windowInnerHeight_last = windowInnerHeight;
				windowInnerHeight = $(window).innerHeight();
				var availHeightChange;
				if (windowInnerHeight_last === null) {
					availHeightChange = 0;
				} else {
					availHeightChange = windowInnerHeight - windowInnerHeight_last;
				}
				availHeightChangeTotal += availHeightChange;
				if (!timeoutActive) {
					timeoutActive = true;
					setTimeout(function () {
						availHeightChangeTotal = 0;
						timeoutActive = false;
					}, 1500);
				}
				// Firefox find bar was 31px on my machine

				logger.log('availHeightChangeTotal', availHeightChangeTotal,
					'debug');
				if (availHeightChangeTotal >= 29 && availHeightChangeTotal <= 33) {
					// Firefox "find" bar dismissed
					if (typeof onFindDismissedCallback == 'function') {
						onFindDismissedCallback();
					}
				} else if (availHeightChangeTotal >= -33 && availHeightChangeTotal <= -29) {
					// Firefox "find" bar opened
					if (typeof onFindOpenedCallback == 'function') {
						onFindOpenedCallback();
					}
				}
			};

			return {
				/**
				 * @function
				 */
				onResize: function () {
					recalculate();

					var $firstRenderedThumb = $('a.thumbnail_link:first');
					var thumbBorderWidthTotal = $firstRenderedThumb.outerWidth(false) - $firstRenderedThumb.innerWidth();

					var thumbWidth = Math.floor((
						sitesContainerMinWidth - (thumbBorderWidthTotal * Defaults.ThumbnailSize.width) - (thumbnailSepSize * (Defaults.ThumbsPerRow - 1)) - (outerMarginWidth * 2)
						) / Defaults.ThumbsPerRow);

					if (thumbWidth >= Defaults.ThumbnailSize.width) {
						thumbWidth = Defaults.ThumbnailSize.width;
					}

					var thumbHeight = (Defaults.ThumbnailSize.height / Defaults.ThumbnailSize.width) * thumbWidth;

					var $thumbnailLinks = $('a.thumbnail_link');
					$thumbnailLinks.css({
						width: thumbWidth + 'px',
						height: thumbHeight + 'px'
					});
				},

				/**
				 * @function
				 * @param {function()} findOpenedCallback
				 * @param {function()} findDismissedCallback
				 */
				setFindTextBarCallbacks: function (findOpenedCallback,
					findDismissedCallback) {

					onFindOpenedCallback = findOpenedCallback;
					onFindDismissedCallback = findDismissedCallback;
				}
			}

		})(); // viewport


		/**
		 * @private
		 * @name view~tagIndicators
		 * @namespace
		 */
		var tagIndicators = (function () {

			var locks = 0;

			return {
				hide: function (noAnimation) {
					if (locks > 0) return;

					if (noAnimation) {
						$('.tag_strip').hide();
						$('a.thumbnail_link').css('margin-bottom', 0);
						return;
					}

					$('.tag_strip').slideUp(500, 'swing');
					$('a.thumbnail_link').animate({
						marginBottom: 0
					}, 500, 'swing');
				},

				show: function (noAnimation) {
					if (locks > 0) return;

					if (noAnimation) {
						$('.tag_strip').show();
						$('a.thumbnail_link').css('margin-bottom', '20px');
						return;
					}

					$('a.thumbnail_link').animate({
						marginBottom: '20px'
					}, 500, 'swing');
					$('.tag_strip').slideDown(500, 'swing');
				},

				visible: function () {
					return $('.tag_strip:first').is(':visible');
				},

				lock: function () {
					locks++;
				},

				unlock: function () {
					locks--;
				}
			}

		})(); // tagIndicators

		/**
		 * @name view#removeSiteDialog
		 * @public
		 * @namespace
		 */
		var removeSiteDialog = (function () {
			return {
				show: function ($a, site, removeSiteCallback) {
					var result = confirm("Are you sure you want to remove this site?\n\n" + site.name);
					if (result) {
						$a.remove();
						removeSiteCallback(site);
					}
				}
			}
		})();

		/**
		 * @name view#addEditSiteDialog
		 * @public
		 * @namespace
		 */
		var addEditSiteDialog = (function () {
			var $dialog = null;
			var onDialogSizeChanged = function () {
				$dialog.css('margin-top',
					(0 - Math.floor($dialog.height() / 2)) + 'px');
			};

			return {
				/**
				 * @public
				 * @name view#addEditSiteDialog#show
				 * @param tags
				 * @param resizeUploadIframeCallback
				 * @param {object} site [optional]
				 */
				show: function (tags, resizeUploadIframeCallback, site) {

					$dialog = $('#add_site_dialog');

					var $tagsContainer = $dialog.find('.tags_container');
					$tagsContainer.html('');

					$.each(tags, function (tagIdx, tag) {
						var $tag = $('<span class="tag" />');
						var $checkbox = $('<input type="checkbox" />');
						$checkbox.attr('tag_id_name', tag.id_name);

						if (tagIdx == 0) {
							$checkbox.attr('checked', 'checked');
						}

						var $label = $('<span>' + tag.name + '</span>');
						$tag.append($checkbox);
						$tag.append($label);

						$tag.css('background-color', tag.background_color);
						if ('foreground_color' in tag) {
							$tag.css('color', tag.foreground_color);
						}

						$tagsContainer.append($tag);
					});

					$dialog.show();

					resizeUploadIframeCallback();
					onDialogSizeChanged();
				},

				/**
				 * @public
				 * @name view#addEditSiteDialog#dismiss
				 */
				dismiss: function () {
					$dialog.hide();
				},

				/**
				 * @public
				 * @name view#addEditSiteDialog#setSelectedImage
				 * @param {string} imageUrl - Full URL to thumbnail image,
				 *      starting with protocol (http:// or https:// if required)
				 */
				setSelectedImage: function (imageUrl) {
					var $selectedImageContainer = $('#current_thumbnail_container');
					$selectedImageContainer.html('');

					var $img = $('<img />');
					$img.attr('src', imageUrl);
					$img.css('max-width', Defaults.ThumbnailSize.width);
					$img.css('max-height', Defaults.ThumbnailSize.height);
					$img.on('load', onDialogSizeChanged);

					$selectedImageContainer.append($img);

					if ($img.get(0).complete) $img.trigger('load');
				}
			}

		})(); // addEditSiteDialog


		// public interface for view
		return {
			// namespaces
			addEditSiteDialog: addEditSiteDialog,

			removeSiteDialog: removeSiteDialog,

			viewport: viewport,


			// functions
			renderSites: renderSites,

			renderTags: renderTags,

			/**
			 * @function
			 * @public
			 * @name view#getSiteIdsByOnscreenOrder
			 */
			getSiteIdsByOnscreenOrder: function () {
				var siteIdsOrdered = [];
				$sitesContainer.find('a.thumbnail_link').each(function (idx,
					siteElement) {
					var $site = $(siteElement);
					var siteId = $site.attr('site_id');
					siteIdsOrdered.push(siteId);
				});
				return siteIdsOrdered;
			},

			/**
			 * @function
			 * @public
			 * @name view#applyState
			 * @param {State} state
			 */
			applyState: function (state) {
				var $sites = $sitesContainer.find('a.thumbnail_link');
				$sites.hide();

				$tagsContainer.find('.tag').each(function () {
					var $tag = $(this);
					var tagId = $tag.attr('tag');
					var selected = ($.inArray(tagId,
						state.selectedTagIds) != -1);
					$tag.trigger('setSelectedState', selected);

					if (selected) {
						$sites.filter('[tags~="' + tagId + '"]').show();
					}
				});
			},

			/**
			 * @function
			 * @public
			 * @name view#getState
			 * @returns {State}
			 */
			getState: function () {
				var selectedTagIds = [];
				$tagsContainer.find('.tag.selected').each(function () {
					selectedTagIds.push($(this).attr('tag'));
				});

				return {
					selectedTagIds: selectedTagIds
				}
			},

			/**
			 * @function
			 * @public
			 * @name view#init
			 */
			init: function () {
				// TODO: View initialization
			}
		}

	})();

	// return public interface for module
	return view;

});

