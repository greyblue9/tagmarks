
// @author greyblue9

var $; // This is just to disable some warnings in IntelliJ so it doesn't think
       // $ is an "unresolved" global symbol.

$(document).ready(function() {

	TagMarks.init();

});

var TagMarks = {

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
			var $container = $('#center');

			// All available area, including that available for scrollbars
			$body.css('overflow', 'hidden');
			this.EntireWebArea.width = $body.outerWidth(true); // incl. padding+border
			this.EntireWebArea.height = $body.height(); // incl. padding+border

			// Available area, inside scrollbars (when both present)
			$body.css('overflow', 'scroll');
			this.MinWebArea.width = $body.outerWidth(true); // incl. padding+border
			this.MinWebArea.height = $body.height(); // incl. padding+border
			this.MinThumbnailArea.width = $container.innerWidth();
			this.MinThumbnailArea.height = $container.height();

			// Set to auto for final use/rendering
			$body.css('overflow', 'auto');
			this.WebArea.width = $body.outerWidth(true); // incl. padding+border
			this.WebArea.height = $body.height(); // incl. padding+border

			var outerMarginTotal = $body.outerWidth(true) - $body.width();
			this.OuterMarginWidth = Math.floor(outerMarginTotal / 2);
		}
	},

	Thumbnails: {
		SourceSize: {width: 319, height: 179}
	},


	init: function() {

		var me = this;

		var request = $.ajax({
			url: 'data_action.php',
			type: 'GET',
			data: {format: 'json', secvars_post_replace: 1},
			dataType: 'json'
		});

		request.done(function (data) {
			me.data = data;
			me.tags = data.tags;
			me.sites = data.sites;
			me.settings = 'settings' in data? data.settings: {};

			me.renderTagNav();

			me.renderDials();

			me.onResize();
		});


		$(window).on('resize', this.onResize);

		this.Viewport.recalculate();
	},

	renderTagNav: function() {

		var $container = $('#tag_nav_area');
		$container.html('');

		$.each(this.tags, function(idx, tag) {
			var $tag = $('<div class="tag">'+tag.name+'</div>');
			$tag.addClass('selected');
            $tag.attr('sel_color', tag.background_color);
            $tag.css('background-color', tag.background_color);
			$tag.attr('tag', tag._name_alnum);

            var color_rgb_str = $tag.css('background-color');
            var color_rgb = TagMarks.Utils.css_color_string_to_rgb(color_rgb_str); // [r, g, b]

            // color_hsl is 3 values in range 0-1
            var color_hsl = TagMarks.Utils.rgbToHsl(color_rgb[0], color_rgb[1], color_rgb[2]);
            var dark_color_rgb = TagMarks.Utils.hslToRgb(color_hsl[0], color_hsl[1], color_hsl[2] *.53);
            var dark_color_str = 'rgb('+dark_color_rgb.join(',')+')'; // rgb(x,y,z)
            $tag.attr('desel_color', dark_color_str);

            // Tag class/color selected toggle
            $tag.on('click', function() {
                $tag.toggleClass('selected');
                if ($tag.hasClass('selected')) {
                    $tag.css('background-color', color_rgb_str);
                } else {
                    $tag.css('background-color', dark_color_str);
                }
	            TagMarks.onSelectedTagsChanged();
            });

			$container.append($tag);
		});

	},

	onSelectedTagsChanged: function() {
		var $tags = $('#tag_nav_area > .tag');

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

	renderDials: function() {

		var $container = $('#center');
		$container.html('');

		$.each(this.sites, function(siteIdx, site) {

			var $a = $('<a />');
			$a.attr('href', site.url);
			$a.attr('title', site.name);
			$a.addClass('thumbnail_link');
			$a.attr('tags', site.tags.join(' '));

			var $img = $('<img />');
			$img.attr('src', site.thumbnail);
			$img.attr('title', site.name);

			$a.append($img);

			$container.append($a);

		});

	},

	onResize: function() {

		var vport = TagMarks.Viewport;
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

		if (thumbWidth >= TagMarks.Thumbnails.SourceSize.width) {
			thumbWidth = TagMarks.Thumbnails.SourceSize.width;
		}

		var thumbHeight = (
			TagMarks.Thumbnails.SourceSize.height
			/ TagMarks.Thumbnails.SourceSize.width
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
				$a.css('opacity', '1');
			});

			// Trigger load event for cached images
			if (this.complete) $img.trigger('load');

		});

	},

	Utils: {

		css_color_string_to_rgb: function(color_str) {
			var rgb_delim = color_str.substr(4, color_str.length - 5);
            var parts = rgb_delim.split(/,[\s*]/);
            return parts; // [r, g, b]
		},

		rgbToHsl: function(r, g, b) {

			r /= 255, g /= 255, b /= 255;
			var max = Math.max(r, g, b), min = Math.min(r, g, b);
			var h, s, l = (max + min) / 2;

			if(max == min){
				h = s = 0; // achromatic
			}else{
				var d = max - min;
				s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
				switch(max){
					case r: h = (g - b) / d + (g < b ? 6 : 0); break;
					case g: h = (b - r) / d + 2; break;
					case b: h = (r - g) / d + 4; break;
				}
				h /= 6;
			}

			return [h, s, l];
		},

        hslToRgb: function(h, s, l){

			var r, g, b;

			if(s == 0){
				r = g = b = l; // achromatic
			}else{
				function hue2rgb(p, q, t){
					if(t < 0) t += 1;
					if(t > 1) t -= 1;
					if(t < 1/6) return p + (q - p) * 6 * t;
					if(t < 1/2) return q;
					if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
					return p;
				}

				var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
				var p = 2 * l - q;
				r = hue2rgb(p, q, h + 1/3);
				g = hue2rgb(p, q, h);
				b = hue2rgb(p, q, h - 1/3);
			}

			return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
		}

	}




};