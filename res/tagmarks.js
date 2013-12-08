

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

	var Logger = (function () {
		var LOGGING_ENABLED = false;

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
				if (LOGGING_ENABLED !== true || typeof console != 'object') return;

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

	var Defaults = {
		ThumbnailSize: {width: 319, height: 179},
		ThumbsPerRow: 5
	};

	var Model = (function() {

		var Sites = (function () {

			var sites = [];
			var initialized = false;

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
				initialized: initialized,
				set: function (sitesData) {
					sites = sitesData;
					sort();
				},
				get: function () {
					return sites;
				},
				save: function () {
					save();
					localStorage.removeItem('cached-data-response');
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
					$.each(tags, function(idx, tag) {
						tagsById[tag.id_name] = tag;
					});
					sort();
				},
				get: function () {
					return tags;
				},
				getIds: function() {
					return tags.map(function(tag) {
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

			var state = {
				selectedTagIds: []
			};
			var initialized = false;

			return {
				initialized: initialized,
				set: function (stateData) {
					$.each(stateData, function(key, val) {
						if (key in state) {
							state[key] = val;
						} else {
							Logger.log('Model.State.set - Unrecognized state data key:', key, 'warning');
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
					localStorage.removeItem('cached-state-response');
				}
			}

		})();

		return {
			Settings: Settings,
			Sites: Sites,
			Tags: Tags,
			State: State,

			init: function(pSettings, pSites, pTags) {
				Settings.set(pSettings);
				Sites.set(pSites);
				Tags.set(pTags);
			}
		}

	})();

	var View = (function () {

		var $sitesContainer = $('#center');
		var sitesContainer = $sitesContainer.get(0);
		var $tagsContainer = $('#tag_nav_area');



		var renderSites = function (sites, tagsByIdFunc, siteOrderChangedCallback, removeSiteCallback, $container) {

			var selById = {};
			if (Model.State.initialized == true) {
				var selTagIds = Model.State.get().selectedTagIds;

				for (var i = 0; i < selTagIds.length; i++) {
					selById[selTagIds[i]] = true;
				}
				console.log(selById);
			}


			sitesContainer.innerHTML = '';


			var numSites = sites.length;
			var site;
			for(var i=0; i<numSites; i++) {
				site = sites[i];
				var a = document.createElement('a');
				a.href = site.url;
				a.title = site.name;
				a.className = 'thumbnail_link';
				a.setAttribute('tags', site.tags.join(' '));
				a.setAttribute('site_id', site.id);
				a.setAttribute('site_idx', i);
				a.style.zIndex = numSites - i;


				var img = document.createElement('img');
				img.src = site.thumbnail;
				//img.title = site.name;

				if (Model.State.initialized) {
					var stayDisplayed = false;
					for (var t=0; t<site.tags.length; t++) {

						console.log(site.tags, site.tags[t], selById, (site.tags[t] in selById));
						if (site.tags[t] in selById) {
							stayDisplayed = true;
							break;
						}
					}

					if (!stayDisplayed) {
						a.style.display = 'none';
					}
				}

				/*if (img.complete) {
					var event = document.createEvent('HTMLEvents');
					event.initEvent('load', true, true);
					img.dispatchEvent(event);
				}*/


				/*var $tagStrip = $(document.createElement('div'));
				$tagStrip.addClass('tag_strip');
				$.each(site.tags, function (tagIdx, tagIdName) {

					var tag = tagsByIdFunc(tagIdName);
					var $tag = $(document.createElement('div')).addClass('tag');
					$tag.text(tag.name);
					$tag.css('background-color', tag.background_color);
					if ('foreground_color' in tag) {
						$tag.css('color', tag.foreground_color);
					}
					$tagStrip.append($tag);

				});

				var $label = $(document.createElement('span')).addClass('label');
				$label.append($(document.createElement('span')).text(site.name));

				var $controls = $(''
					+'<div class="controls">'
					+'  <div class="remove">&nbsp;</div>'
					+'  <div class="edit">&nbsp;</div>'
					+'</div>'
				);

				$controls.find('> .remove').on('click', function(event) {
					event.preventDefault();
					View.Dialogs.RemoveSite.show($a, site, removeSiteCallback);
				});*/

				a.appendChild(img);

				sitesContainer.appendChild(a);

			}

			$sitesContainer.sortable({
				revert: false,
				containment: 'parent',
				helper: 'clone',
				opacity: 0.5,
				scroll: true,
				zIndex: 200,
				tolerance: "pointer",
				stop: siteOrderChangedCallback
			});

		}; // render()

		var renderTags = function (tags, selectedTagIds, selectedTagsChangedCallback, $container) {

			var tagnavArea = document.getElementById('tag_nav_area');
			tagnavArea.innerHTML = '';

			var selectedByTagId = {};
			for (var i=0; i<selectedTagIds.length; i++) {
				selectedByTagId[selectedTagIds[i]] = true;
			}

			for (var t=0; t<tags.length; t++) {

				(function() {

					// Make new tag

					var tag = tags[t];

					var tagDiv = document.createElement('div');

					var isSelected;

					if (!selectedTagIds.length || tag.id_name in selectedByTagId) {
						tagDiv.className = 'tag selected';
						tag.selected = 'yes';
					} else if (selectedTagIds.length) {
						tagDiv.className = 'tag';
						tag.selected = 'no';
					} else {
						console.error('Unknown inital tag selected state');
					}


					tagDiv.innerHTML = tag.name;

					tagDiv.style.backgroundColor = tag.background_color;

					if (typeof tag.foreground_color !== 'undefined') {
						tagDiv.style.color = tag.foreground_color;
					}

					tagDiv.setAttribute('tag', tag.id_name);


					tagDiv.onclick = function() {

						tag.selected = tag.selected == 'no'? 'yes': 'no';
						tagDiv.className = 'tag'+(tag.selected == 'yes'? ' selected':'');
						selectedTagsChangedCallback();
					};

					tagnavArea.appendChild(tagDiv);
				})();

			}
		};

		var Viewport = (function () {

			var outerMarginTotal = 0;
			var outerMarginWidth = 0;
			var thumbnailSepSize = 0;
			var sitesContainerMinWidth = 0; // size limited by scrollbar

			var windowInnerHeight = null;
			var windowInnerHeight_last = null;
			var availHeightChangeTotal = 0;
			var timeoutActive = false;

			var onFindOpenedCallback = null;
			var onFindDismissedCallback = null;


			var $webSearchBar = null;


			var previousWidth = 0;

			return {
				onResize: function() {
					Logger.log('recalculating sizes');

					sitesContainerMinWidth = document.body.clientWidth - 190;

					//recalculate();

					//var $firstRenderedThumb = $('a.thumbnail_link:first');
					//var thumbBorderWidthTotal = 0;// $firstRenderedThumb.outerWidth(false) - $firstRenderedThumb.innerWidth();

					var thumbWidth = parseInt(sitesContainerMinWidth / Defaults.ThumbsPerRow);
					if (thumbWidth == previousWidth) {
						return;
					}

					previousWidth = thumbWidth;

					if (thumbWidth >= Defaults.ThumbnailSize.width) {
						thumbWidth = Defaults.ThumbnailSize.width;
					}

					var thumbHeight = parseInt(0.56112853 * thumbWidth);

					document.styleSheets[0].insertRule('#center > a { width: '+thumbWidth+'px; height: '+thumbHeight+'px; }',
						document.styleSheets[0].cssRules.length);

					//$links.width(thumbWidth);
					//$links.height(thumbHeight);

					if ($webSearchBar === null) {
						$webSearchBar = $('#web_search_bar');
						$webSearchBar.css('overflow', 'visible');
					}

					$webSearchBar.width(sitesContainerMinWidth);

				},

				setFindTextBarCallbacks: function(findOpenedCallback, findDismissedCallback) {
					onFindOpenedCallback = findOpenedCallback;
					onFindDismissedCallback = findDismissedCallback;
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
			})(),

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

			})()

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
					//var $sites = $('a.thumbnail_link');
					//$sites.hide();

					var sitesOnscreen = document.getElementById('center').children.length;

					if (sitesOnscreen) {

						var selTagsById = {};
						for (var i=0; i<state.selectedTagIds.length; i++) {
							selTagsById[state.selectedTagIds[i]] = true;
						}

						var sites = Model.Sites.get();
						for (i=0; i<sites.length; i++) {
							var stayDisplayed = false;
							for (var t=0; t<sites[i].tags.length; t++) {
								if (sites[i].tags[t] in selTagsById) {
									stayDisplayed = true;
								}
							}


							if (!stayDisplayed) {
								$('#center > a[site_id="' + sites[i].id + '"]').hide();
							} else {
								$('#center > a[site_id="' + sites[i].id + '"]').show();
							}
						}

						var tags = Model.Tags.get();
						for (i=0; i<tags.length; i++) {
							if (tags[i].id_name in selTagsById) {
								$('#tag_nav_area > div[tag='+tags[i].id_name+']').addClass('selected');
								tags[i].selected = 'yes';
							} else {
								$('#tag_nav_area > div[tag='+tags[i].id_name+']').removeClass('selected');
								tags[i].selected = 'no';
							}
						}

					} else {
						// Sites not rendered

					}

				},
				get: function() {
					var selectedTagIds = [];


					var tagNavArea = document.getElementById('tag_nav_area');
					var tagNavs = tagNavArea.children;
					for (var i=0; i<tagNavs.length; i++) {
						if (tagNavs[i].className.indexOf('selected') !== -1) {
							selectedTagIds.push(tagNavs[i].getAttribute('tag'));
						}
					}


					return {
						selectedTagIds: selectedTagIds
					}
				}
			},

			Viewport: Viewport,

			init: function() {

			}
		}

	})();





	var setButtonEventHandlers = function() {


		var $controlsArea = $('#controls_area');

		var $addSiteDialog = null;

		$controlsArea.find('.button.add_site').on('click', function () {

			if ($addSiteDialog === null) {
				$addSiteDialog = $('#add_site_dialog');
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

			}

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


		var webSearchInput = document.getElementById('web_search_input');
		webSearchInput.value = '';
		webSearchInput.focus();

		var webSearchForm = document.forms[0];//$('#web_search_form');
		var suggestions = document.getElementById('web_search_suggestions');

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
			$webSearchInput.val(clickedItemQuery);
			webSearchForm.submit();
		}

		var google204Fetched = false;

		webSearchInput.onkeyup = function(e) {


			if (e.keyCode == KEYCODE_DOWN || e.keyCode == KEYCODE_UP) {
				$suggestions.find('div.selected').removeClass('selected');

				if (selSearchIdx > 0) {
					var $selItem = $suggestions.find('div:nth-child(' + selSearchIdx + ')');
					if ($selItem.length) {
						$selItem.addClass('selected');
						var selItemQuery = $selItem.attr('q');
						$webSearchInput.val(selItemQuery);
						$webSearchInput.get(0).selectionStart =
							selItemQuery.length;
						$webSearchInput.get(0).selectionEnd =
							selItemQuery.length;
					} else {
						selSearchIdx = 0;
					}
				}

				if (e.keyCode == KEYCODE_DOWN) {
					selSearchIdx++;
				} else {
					// UP
					if (selSearchIdx > 0) {
						selSearchIdx--;
					}
				}
				return
			} else if (e.keyCode == KEYCODE_ENTER) {
				return;
			}


			var q = $.trim(webSearchInput.value);

			if (typeof q !== 'string' || q.length < 1) {
				return;
			}
			if (q == lastQuery) {
				return;
			}

			selSearchIdx = 0;

			lastQuery = q;

			$.ajax({
				url: 'search_suggestions.php',
				type: 'GET',
				data: {q: q},
				dataType: 'json',
				success: function(response) {
					if (typeof response == 'object' && 'length' in response) {

						suggestions.innerHTML = '';
						$.each(response, function(idx, item) {
							var $suggestion = $('<div><span>'+htmlEntities(item.substr(0, q.length))+'</span>'+htmlEntities(item.substr(q.length))+'</div>');
							$suggestion.attr('q', item);
							suggestions.appendChild($suggestion.get(0));

							$suggestion.on('mouseenter',
								onSuggestionMouseenter);
							$suggestion.on('mouseleave', onSuggestionMouseleave);
							$suggestion.on('click', onSuggestionClick);
						});


						suggestions.style.display = 'block';


						if (!google204Fetched) {
							google204Fetched = true;
							(new Image).src =
								'https://clients1.google.com/generate_204';
						}

					} else {
						suggestions.style.display = 'none';
					}
				},
				error: Logger.jqueryAjaxErrorHandler
			});
		};




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

			Model.Sites.initialized = true;

			Model.init(response.settings, response.sites, response.tags);

			View.init();

			View.Tags.render(Model.Tags.get(), Model.State.get().selectedTagIds, onSelectedTagsChanged);
			View.Sites.render(Model.Sites.get(), Model.Tags.getTagByIdName,
				onSiteOrderChanged, removeSiteCallback);

			$(window).on('resize', View.Viewport.onResize);




		}

		if (whichResponse == 'stateResponse') {
			Model.State.initialized = true;
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


		if (Model.State.initialized && Model.Sites.initialized) {

			$(window).trigger('resize');

			setButtonEventHandlers();
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

		resize: View.Viewport.onResize,

		// Called from upload iframe when iframe loads POST response
		handleUpload: function(uploadInfo) {
			Logger.log('Upload received from iframe', 'uploadInfo:', uploadInfo, 'debug');
			View.Dialogs.AddEditSite.setSelectedImage(uploadInfo.upload_url);
		},

		init: function () {

			if (localStorage.getItem('cached-data-response')) {
				Logger.log('Local storage cache hit for dataResponse', 'info');
				onResponseReceived(JSON.parse(localStorage.getItem('cached-data-response')), 'dataResponse');
			} else {
				Logger.log('Local storage cache miss for dataResponse', 'log');
				$.ajax({
					url: 'data.php',
					type: 'GET',
					data: {},
					dataType: 'json',
					success: function (response) {
						onResponseReceived(response, 'dataResponse');
						localStorage.setItem('cached-data-response', JSON.stringify(response));
					},
					error: Logger.jqueryAjaxErrorHandler
				});

			}

			if (localStorage.getItem('cached-state-response')) {
				Logger.log('Local storage cache hit for stateResponse', 'info');
				onResponseReceived(JSON.parse(localStorage.getItem('cached-state-response')), 'stateResponse');
			} else {
				Logger.log('Local storage cache miss for stateResponse', 'log');
				$.ajax({
					url: 'state.php',
					type: 'GET',
					data: {},
					success: function(response) {
						onResponseReceived(response, 'stateResponse');
						localStorage.setItem('cached-state-response', JSON.stringify(response));
					},
					error: Logger.jqueryAjaxErrorHandler
				});

			}

		}
	}

})();
