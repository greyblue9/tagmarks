<?php
// @author greyblue9
// @date 2013-09-11 00:13 EDT
//
// Add your secure settings and setting pieces (such as part of a path)
// into the below array returned from get_secure_vars(), and they will
// become available to data.json
//
// Usage within data.json is very simple, as you will see in these
// example JSON snippets:
//
//      "password": "$secure{xyz_password}
//
//      "backup_path": "$secure{my_private_path}/automated/backups
//
// Summary of the above: Use $secure{<varname>} in your JSON,
//                        and define <varname> and its value here.

function get_secure_vars() {

	return array(
		// Place all your secure settings values here
		'example_var_a' => 'secure_value_a',
		'example_var_b' => 'secure_value_b'
	);

}


// NOTE: TagMarks will check to make sure the get_secure_vars
// function is present and expects it to return an associative array.
// If an attempt is made to run this script directly, the following
// will take place:

if (basename($argv[0]) == basename(__FILE__)) {
	
	print(
		"Dear user sitting at ${$_SERVER['REMOTE_HOST']}, \n\n".
		"This script is not intended to be executed directly. \n\n".
		"Sincerely, \n".
		"-- A curious webserver on port ${$_SERVER['SERVER_PORT']}");
	exit();
}
