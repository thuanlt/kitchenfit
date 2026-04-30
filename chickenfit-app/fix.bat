"@echo off
setlocal enabledelayedexpansion
set "file=store\profile.store.new.ts"
set "out=store\profile.store.ts"
powershell -Command "$content = Get-Content '%file%' -Raw; $content = $content.Substring(1, $content.Length - 2); Set-Content '%out%' -Value $content -NoNewline"
echo Done
"