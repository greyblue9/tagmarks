
$(document).ready(function() {

	Tagmarks.init();

});

var Tagmarks = {

	data: [],

	tags: [],
	sites: [],
	settings: {},

	LOGGING_ENABLED: false,

	log: function(obj, severity) {
		if (Tagmarks.LOGGING_ENABLED === true) {
			if (typeof severity === 'string' && severity == 'error') {
				console.error(obj);
			} else {
				console.log(obj);
			}
		}
	},

	Viewport: {
		EntireWebArea: {width: null, height: null},
		MinWebArea: {width: null, height: null},
		WebArea: {width: null, height: null},

		MinThumbnailArea: {width: null, height: null},

		OuterMarginWidth: null, // set by CSS file

		recalculate: function () {
			var $body = $('body');
			var $contentContainer = $('#center');

			$body.css('overflow', 'scroll');
			this.MinThumbnailArea.width = $contentContainer.innerWidth();
			this.MinThumbnailArea.height = $contentContainer.height();

			$body.css('overflow', 'auto');
			var outerMarginTotal = $body.outerWidth(true) - $body.width();
			this.OuterMarginWidth = Math.floor(outerMarginTotal / 2);
		}
	},

	Thumbnails: {
		DefaultSourceSize: {width: 319, height: 179}
	},

	responseHadErrorWithIdName: function(response, errorIdName) {
		return (typeof response == 'object' &&
			'error' in response && response.error == true &&
			'errorIdName' in response && response.errorIdName == errorIdName);
	},

	View: {
		hideSiteTagIndicators: function(noAnimation) {

			if (noAnimation) {
				$('.tag_strip').hide();
				$('a.thumbnail_link').css('margin-bottom', 0);
				return;
			}

			$('.tag_strip').slideUp(500, 'swing');
			setTimeout(function () {
				$('a.thumbnail_link').animate({
					marginBottom: 0
				}, 750, 'swing');
			}, 100);
		},

		showSiteTagIndicators: function(noAnimation) {
			
			if (noAnimation) {
				$('.tag_strip').show();
				$('a.thumbnail_link').css('margin-bottom', '20px');
				return;
			}

			$('a.thumbnail_link').animate({
				marginBottom: '20px'
			}, 750, 'swing');
			setTimeout(function () {
				$('.tag_strip').slideDown(500, 'swing');
			}, 100);
		},

		siteTagIndicatorsVisible: function() {
			return $('.tag_strip:first').is(':visible');
		}
	},

	init: function() {

		var me = this;

		var request = $.ajax({
			url: 'data.php',
			type: 'GET',
			data: {format: 'json'},
			dataType: 'json'
		});

		request.done(function (data) {
			me.data = data;
			me.tags = data.tags;
			me.sites = data.sites;
			me.settings = 'settings' in data? data.settings: {};

			me.loadState(function(loadStateResponse) {

				me.renderTagNav();

				if (me.responseHadErrorWithIdName(loadStateResponse, 'NoSavedState')) {
					// No saved state
					// Select all tags
					var $navTags = $('#tag_nav_area > .tag');
					$navTags.each(function() {
						var $navTag = $(this);
						$navTag.addClass('selected');
						$navTag.css('background-color', $navTag.attr('sel_color'));
					});
				} else {
					// Saved state present
					// Select tags as previously saved
					var state = loadStateResponse.state;
					var selTagIdNames = state.selTagIdNames;
					$.each(selTagIdNames, function (idx, tagIdName) {
						var $navTag = $('#tag_nav_area > .tag[tag=' + tagIdName + ']');
						$navTag.addClass('selected');
						$navTag.css('background-color', $navTag.attr('sel_color'));
					});
				}

				me.renderDials();
				me.onSelectedTagsChanged(true); // no save

				// Trigger element sizing
				me.onResize();

				// Hide site tag indicators after 1s
				me.View.hideSiteTagIndicators(true); // don't animate

				$('#left')
					.on('mouseenter', function() {
						me.View.showSiteTagIndicators(true);
					})
					.on('mouseleave', function() {
						me.View.hideSiteTagIndicators(true);
					});


			});
		});


		$(window).on('resize', this.onResize);

		// Trigger screen/container calculations
		this.Viewport.recalculate();
	},

	sortTags: function() {
		var tags = this.tags;

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
				console.error('Unknown site sorting condition');
				return 0;
			}

		});
	},

	renderTagNav: function() {

		var $container = $('#tag_nav_area');
		$container.html('');

		Tagmarks.sortTags();

		$.each(this.tags, function(idx, tag) {
			// Make new tag
			var $tag = $('<div class="tag">'+tag.name+'</div>');

			// Set CSS background color
			$tag.css('background-color', tag.background_color);
			// Can calculate "deselected" color now that CSS bg color is set
            var color_rgb_str = $tag.css('background-color');
            var color_rgb =
	            TagmarksUtils.css_color_string_to_rgb(
		            color_rgb_str); // [r,g,b]
            var color_hsl = // color_hsl is 3 values in range 0-1
	            TagmarksUtils.rgbToHsl(
	                color_rgb[0], color_rgb[1], color_rgb[2]);
            var dark_color_rgb =
	            TagmarksUtils.hslToRgb(
	                color_hsl[0], color_hsl[1], color_hsl[2] *.53);
			// Final result (darkened color for "deselected" state)
            var dark_color_str =
	            'rgb('+dark_color_rgb.join(',')+')'; // rgb(x,y,z)

			if ('foreground_color' in tag) {
				$tag.css('color', tag.foreground_color);
			}

			$tag.attr('tag', tag.id_name);
			$tag.attr('sel_color', tag.background_color);
            $tag.attr('desel_color', dark_color_str);

            // Tag class/color selected toggle
            $tag.on('click', function() {
                $tag.toggleClass('selected');
                if ($tag.hasClass('selected')) {
                    $tag.css('background-color', color_rgb_str);
                } else {
                    $tag.css('background-color', dark_color_str);
                }
	            Tagmarks.onSelectedTagsChanged();
            });

			// Start deselected
			$tag.removeClass('selected');
			$tag.css('background-color', dark_color_str);

			// Insert tag into container element (dials container)
			$container.append($tag);
		});

	},

	onSelectedTagsChanged: function(noSave) {
		var $tags = $('#tag_nav_area').find('> .tag');

		$('a.thumbnail_link').hide();

		$tags.each(function() {
			var $tag = $(this);
			var tagId = $tag.attr('tag');
			if ($tag.hasClass('selected')) {
				$('a.thumbnail_link[tags~="'+tagId+'"]').show();
			}
		});

		if (typeof noSave == 'undefined' || !noSave) {
			Tagmarks.saveState();
		}

	},

	loadState: function(callback) {
		$.ajax({
			url: "state.php",
			type: "GET",
			data: {placeholderVar: 'placeholderVal'},
			success: function (data, textStatus, jqXHR) {
				callback(data);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				Tagmarks.log('loadState $.ajax error handler invoked', 'error');
				Tagmarks.log({
					jQueryAjaxErrorHandlerArgs: {
						jqXHR: jqXHR,
						textStatus: textStatus,
						errorThrown: errorThrown
					}
				}, 'error');
			}
		});
	},

	saveState: function() {

		var selTagIdNames = $('#tag_nav_area > .tag.selected').get().reduce(
			function (lastValue, navTagElement, index, array) {
				var $navTag = $(navTagElement);
				lastValue.push($navTag.attr('tag'));
				return lastValue;
			},
			[] // initial value for "lastValue" (here, empty array)
		);

		$.ajax({
			url: "state.php",
			type: "POST",
			data: JSON.stringify({
				state: {
					selTagIdNames: selTagIdNames
				}
			}),
			contentType: 'application/json',
			success: function (data, textStatus, jqXHR) {
				Tagmarks.log('saveState success callback');
				Tagmarks.log(data);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				Tagmarks.log('saveState $.ajax error handler invoked', 'error');
				Tagmarks.log({
					jQueryAjaxErrorHandlerArgs: {
						jqXHR: jqXHR,
						textStatus: textStatus,
						errorThrown: errorThrown
					}
				}, 'error');
			}
		});
	},

	saveSites: function () {

		$.ajax({
			url: "state.php",
			type: "POST",
			data: JSON.stringify({
				sites: Tagmarks.sites
			}),
			contentType: 'application/json',
			success: function (data, textStatus, jqXHR) {
				Tagmarks.log('saveSites success callback');
				Tagmarks.log(data);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				Tagmarks.log('saveSites $.ajax error handler invoked', 'error');
				Tagmarks.log({
					jQueryAjaxErrorHandlerArgs: {
						jqXHR: jqXHR,
						textStatus: textStatus,
						errorThrown: errorThrown
					}
				}, 'error');
			}
		});
	},

	getTagsByIdNames: function() {
		var thisFunc = arguments.callee;
		if (typeof thisFunc.tagsByIdNames === 'undefined') {
			Tagmarks.log("Initializing tags by idNames list");
			thisFunc.tagsByIdNames = {};
			$.each(Tagmarks.tags, function(tagIdx, tag) {
				thisFunc.tagsByIdNames[tag.id_name] = tag;
			})
		} else {
			Tagmarks.log("Found tags by idNames list (already initialized)");
		}

		return thisFunc.tagsByIdNames;
	},

	getTagByIdName: function(tagIdName) {

		if (tagIdName in this.getTagsByIdNames()) {
			return this.getTagsByIdNames()[tagIdName];
		} else {
			Tagmarks.log('Tag not found with id_name: "'+tagIdName+'"', 'error');
			return {};
		}

	},

	sortSites: function() {
		var sites = this.sites;

		sites.sort(function(a, b) {

			if ('order' in a && 'order' in b) {
				return a.order < b.order ? -1 : (a.order == b.order ? 0 : 1);
			}

			$.each([a, b], function(cmpIdx, cmpSite) {
				cmpSite.bestTagIdName = null;
				cmpSite.bestTagPriority = -1;

				$.each(cmpSite.tags, function (cmpSiteTagIdx, cmpSiteTagIdName) {
					var tag = Tagmarks.getTagByIdName(cmpSiteTagIdName);
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
				return a.name < b.name?
					-1:
					(a.name == b.name?
						0:
						1);
			}

			if (a.bestTagPriority < b.bestTagPriority) {
				return -1;
			} else if (b.bestTagPriority < a.bestTagPriority) {
				return 1;
			} else if (a.bestTagPriority == b.bestTagPriority) {
				// Sites' best tags each have same priority
				// Sort based on alphabetically first tag
				return a.bestTagIdName < b.bestTagIdName?
					-1: 1;
			} else {
				console.error('Unknown site sorting condition');
				return 0;
			}

		});
	},

	renderDials: function() {

		var $container = $('#center');
		$container.html('');

		this.sortSites();
		var sites = this.sites;

		$.each(sites, function(siteIdx, site) {

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
			$.each(site.tags, function(tagIdx, tagIdName) {
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

			stop: Tagmarks.onSortChanged
		});
		$container.disableSelection();

	},

	onSortChanged: function(event, ui) {
		var $container = $('#center');
		$container.children('a.thumbnail_link').each(function(dialDomIdx, dialElement) {
			var $dialElement = $(dialElement);
			var site_id = $dialElement.attr('site_id');
			var site_idx = $dialElement.attr('site_idx');
			var site = Tagmarks.sites[site_idx];
			site.order = dialDomIdx;
		});

		Tagmarks.saveSites();
	},

	onResize: function() {

		var vport = Tagmarks.Viewport;
		vport.recalculate();

		var thumbHorizSep = vport.OuterMarginWidth;
		var $firstRenderedThumb = $('a.thumbnail_link:first');
		var thumbBorderWidthTotal = $firstRenderedThumb.outerWidth(false)
			- $firstRenderedThumb.innerWidth();

		var THUMBS_PER_ROW = 5;

		var thumbWidth =
			Math.floor(
				(
					vport.MinThumbnailArea.width
					- (thumbBorderWidthTotal*THUMBS_PER_ROW)
					- (thumbHorizSep*(THUMBS_PER_ROW-1))
					- (vport.OuterMarginWidth * 2)
				)
				/ THUMBS_PER_ROW
			);

		if (thumbWidth >= Tagmarks.Thumbnails.DefaultSourceSize.width) {
			thumbWidth = Tagmarks.Thumbnails.DefaultSourceSize.width;
		}

		var thumbHeight = (
			Tagmarks.Thumbnails.DefaultSourceSize.height
			/ Tagmarks.Thumbnails.DefaultSourceSize.width
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