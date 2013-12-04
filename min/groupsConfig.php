<?php
/**
 * Groups configuration for default Minify implementation
 * @package Minify
 */

/** 
 * You may wish to use the Minify URI Builder app to suggest
 * changes. http://yourdomain/min/builder/
 *
 * See http://code.google.com/p/minify/wiki/CustomSource for other ideas
 **/

return array(
	'tagmarks-all.js' => array(
		'//res/jquery-2.0.3.min.js.old',
		'//res/jquery-ui-1.10.3.custom.min.js.old',
		'//res/tagmarks.js',
		'//res/tagmarks-utils.js',
		'//res/tagmarks-upload-frame.js'
	),
	'tagmarks-all.css' => array(
		'//res/tagmarks.css'
	)
);
