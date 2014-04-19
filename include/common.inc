<?php

namespace \

define('CR', "\r");
define('LF', "\n");
define('CRLF', "\r\n");


define('INCLUDE_ROOT', __DIR__);
define('WEB_ROOT', INCLUDE_ROOT.'/..');
define('PRIVATE_ROOT', WEB_ROOT.'/../private');





spl_autoload_register(function($fullClassName) {

	$bslashPos = strpos('\\', $fullClassName);

	if ($bslashPos !== false && $bslashPos !== 0) {
		// $fullClassName includes namespace
		$namespacePart = substr($fullClassName, 0, $bslashPos);
		$classPart = substr($fullClassName, $bslashPos+1);
		require_once(INCLUDE_ROOT."/{$namespacePart}/{$classPart}.class.inc");
	} else {
		// no namespace
		// ensure no leading '\'
		$className = ltrim($fullClassName, '\\');
		require_once(INCLUDE_ROOT."/{$className}.class.inc");
	}

});


