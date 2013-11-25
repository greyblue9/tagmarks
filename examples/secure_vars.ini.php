; <?php exit(); __halt_compiler();
; // ---- Do not remove these 3 lines (ensure file not output by webserver) ----
; ?>


; Add your secure settings and setting pieces (such as part of a path) here.
; They will become available to data.json.
;
; If you run a hosted environment, be sure to place this file OUTSIDE of your
; web root for added security!
;
; Usage within data.json is very simple--these JSON snippets show example usage:
;
;      "password": "$secure{xyz_password}
;      "backup_path": "$secure{my_private_path}/automated/backups
;
; Summary of the above: Use $secure{<varname>} in your JSON, and define
; <varname> and its value in the secure vars INI file (this file).
; Category names are for your purposes only (no effect on tagmarks behavior).


[Examples]

example_var_a = "secure_value_a"
example_var_b = "secure_value_b"


[My Category]

