$(document).ready(function () {
	Tagmarks.init();
});


var Tagmarks = (function () {

	var Sites = (function () {

		var sites = [
		];

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
					return a.name < b.name ? -1 : (a.name == b.name ? 0 : 1);
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

		var render = function () {
			Elements.$sitesContainer.html('');
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

				var $tagStrip = $('<div class="tag_strip" />');
				$.each(site.tags, function (tagIdx, tagIdName) {
					var tag = Tagmarks.getTagByIdName(tagIdName);
					var $tag = $('<div class="tag" />');
					$tag.text(tag.name);
					$tag.css('background-color', tag.background_color);
					if ('foreground_color' in tag) {
						$tag.css('color', tag.foreground_color);
					}
					$tagStrip.append($tag);
				});

				$a.append($img);
				$a.append($tagStrip);

				Elements.$sitesContainer.append($a);
			});

			Elements.$sitesContainer.sortable({
				revert: false,
				containment: 'parent',
				helper: 'clone',
				opacity: 0.5,
				scroll: true,
				zIndex: 200,
				tolerance: "pointer",

				stop: onRearranged
			});

			Elements.$sitesContainer.disableSelection();
		}; // render()


		var onRearranged = function () {

		};

		var generateId = function () {
			return Math.floor(Math.random() * 89999999) + 10000000;
		};


		var save = function () {
			$.ajax({
				url: "state.php",
				type: "POST",
				data: JSON.stringify({
					sites: Tagmarks.sites
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
			save: function() {
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

		var render = function () {
			Elements.$tagsContainer.html('');

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
					$tag.toggleClass('selected');
					if ($tag.hasClass('selected')) {
						$tag.css('background-color', color_rgb_str);
					} else {
						$tag.css('background-color', dark_color_str);
					}
					updateTagSelections();
				});

				// Start deselected
				$tag.removeClass('selected');
				$tag.css('background-color', dark_color_str);

				// Insert tag into container element (dials container)
				Elements.$tagsContainer.append($tag);
				updateTagSelections();
			});
		};

		var updateTagSelections = function () {

		};

		/**
		 * Get object mapping all tag id_names to tag entries
		 */
		var getTagsByIdNames = function () {
			var thisFunc = arguments.callee;
			if (typeof thisFunc.tagsByIdNames === 'undefined') {
				Logger.log("Initializing tags by idNames list");
				thisFunc.tagsByIdNames = {};
				$.each(tags, function (tagIdx, tag) {
					thisFunc.tagsByIdNames[tag.id_name] = tag;
				})
			} else {
				Logger.log("Found tags by idNames list (already initialized)");
			}
			return thisFunc.tagsByIdNames;
		};

		return {
			set: function (tagsData) {
				tags = tagsData;
				sort();
			},
			get: function () {
				return tags;
			},
			save: function() {
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

		var handleStateData = function (data, textStatus, jqXHR) {
			var state = data.state;

			Tags.setSelectedTags(state.selTagIdNames);
		};

		return {
			load: function () {
				$.ajax({
					url: "state.php",
					type: "GET",
					data: {},
					success: handleStateData,
					error: Logger.jqueryAjaxErrorHandler
				});
			},
			save: function () {

				var selTagIds = Tags.getSelectedTags();

				$.ajax({
					url: "state.php",
					type: "POST",
					data: JSON.stringify({
						state: {
							selTagIdNames: selTagIds
						}
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


	var Uploader = {
		window: null,
		$iframe: null,
		TagmarksUploader: null
	};

	var Elements = (function () {
		// jQuery element placeholder structure
		var Dialogs = {
			AddSite: {
				$dialog: null,
				$uploadIframe: null,
				$cancel: null,
				$save: null
			}
		};
		var Buttons = {
			$addSite: null
		};
		var $body = null;
		var $tagsContainer = null;
		var $sitesContainer = null;


		var assign = function () {
			Buttons.$addSite = $('#left .button.add_site');

			Dialogs.AddSite.$dialog = $('#add_site_dialog');
			Dialogs.AddSite.$uploadIframe =
				Dialogs.AddSite.$dialog.find('iframe');
			Dialogs.AddSite.$cancel =
				Dialogs.AddSite.$dialog.find('.button.cancel');
			Dialogs.AddSite.$save =
				Dialogs.AddSite.$dialog.find('.button.save');

			$body = $('body');
			$tagsContainer = $('#tag_nav_area');
			$sitesContainer = $('#center');
		};

		var setEventHandlers = function () {
			Dialogs.AddSite.$uploadIframe.on('load', function () {
				Uploader.$iframe = $(this);
				Uploader.window = Uploader.$iframe.get(0).contentWindow;
				Uploader.TagmarksUploader = Uploader.window.TagmarksUploader;
			});
		};

		return {
			// grouped elements
			Dialogs: Dialogs,
			Buttons: Buttons,
			// individual elements
			$body: $body,
			$tagsContainer: $tagsContainer,
			$sitesContainer: $sitesContainer,

			// public methods
			init: function () {
				assign();
				setEventHandlers();
			}
		}
	})();

	var Defaults = {
		ThumbnailSize: {width: 319, height: 179}
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
				if (LOGGING_ENABLED !== true) return;

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

	var Viewport = (function () {

		var MinThumbnailArea = {width: null, height: null};
		var OuterMarginWidth = null; // calculated from CSS

		return {
			recalculate: function () {

				Elements.$body.css('overflow', 'scroll');
				MinThumbnailArea.width =
					Elements.$contentContainer.innerWidth();
				MinThumbnailArea.height = Elements.$contentContainer.height();

				Elements.$body.css('overflow', 'auto');
				var outerMarginTotal = Elements.$body.outerWidth(true) - Elements.$body.width();
				OuterMarginWidth = Math.floor(outerMarginTotal / 2);
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

			return {
				show: function () {

					var $tagsContainer = Elements.AddSite.$dialog.find('.tags_container');
					$tagsContainer.html('');

					$.each(Tags.get(), function (tagIdx, tag) {
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

					Elements.AddSite.$dialog.show();
					Uploader.resize(); // resize iframe to fit iframe content
				},

				onFileUploaded: function (uploadUri) {
					var fullUrl = 'http://' + window.location.host + '/' + uploadUri;
					$('#uploaded_image_container').text('Getting image information...');

					$.ajax({
						url: "get_image_data.php",
						type: "GET",
						data: {image_url: fullUrl},
						dataType: 'json',
						success: function (data, textStatus, jqXHR) {
							console.log(data);
							alert('handle image data');
						},
						error: Logger.jqueryAjaxErrorHandler
					});

					console.log(uploadUri);
				},

				dismiss: function () {
					Elements.AddSite.$dialog.hide();
				}
			}

		})() // Dialogs.AddSite

	};

	var Handlers = {
		// TODO: Make these functions into stubs which call handler functions in their specific Tagmarks namespaces

		onSortChanged: function (event, ui) {
			var $container = $('#center');
			$container.children('a.thumbnail_link').each(function (dialDomIdx,
				dialElement) {
				var $dialElement = $(dialElement);
				var site_id = $dialElement.attr('site_id');
				var site_idx = $dialElement.attr('site_idx');
				var site = Tagmarks.sites[site_idx];
				site.order = dialDomIdx;
			});

			Tagmarks.saveSites();
		},

		onResize: function () {

			var vport = Tagmarks.Viewport;
			vport.recalculate();

			var thumbHorizSep = vport.OuterMarginWidth;
			var $firstRenderedThumb = $('a.thumbnail_link:first');
			var thumbBorderWidthTotal = $firstRenderedThumb.outerWidth(false) - $firstRenderedThumb.innerWidth();

			var THUMBS_PER_ROW = 5;

			var thumbWidth = Math.floor((
				vport.MinThumbnailArea.width - (thumbBorderWidthTotal * THUMBS_PER_ROW) - (thumbHorizSep * (THUMBS_PER_ROW - 1)) - (vport.OuterMarginWidth * 2)
				) / THUMBS_PER_ROW);

			if (thumbWidth >= Tagmarks.Thumbnails.DefaultSourceSize.width) {
				thumbWidth = Tagmarks.Thumbnails.DefaultSourceSize.width;
			}

			var thumbHeight = (
				Tagmarks.Thumbnails.DefaultSourceSize.height / Tagmarks.Thumbnails.DefaultSourceSize.width
				) * thumbWidth;

			var $thumbnailLinks = $('a.thumbnail_link');

			$thumbnailLinks.css({
				width: thumbWidth + 'px',
				height: thumbHeight + 'px'
			});

			// TODO: Replace this logic w/ row divs or something simpler/better
			// Remove left margin on first thumbnails in each row (one for every
			// thumbs-per-row)
			var idxGroupOffset = 0;
			$thumbnailLinks.each(function (idx) {
				var $a = $(this);

				if ($a.prev('.group').length) {
					idxGroupOffset = idx
				}

				idx -= idxGroupOffset;

				if (idx % THUMBS_PER_ROW != 0) {
					$a.css('margin-left', thumbHorizSep + 'px');
				}
			});


			$thumbnailLinks.children('img').each(function () {

				var $img = $(this);
				var $a = $img.parent(); // a.thumbnail_link

				$img.on('load', function () {
					$a.css('transform', 'scale(1,1)');
					$a.css('opacity', '1');
				});

				// Trigger load event for cached images
				if (this.complete) $img.trigger('load');

			});

		}
	};


	return {
		Sites: {
			get: Sites.get
		},
		Tags: {
			get: Tags.get
		},
		Settings: {
			get: Settings.get
		},


		init: function () {
			Elements.init();

			// Initial dataset load
			$.ajax({
				url: 'data.php',
				type: 'GET',
				data: {format: 'json'},
				dataType: 'json',
				success: function (response) {
					data = response; // holds raw data

					Settings.set(data.settings);
					Sites.set(data.sites);
					Tags.set(data.tags);
				},
				error: Logger.jqueryAjaxErrorHandler
			});
		}
	}

})();
