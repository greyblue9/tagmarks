Set WshShell = WScript.CreateObject("Wscript.Shell")
WshShell.Run "QuickPHP.exe /Port=5309 /Root=.. /DefaultDoc=index.php /Start", 7, false