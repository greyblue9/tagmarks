/*

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



	var Defaults = {
		ThumbnailSize: {width: 319, height: 179},
		ThumbsPerRow: 5
	};


	var View = (function () {

		var $sitesContainer = null;
		var $tagsContainer = null;







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
			onSiteOrderChanged, removeSiteCallback);
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
			View.Dialogs.AddEditSite.setSelectedImage(uploadInfo.upload_url);
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


*/
