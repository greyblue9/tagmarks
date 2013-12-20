

$(document).ready(function () {

	if ($('html').attr('page') == 'upload_frame') {
		TagmarksUploadFrame.init();
	}

});

var TagmarksUploadFrame = {

	iframe: null,
	$iframe: null,
	params: null,

	LOGGING_ENABLED: true,

	log: function () {
		if (TagmarksUploadFrame.LOGGING_ENABLED === true && typeof console == 'object') {
			console.log.apply(console, arguments);
		}
	},

	init: function() {

		var me = TagmarksUploadFrame;

		var arrFrames = parent.document.getElementsByTagName("IFRAME");
		for (var i = 0; i < arrFrames.length; i++) {
			if (arrFrames[i].contentWindow === window) {
				me.iframe = arrFrames[i];
				me.$iframe = $(me.iframe);
			}
		}

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

		var uploadInfoJson = $('#upload_info').val();
		var uploadInfo = $.parseJSON(uploadInfoJson);

		if (!$.isEmptyObject(uploadInfo)) {
			parent.Tagmarks.handleUpload(uploadInfo);
		}
	},

	resize: function() {

		var me = TagmarksUploadFrame;
		var height = $('body').outerHeight();
		me.$iframe.css('height', height+'px');

	}

}
