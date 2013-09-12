<?php



function get_secure_vars() {

	return array(
		// Place all your secure settings values here
		'd6r_ftp_server' => 'ftp.pinproject.com',
		'd6r_ftp_base_path' => '/public_html/d6r/speed-reader/advanced-dials',
		'd6r_ftp_username' => 'pinproje',
		'd6r_ftp_password' => '(Zenith667!)'
	);

}






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
