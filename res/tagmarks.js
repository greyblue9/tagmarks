
$(document).ready(function() {

	Tagmarks.init();

});

var Tagmarks = {

	data: [],

	tags: [],
	sites: [],
	settings: {},

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

			me.renderTagNav();
			me.renderDials();

			// Trigger element sizing
			me.onResize();
		});


		$(window).on('resize', this.onResize);

		// Trigger screen/container calculations
		this.Viewport.recalculate();
	},

	renderTagNav: function() {

		var $container = $('#tag_nav_area');
		$container.html('');

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

			$tag.addClass('selected');

			// Insert tag into container element (dials container)
			$container.append($tag);
		});

	},

	onSelectedTagsChanged: function() {
		var $tags = $('#tag_nav_area').find('> .tag');

		$tags.each(function() {
			var $tag = $(this);
			var tagId = $tag.attr('tag');
			if ($tag.hasClass('selected')) {
				$('a.thumbnail_link[tags~="'+tagId+'"]').show();
			} else {
				$('a.thumbnail_link[tags~="'+tagId+'"]').hide();
			}
		});
	},

	getTagsByIdNames: function() {
		var thisFunc = arguments.callee;
		if (typeof thisFunc.tagsByIdNames === 'undefined') {
			console.log("Initializing tags by idNames list");
			thisFunc.tagsByIdNames = {};
			$.each(Tagmarks.tags, function(tagIdx, tag) {
				thisFunc.tagsByIdNames[tag.id_name] = tag;
			})
		} else {
			console.log("Found tags by idNames list (already initialized)");
		}

		return thisFunc.tagsByIdNames;
	},

	getTagByIdName: function(tagIdName) {

		if (tagIdName in this.getTagsByIdNames()) {
			return this.getTagsByIdNames()[tagIdName];
		} else {
			console.error('Tag not found with id_name: "'+tagIdName+'"');
			return {};
		}

	},

	sortSites: function() {
		var sites = this.sites;

		sites.sort(function(a, b) {

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

		$.each(this.sites, function(siteIdx, site) {

			var $a = $('<a />');
			$a.attr('href', site.url);
			$a.attr('title', site.name);
			$a.addClass('thumbnail_link');
			$a.attr('tags', site.tags.join(' '));
			$a.disableSelection();

			var $img = $('<img />');
			$img.attr('src', site.thumbnail);
			$img.attr('title', site.name);
			$img.disableSelection();

			$a.append($img);

			$container.append($a);

		});

		$container.sortable({
			revert: false,
			containment: 'parent',
			helper: 'clone',
			opacity: 0.5,
			scroll: true,
			zIndex: 200,
			tolerance: "pointer"
		});
		$container.disableSelection();

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
			height: thumbHeight + 'px',
			margin: '0'
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
				$a.css('opacity', '.8');
			});

			// Trigger load event for cached images
			if (this.complete) $img.trigger('load');

		});

	}


};