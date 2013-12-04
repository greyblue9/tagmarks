/**
 * @file main.js
 * @author David Reilly <greylue9@gmail.com>
 * @see {@link http://github.com/greyblue9/tagmarks}
 */


require.config({
	baseUrl: 'js',
	paths: {
		jquery: 'lib/jquery-2.0.3',
		jqueryui: 'lib/jquery-ui-1.10.3.tagmarks',
		tmpl: 'lib/tmpl'
	}
});


require(['jquery', 'tagmarks', 'logger', 'tmpl'], function($, tagmarks, logger, tmpl) {
	'use strict';

	tagmarks.init();

	logger.log('tagmarks', tagmarks, 'info');

});

