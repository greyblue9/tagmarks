
// @author greyblue9

$(document).ready(function() {

	TagMarks.init();

});

var TagMarks = {

	data: [],

	tags: [],
	sites: [],
	settings: [],

	init: function() {

		var me = this;

		$.get('get_data.php?raw=1', function(data) {
			me.data = data;
			me.tags = data.tags;
			me.sites = data.sites;
			me.settings = data.settings;

			me.render_tag_nav();
		});

	},

	render_tag_nav: function() {

		var $container = $('#tag_nav_area');
		$container.html('');

		$.each(this.tags, function(idx, tag) {
			var $tag = $('<div class="tag">'+tag.name+'</div>');
			$tag.addClass('selected');
            $tag.attr('sel_color', tag.background_color);
            $tag.css('background', tag.background_color);

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
                    $tag.css('background', color_rgb_str);
                } else {
                    $tag.css('background', dark_color_str);
                }
            });

			$container.append($tag);
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