
// Code temporarily cut from tagmarks.js while refactoring


function onSortChanged(event, ui) {
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
}

function onResize() {

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



loadState: function () {
	$.ajax({
		url: "state.php",
		type: "GET",
		data: {},
		success: handleStateData,
		error: Logger.jqueryAjaxErrorHandler
	});
},
saveState: function () {

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