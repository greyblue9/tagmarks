

$(document).ready(function() {

	TagmarksUploader.init();

});

var TagmarksUploader = {

	iframe: null,
	$iframe: null,
	params: null,

	LOGGING_ENABLED: false,

	log: function (obj, severity) {
		if (TagmarksUploader.LOGGING_ENABLED === true) {
			if (typeof severity === 'string' && severity == 'error') {
				console.error(obj);
			} else {
				console.log(obj);
			}
		}
	},

	init: function() {

		var me = TagmarksUploader;

		var arrFrames = parent.document.getElementsByTagName("IFRAME");
		for (var i = 0; i < arrFrames.length; i++) {
			if (arrFrames[i].contentWindow === window) {
				me.iframe = arrFrames[i];
				me.$iframe = $(me.iframe);
			}
		}

		me.log(me.iframe);

		var qstring = document.location.search;
		var params = {};
		if (qstring.length > 1) {
			var parts = qstring.substr(1).split('&');
			$.each(parts, function (partIdx, part) {
				var pieces = part.split('=');
				params[unescape(pieces[0])] = unescape(pieces[1]);
			});
		}

		me.params = params;

		if ('upload_uri' in params) {
			parent.Tagmarks.onFileUploaded(
				params['upload_uri']
			);
		}

	},

	resize: function() {

		var me = TagmarksUploader;
		var height = $('body').outerHeight();
		me.$iframe.css('height', height+'px');

	}

}