

$(document).ready(function () {

	if ($('html').attr('page') == 'index') {
		Tagmarks.init();
	}

});


var Tagmarks = (function () {

	var htmlEntities = function(str) {
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	};

	var Logger = (function () {
		var LOGGING_ENABLED = true;

		var LOG_TYPES_ALL = ['error', 'warning', 'info', 'log', 'debug'];
		var LOG_TYPES_ENABLED = ['error', 'warning', 'info', 'log', 'debug'];

		return {
			/**
			 * Log to console, if LOGGING_ENABLED = true and specified log type
			 * is enabled (see LOG_TYPES_ENABLED). If not specified, assumes
			 * log type of "log"
			 *
			 * @var [Array] message (all except last argument unless only one
			 *      argument is supplied or last argument is not one of the
			 *      recognized log types in LOG_TYPES_ALL)
			 * @var string logType Log type/severity (last argument)
			 */
			log: function () {
				if (LOGGING_ENABLED !== true || typeof console != 'object') return;

				var argsArray = $.makeArray(arguments);
				var logItems = argsArray.slice(0, argsArray.length - 1);
				var logType = argsArray[argsArray.length - 1];

				if (typeof logType === 'undefined') {
					// Default log type
					logType = 'log';
				}

				if (!$.inArray(logType, LOG_TYPES_ALL)) {
					// Last argument is a log item, not the log type to use
					logType = 'log';
					logItems = argsArray;
				}

				if (!$.inArray(logType, LOG_TYPES_ENABLED)) {
					// LOGS_ENABLED specifies to ignore this log type
					return;
				}

				switch (logType) {
					case 'error':
						console.error.apply(console, logItems);
						break;
					case 'warning':
						console.warn.apply(console, logItems);
						break;
					case 'info':
						console.info.apply(console, logItems);
						break;
					case 'log':
						console.warn.apply(console, logItems);
						break;
					case 'debug':
						console.log.apply(console, logItems);
						break;
					default:
						console.warn('Tagmarks Logger - Unknown logType',
							logType);
						console.log.apply(console, argsArray);
				}
			},

			jqueryAjaxErrorHandler: function (jqXHR, textStatus, errorThrown) {
				Logger.log('Tagmarks Logger jQuery AJAX error handler', {
					jqXHR: jqXHR,
					textStatus: textStatus,
					errorThrown: errorThrown
				}, 'error');
			}
		}

	})();

	var Defaults = {
		ThumbnailSize: {width: 319, height: 179},
		ThumbsPerRow: 5
	};

	var Model = (function() {

		var Sites = (function () {

			var sites = [];

			var sort = function () {
				sites.sort(function (a, b) {

					if ('order' in a && 'order' in b) {
						return a.order < b.order ? -1 :
							(a.order == b.order ? 0 : 1);
					}

					$.each([
						a, b
					], function (cmpIdx, cmpSite) {
						cmpSite.bestTagIdName = null;
						cmpSite.bestTagPriority = -1;

						$.each(cmpSite.tags,
							function (cmpSiteTagIdx, cmpSiteTagIdName) {
								var tag = Tags.getTagByIdName(cmpSiteTagIdName);
								if (tag.priority > cmpSite.bestTagPriority) {
									cmpSite.bestTagIdName = tag.id_name;
									cmpSite.bestTagPriority = tag.priority;
								} else if (tag.priority == cmpSite.bestTagPriority && tag.id_name > cmpSite.bestTagIdName) {
									cmpSite.bestTagIdName = tag.id_name;
									cmpSite.bestTagPriority = tag.priority;
								} else {
									return;
								}
							});
					});

					if (a.bestTagIdName == b.bestTagIdName) {
						// both sites have same highest-priority tag
						// sort by site name alphabetically
						return a.name < b.name ? -1 :
							(a.name == b.name ? 0 : 1);
					}

					if (a.bestTagPriority < b.bestTagPriority) {
						return -1;
					} else if (b.bestTagPriority < a.bestTagPriority) {
						return 1;
					} else if (a.bestTagPriority == b.bestTagPriority) {
						// Sites' best tags each have same priority
						// Sort based on alphabetically first tag
						return a.bestTagIdName < b.bestTagIdName ? -1 : 1;
					} else {
						Logger.log('Unknown site sorting condition',
							'Comparison values:', a, b, 'error');
						return 0;
					}
				});
			};

			var generateId = function () {
				return Math.floor(Math.random() * 89999999) + 10000000;
			};

			var save = function () {
				$.ajax({
					url: 'state.php',
					type: 'POST',
					data: JSON.stringify({
						sites: sites
					}),
					contentType: 'application/json',
					success: function (data, textStatus, jqXHR) {
						Logger.log('Save sites success', data, 'debug');
					},
					error: Logger.jqueryAjaxErrorHandler
				});
			};

			return {
				set: function (sitesData) {
					sites = sitesData;
					sort();
				},
				get: function () {
					return sites;
				},
				save: function () {
					save();
				}
			}

		})();

		var Tags = (function () {
			var tags = [];

			var sort = function () {
				tags.sort(function (a, b) {
					if (a.priority < b.priority) {
						return -1;
					} else if (b.priority < a.priority) {
						return 1;
					} else if (a.priority == b.priority) {
						// Sites' best tags each have same priority
						// Sort based on alphabetically first tag
						return a.name < b.name ? -1 : 1;
					} else {
						Tagmarks.Logger.log('Unknown site sorting condition',
							'Comparing tags:', a, b, 'error');
						return 0;
					}
				});
			};

			var tagsById = null; // Lazy-loaded first time getTagsByIdNames() is called

			/**
			 * Get object mapping all tag id_names to tag entries
			 */
			var getTagsByIdNames = function () {
				if (tagsById === null) {
					tagsById = {};
					$.each(tags, function (tagIdx, tag) {
						tagsById[tag.id_name] = tag;
					});
				}

				return tagsById;
			};

			return {
				set: function (tagsData) {
					tags = tagsData;
					sort();
				},
				get: function () {
					return tags;
				},
				getIds: function() {
					return tags.map(function(tag) {
						return tag.id_name
					});
				},
				save: function () {
					// TODO: Implement
				},
				getTagByIdName: function (tagIdName) {
					if (tagIdName in getTagsByIdNames()) {
						return getTagsByIdNames()[tagIdName];
					} else {
						Logger.log('Tag not found with id_name: "' + tagIdName + '"',
							'error');
						return {};
					}
				}
			}

		})();

		var Settings = (function () {
			var settings = {};
			return {
				set: function (settingsData) {
					settings = settingsData;
				},
				get: function () {
					return settings;
				}
			}
		})();

		var State = (function () {

			var state = {
				selectedTagIds: []
			};

			return {
				set: function (stateData) {
					$.each(stateData, function(key, val) {
						if (key in state) {
							state[key] = val;
						} else {
							Logger.log('Model.State.set - Unrecognized state data key:', key, 'warning');
						}
					});
				},
				get: function () {
					return state;
				},
				save: function () {
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
				}
			}

		})();

		return {
			Settings: Settings,
			Sites: Sites,
			Tags: Tags,
			State: State,

			init: function(pSettings, pSites, pTags) {
				Settings.set(pSettings);
				Sites.set(pSites);
				Tags.set(pTags);
			}
		}

	})();

	var View = (function () {

		var $sitesContainer = null;
		var $tagsContainer = null;

		var renderSites = function (sites, tagsByIdFunc, siteOrderChangedCallback, $container) {

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

				var $label = $('<span class="label"><span>'+ htmlEntities(site.name)+'</span></span>');
				$a.append($label);

				$a.append($img);
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

		}; // render()

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
		};

		var Viewport = (function () {

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
					setTimeout(function() {
						availHeightChangeTotal = 0;
						timeoutActive = false;
					}, 1500);
				}
				// Firefox find bar was 31px on my machine

				Logger.log('availHeightChangeTotal', availHeightChangeTotal, 'debug');
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
				onResize: function() {
					recalculate();

					var $firstRenderedThumb = $('a.thumbnail_link:first');
					var thumbBorderWidthTotal = $firstRenderedThumb.outerWidth(false) - $firstRenderedThumb.innerWidth();

					var thumbWidth = Math.floor(
						(
							sitesContainerMinWidth
							- (thumbBorderWidthTotal * Defaults.ThumbnailSize.width)
							- (thumbnailSepSize * (Defaults.ThumbsPerRow - 1))
							- (outerMarginWidth * 2)
						)
						/ Defaults.ThumbsPerRow
					);

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

				setFindTextBarCallbacks: function(findOpenedCallback, findDismissedCallback) {
					onFindOpenedCallback = findOpenedCallback;
					onFindDismissedCallback = findDismissedCallback;
				}
			}

		})();

		var TagIndicators = (function () {

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

		})();

		var Dialogs = {

			AddSite: (function () {

				var $dialog = null;

				var onDialogSizeChanged = function() {
					$dialog.css('margin-top',
						(0 - Math.floor($dialog.height() / 2)) + 'px');
				};

				return {
					show: function (tags, resizeUploadIframeCallback) {

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

					dismiss: function () {
						$dialog.hide();
					},

					setSelectedImage: function(imageUrl) {
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

			})()

		};

		return {
			Sites: {
				render: function(sites, tagsByIdFunc, siteOrderChangedCallback) {
					renderSites(sites, tagsByIdFunc, siteOrderChangedCallback, $sitesContainer);
				},

				getSiteIdsByOnscreenOrder: function() {
					var siteIdsOrdered = [];
					$sitesContainer.find('a.thumbnail_link').each(function(idx, siteElement) {
						var $site = $(siteElement);
						var siteId = $site.attr('site_id');
						siteIdsOrdered.push(siteId);
					});
					return siteIdsOrdered;
				}
			},
			Tags: {
				render: function(tags, selectedTagsChangedCallback) {
					renderTags(tags, selectedTagsChangedCallback, $tagsContainer);
				}
			},
			Dialogs: Dialogs,

			State: {
				set: function(state) {
					var $sites = $sitesContainer.find('a.thumbnail_link');
					$sites.hide();

					$tagsContainer.find('.tag').each(function() {
						var $tag = $(this);
						var tagId = $tag.attr('tag');
						var selected = ($.inArray(tagId, state.selectedTagIds) != -1);
						$tag.trigger('setSelectedState', selected);

						if (selected) {
							$sites.filter('[tags~="'+tagId+'"]').show();
						}
					});
				},
				get: function() {
					var selectedTagIds = [];
					$tagsContainer.find('.tag.selected').each(function() {
						selectedTagIds.push($(this).attr('tag'));
					});

					return {
						selectedTagIds: selectedTagIds
					}
				}
			},

			Viewport: Viewport,

			init: function() {
				$sitesContainer = $('#center');
				$tagsContainer = $('#tag_nav_area');
			}
		}

	})();





	var setButtonEventHandlers = function() {

		var $addSiteDialog = $('#add_site_dialog');
		var $controlsArea = $('#controls_area');

		$addSiteDialog.find('.button.cancel').on('click', function () {
			View.Dialogs.AddSite.dismiss();
		});

		$addSiteDialog.find('.button.save').on('click', function () {
			var siteName = View.Dialogs.AddSite.getSiteName();
			var siteUrl = View.Dialogs.AddSite.getSiteName();
			var siteTagIds = View.Dialogs.AddSite.getSiteTagIds();
			var siteThumbnailUrl = View.Dialogs.AddSite.getSiteThumbnailUrl();

			// TODO: Add new site to model (should trigger save)
		});

		$controlsArea.find('.button.add_site').on('click', function () {
			View.Dialogs.AddSite.show(
				Model.Tags.get(),
				function() {
					$addSiteDialog.find('iframe').get(0).contentWindow.TagmarksUploadFrame.resize();
				}
			);
		});

		var findStarted = function() {
			$('body').addClass('searching');
		};
		var findStopped = function() {
			$('body').removeClass('searching');
		};
		View.Viewport.setFindTextBarCallbacks(findStarted, findStopped);

		$(window).on('keydown', function (e) {
			var ck = e.keyCode ? e.keyCode : e.which;
			if (e.ctrlKey && ck == 70) { // Ctrl+F
				findStarted();
			} else if (ck == 27) { // Escape key
				findStopped();
			}
		});
	};

	var onSelectedTagsChanged = function () {
		var state = View.State.get();
		Model.State.set(state);
		View.State.set(state);

		Model.State.save();
	};

	var onSiteOrderChanged = function () {
		var siteIdsByOnscreenOrder = View.Sites.getSiteIdsByOnscreenOrder();

		var sites = Model.Sites.get();

		var orderByNumericSiteId = {};
		$.each(siteIdsByOnscreenOrder, function (orderIdx, siteId) {
			orderByNumericSiteId[Number(siteId)] = orderIdx;
		});

		$.each(sites, function (siteIdx, site) {
			var siteOrderIdx = orderByNumericSiteId[site.id];
			site.order = siteOrderIdx;
		});

		Model.Sites.set(sites);
		Model.Sites.save();

		Logger.log('New site order', 'siteIdsByOnscreenOrder:',
			siteIdsByOnscreenOrder, 'debug');
	};

	var onResponseReceived = function (response, whichResponse) {

		if (whichResponse == 'dataResponse' || whichResponse == 'stateResponse') {
			this[whichResponse] = response;
		}

		if (!('dataResponse' in this) || !('stateResponse' in this)) return;

		var dataResponse = this['dataResponse'];
		var stateResponse = this['stateResponse'];

		// Both responses (data + state) loaded
		Model.init(dataResponse.settings, dataResponse.sites, dataResponse.tags);

		var state;
		if ('errorIdName' in stateResponse && stateResponse.errorIdName == 'NoSavedState') {
			// No saved state
			state = {
				selectedTagIds: Model.Tags.getIds()
			};
		} else {
			// Saved state data retrieved
			state = stateResponse.state;
		}
		Model.State.set(state);

		setButtonEventHandlers();

		View.init();

		View.Tags.render(Model.Tags.get(), onSelectedTagsChanged);
		View.Sites.render(Model.Sites.get(), Model.Tags.getTagByIdName,
			onSiteOrderChanged);
		View.State.set(Model.State.get());

		$(window).on('resize', View.Viewport.onResize);
		$(window).trigger('resize');
	};

	// Tagmarks public interface
	return {
		getSites: function() {
			return Model.Sites.get();
		},
		getTags: function() {
			return Model.Tags.get();
		},
		getSettings: function() {
			return Model.Settings.get();
		},
		getState: function() {
			return Model.State.get();
		},

		// Called from upload iframe when iframe loads POST response
		handleUpload: function(uploadInfo) {
			Logger.log('Upload received from iframe', 'uploadInfo:', uploadInfo, 'debug');
			View.Dialogs.AddSite.setSelectedImage(uploadInfo.upload_url);
		},

		init: function () {

			$.ajax({
				url: 'data.php',
				type: 'GET',
				data: {format: 'json'},
				dataType: 'json',
				success: function (response) {
					onResponseReceived(response, 'dataResponse');
				},
				error: Logger.jqueryAjaxErrorHandler
			});

			$.ajax({
				url: 'state.php',
				type: 'GET',
				data: {},
				success: function(response) {
					onResponseReceived(response, 'stateResponse');
				},
				error: Logger.jqueryAjaxErrorHandler
			});

		}
	}

})();
