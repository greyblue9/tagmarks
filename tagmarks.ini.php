; <?php exit(); __halt_compiler();
; // ---- Do not remove these 3 lines (ensure file not output by webserver) ----
; ?>



[Main Data File]
; This refers to the main data file that contains all bookmarks, tags, and
; settings. The file is in JSON format, e.g., a format that can be directly
; parsed as JSON data with nothing extra such as a JSONP technique.

main_data_filename = data.json

; Note -- please omit the trailing "/" on this path.
; An entry of just  "." means the web root directory where tagmarks PHPs reside.
main_data_relative_path = ../private/tagmarks


[Secure Vars File]

secure_vars_filename = secure_vars.ini.php

; NOTE: If you deploy tagmarks to a public-facing server, you should probably
; move the secure data file outside your web root! If you do so, just be sure
; to update the relative path here to something such as "../private/tagmarks"
secure_vars_relative_path = ../private/tagmarks

bypass_secure_vars = 0


[Developers]

json_indented_output = 0
