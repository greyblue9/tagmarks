

$(document).ready(function () {

	if ($('html').attr('page') == 'index') {
		Tagmarks.init();
	}

});

/** @namespace */
var Tagmarks = (function () {

	var htmlEntities = function(str) {
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	};

	var Logger = {
		LOGGING_ENABLED: true,

		LOG_TYPES_ALL: ['error', 'warning', 'info', 'log', 'debug'],
		LOG_TYPES_ENABLED: ['error', 'warning', 'info', 'log', 'debug'],

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
		log: function (message, logType) {

			if (Logger.LOGGING_ENABLED !== true || typeof console != 'object') return;

			var argsArray = $.makeArray(arguments);
			var logItems = argsArray.slice(0, argsArray.length - 1);
			var logType = argsArray[argsArray.length - 1];

			if (typeof logType === 'undefined') {
				// Default log type
				logType = 'log';
			}

			if (!$.inArray(logType, Logger.LOG_TYPES_ALL)) {
				// Last argument is a log item, not the log type to use
				logType = 'log';
				logItems = argsArray;
			}

			if (!$.inArray(logType, Logger.LOG_TYPES_ENABLED)) {
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
					console.warn('Tagmarks Logger - Unknown logType', logType);
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
	};


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
					url: 'data.php',
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

		}());

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

			var tagsById = {}; // Lazy-loaded first time getTagsByIdNames() is called

			/**
			 * Get object mapping all tag id_names to tag entries
			 */
			var getTagsByIdNames = function () {
				return tagsById;
			};

			return {
				set: function (tagsData) {
					tags = tagsData;
					$.each(tags, function (idx, tag) {
						tagsById[tag.id_name] = tag;
					});
					sort();
				},
				get: function () {
					return tags;
				},
				getIds: function () {
					return tags.map(function (tag) {
						return tag.id_name
					});
				},
				save: function () {
					// TODO: Implement
				},
				getTagByIdName: function (tagIdName) {
					if (tagIdName in tagsById) {
						return tagsById[tagIdName];
					} else {
						//Logger.log('Tag not found with id_name: "' + tagIdName + '"',
						//	'error');
						return {};
					}
				}
			}

		}());

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
		}());

		var State = (function () {

			var state = {
				selectedTagIds: []
			};

			return {
				set: function (stateData) {
					$.each(stateData, function (key, val) {
						if (key in state) {
							// state variables for application
							state[key] = val;
						} else {
							Logger.log('Model.State.set - Unrecognized state data key:',
								key, 'warning');
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

		}());

		var URI = {

			tldInfoList: [],
			tldInfoByTLD: {},
			tldMaxWeight: 0,

			normalizeTLD: function (tld) {
				return tld.replace('.', '').toLowerCase();
			},

			/**
			 * @param {string} key
			 * @param {object} obj
			 * @returns {*|null} The value corresponding to obj.key, or NULL
			 *      if key doesn't exist in obj or obj is not an object.
			 */
			_getValIfKey: function (key, obj) {
				return (typeof obj === 'object' && key in obj) ?
					obj[key]: null;
			},

			/**
			 *
			 * @param {Array} pTldInfoList
			 */
			setTLDs: function (pTldInfoList) {
				URI.tldInfoList = pTldInfoList;

				$.each(URI.tldInfoList, function (idx, tldInfo) {
					var normTLD = URI.normalizeTLD(tldInfo.TLD);

					URI.tldInfoByTLD[normTLD] = tldInfo;

					if (tldInfo.Weight > URI.tldMaxWeight) {
						URI.tldMaxWeight = tldInfo.Weight;
					}
				});

				$.each(URI.tldInfoByTLD, function (normTLD, tldInfo) {
					tldInfo.FractionalWeight = tldInfo.Weight / URI.tldMaxWeight;
				});
			},

			getTLDs: function () {
				return URI.tldInfoByTLD;
			},

			getTLD: function (tld) {
				var normTLD = URI.normalizeTLD(tld);
				return URI._getValIfKey(normTLD, URI.tldInfoByTLD);
			},

			getMaxWeight: function () {
				return URI.tldMaxWeight;
			}
		};

		return {
			Settings: Settings,
			Sites: Sites,
			Tags: Tags,
			State: State,
			URI: URI,

			init: function(pSettings, pSites, pTags, pTlds) {
				Settings.set(pSettings);
				Sites.set(pSites);
				Tags.set(pTags);
				URI.setTLDs(pTlds);
			}
		}

	}());

	var View = (function () {

		var $sitesContainer = $('#center');
		var $tagsContainer = $('#tag_nav_area');

		var renderSites = function (sites, tagsByIdFunc, siteOrderChangedCallback, removeSiteCallback, $container) {

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
				var $controls = $(''
					+'<div class="controls">'
					+'  <div class="remove">&nbsp;</div>'
					+'  <div class="edit">&nbsp;</div>'
					+'</div>'
				);

				$controls.find('> .remove').on('click', function(event) {
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

		}; // render()

		var renderTags = function (tags, selectedTagIds, selectedTagsChangedCallback, $container) {

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


				$tag.trigger('setSelectedState', $.inArray(tag.id_name, selectedTagIds) !== -1? true: false);

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

					var $sitesContainer = $('#center');

					var $webSearchBar = $('#web_search_bar');
					$webSearchBar.css('width', $sitesContainer.width()+'px');
					$webSearchBar.css('overflow', 'visible');
				},

				setFindTextBarCallbacks: function(findOpenedCallback, findDismissedCallback) {
					onFindOpenedCallback = findOpenedCallback;
					onFindDismissedCallback = findDismissedCallback;
				}
			}

		}());

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

		}());

		var Dialogs = {

			RemoveSite: (function() {
				return {
					show: function($a, site, removeSiteCallback) {
						var result = confirm("Are you sure you want to remove this site?\n\n"
							+site.name);
						if (result) {
							$a.remove();
							removeSiteCallback(site);
						}
					}
				}
			}()),

			AddEditSite: (function () {

				var $dialog = null;

				var onDialogSizeChanged = function() {
					$dialog.css('margin-top',
						(0 - Math.floor($dialog.height() / 2)) + 'px');
				};

				return {
					/**
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

						var $iframeContainer = $('upload_frame_container');
						var $iframe = $iframeContainer.find('> iframe');
						if (!$iframe.length) {
							$iframe = $('<iframe src="upload_frame.php" />');
							$iframe.on('load', function() {
								resizeUploadIframeCallback();
								onDialogSizeChanged();
							});
						} else {
							resizeUploadIframeCallback();
							onDialogSizeChanged();
						}



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

			}())

		};

		return {
			Sites: {
				render: function(sites, tagsByIdFunc, siteOrderChangedCallback, removeSiteCallback) {
					renderSites(sites, tagsByIdFunc, siteOrderChangedCallback, removeSiteCallback, $sitesContainer);
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
				render: function(tags, selectedTagIds, selectedTagsChangedCallback) {
					renderTags(tags, selectedTagIds, selectedTagsChangedCallback, $tagsContainer);
				}
			},
			Dialogs: Dialogs,

			State: {
				set: function(state) {
					var $sites = $('a.thumbnail_link');
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

			}
		}

	}());





	var setButtonEventHandlers = function() {

		var $addSiteDialog = $('#add_site_dialog');
		var $controlsArea = $('#controls_area');

		$addSiteDialog.find('.button.cancel').on('click', function () {
			View.Dialogs.AddEditSite.dismiss();
		});

		$addSiteDialog.find('.button.save').on('click', function () {
			var siteName = View.Dialogs.AddEditSite.getSiteName();
			var siteUrl = View.Dialogs.AddEditSite.getSiteName();
			var siteTagIds = View.Dialogs.AddEditSite.getSiteTagIds();
			var siteThumbnailUrl = View.Dialogs.AddEditSite.getSiteThumbnailUrl();

			// TODO: Add new site to model (should trigger save)
		});

		$controlsArea.find('.button.add_site').on('click', function () {
			View.Dialogs.AddEditSite.show(
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

		var $webSearchBar = $('#web_search_bar');
		var $webSearchInput = $webSearchBar.find('input[type=text]');
		$webSearchInput.val('').focus().select();
		var $webSearchForm = $('#web_search_form');
		var $suggestions = $('#web_search_suggestions');

		var lastQuery = '';
		var KEYCODE_UP = 38;
		var KEYCODE_DOWN = 40;
		var KEYCODE_ENTER = 13;
		var selSearchIdx = 0;

		var onSuggestionMouseenter = function($event) {
			var $suggestion = $($event.target);
			$suggestion.siblings().filter('.selected').removeClass('selected');
			$suggestion.addClass('selected');
		};

		var onSuggestionMouseleave = function($event) {
			var $suggestion = $($event.target);
			$suggestion.removeClass('selected');
		};

		var onSuggestionClick = function($event) {
			var $suggestion = $($event.target);
			var clickedItemQuery = $suggestion.attr('q');
			var clickedItemURL = $suggestion.attr('url');
			if (typeof clickedItemQuery === 'string' && clickedItemQuery.length) {
				$webSearchInput.val(clickedItemQuery);
				$webSearchForm.submit();
			} else if (typeof clickedItemURL === 'string' && clickedItemURL.length) {
				top.location.href = clickedItemURL;
			}

		}

		var google204Fetched = false;

		$webSearchInput.on('keyup', function(e) {
			if (e.keyCode == KEYCODE_UP || e.keyCode == KEYCODE_DOWN || e.keyCode == KEYCODE_ENTER) return;
			var q = $.trim($(this).val());

			if (typeof q !== 'string' || q.length < 1) return;
			if (q == lastQuery) return;

			selSearchIdx = 0;

			lastQuery = q;


			// Determine what the user is putting into the input
			var qType = 'unknown';
			var isProtoUrl = q.indexOf('http://') === 0 || q.indexOf('https://') === 0;

			var lastDotPos = -1;
			var hasSpace = false;

			if (!isProtoUrl) {
				var pos = -1;
				do {
					pos = q.indexOf('.', pos + 1);
				} while (q.indexOf('.', pos + 1) != -1);

				lastDotPos = pos;
				hasSpace = q.indexOf(' ') !== -1;
			}

			if (isProtoUrl || (lastDotPos != -1 && !hasSpace)) {
				// URL
				qType = 'url';
			}

			if (qType == 'unknown') {
				var tagmarksSiteMatches = [];
				var sites = Model.Sites.get();
				$.each(sites, function (idx, site) {
					if (site.name.toLowerCase().indexOf(q.toLowerCase()) === 0) {
						tagmarksSiteMatches.push(site);
					}
				});

				if (tagmarksSiteMatches.length != 0 && tagmarksSiteMatches.length <= 3) {
					qType = 'tagmarks-site';
				} else {
					qType = 'web-search';
				}
			}


			if (qType == 'unknown') {
				qType = 'web-search'
			}



			$.ajax({
				url: 'search_suggestions.php',
				type: 'GET',
				data: {q: q},
				dataType: 'json',
				success: function(response) {
					if (typeof response == 'object' && 'length' in response) {

						$suggestions.html('');

						$.each(tagmarksSiteMatches, function(idx, site) {
							var $suggestion = $(''
								+'<div class="site">'
								+   htmlEntities(site.name)
								+'</div>');
							$suggestion.attr('url', site.url);
							$suggestions.append($suggestion);

							$suggestion.on('mouseenter', onSuggestionMouseenter);
							$suggestion.on('mouseleave', onSuggestionMouseleave);
							$suggestion.on('click', onSuggestionClick);
						});


						$.each(response, function(idx, item) {
							var $suggestion = $(''
								+'<div>'
								+   '<span>'
								+       htmlEntities(item.substr(0, q.length))
								+   '</span>'
								+   htmlEntities(item.substr(q.length))
								+'</div>');
							$suggestion.attr('q', item);
							$suggestions.append($suggestion);

							$suggestion.on('mouseenter', onSuggestionMouseenter);
							$suggestion.on('mouseleave', onSuggestionMouseleave);
							$suggestion.on('click', onSuggestionClick);
						});



						$suggestions.show();


						if (!google204Fetched) {
							google204Fetched = true;
							(new Image).src =
								'https://clients1.google.com/generate_204';
						}

					} else {
						$suggestions.hide();
					}
				},
				error: Logger.jqueryAjaxErrorHandler
			});
		});




		$webSearchInput.on('keyup', function(e) {

			if (e.keyCode == KEYCODE_DOWN) {
				selSearchIdx++;
			} else if (e.keyCode == KEYCODE_UP) {
				if (selSearchIdx > 0) {
					selSearchIdx--;
				}
			} else if (e.keyCode == KEYCODE_ENTER) {
				var $selSuggestion = $suggestions.find('div.selected');
				if ($selSuggestion.length) {
					$selSuggestion.addClass('active');
					$selSuggestion.trigger('click');
					e.preventDefault();
				}
				return;
			}

			if (e.keyCode == KEYCODE_DOWN || e.keyCode == KEYCODE_UP) {
				$suggestions.find('div.selected').removeClass('selected');

				if (selSearchIdx > 0) {
					var $selItem = $suggestions.find('div:nth-child(' + selSearchIdx + ')');
					if ($selItem.length) {
						$selItem.addClass('selected');
						var selItemQuery = $selItem.attr('q');
						if (typeof selItemQuery === 'string' && selItemQuery.length) {
							$webSearchInput.val(selItemQuery);
							$webSearchInput[0].selectionStart =
								selItemQuery.length;
							$webSearchInput[0].selectionEnd =
								selItemQuery.length;
						}
					} else {
						selSearchIdx = 0;
					}
				}
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

	var removeSiteCallback = function(siteToRemove) {
		var sites = Model.Sites.get();
		$.each(sites, function(siteIdx, site) {
			if (site == siteToRemove) {
				sites.splice(siteIdx, 1);
				return false;
			}
		});

		Model.Sites.set(sites);
		Model.Sites.save();
	};

	var onResponseReceived = function (response, whichResponse) {

		if (whichResponse == 'dataResponse') {

			var mainData = response.data;
			var tldData = response.tlds;

			Model.init(mainData.settings, mainData.sites, mainData.tags, tldData);


			View.init();

			View.Tags.render(Model.Tags.get(), Model.State.get().selectedTagIds, onSelectedTagsChanged);
			View.Sites.render(Model.Sites.get(), Model.Tags.getTagByIdName,
				onSiteOrderChanged, removeSiteCallback);

			$(window).on('resize', View.Viewport.onResize);
			$(window).trigger('resize');

			setButtonEventHandlers();

		}

		if (whichResponse == 'stateResponse') {

			var state;
			if ('errorIdName' in response && response.errorIdName == 'NoSavedState') {
				// No saved state
				state = {
					selectedTagIds: Model.Tags.getIds()
				};
			} else {
				// Saved state data retrieved
				state = response.state;
			}
			Model.State.set(state);
			View.State.set(Model.State.get());

		}



	};

	// Tagmarks public interface
	return {
		Model: Model,

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
			View.Dialogs.AddEditSite.setSelectedImage(uploadInfo.upload_url);
		},

		init: function () {

			$.ajax({
				url: 'data.php',
				type: 'GET',
				data: {},
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

}());
