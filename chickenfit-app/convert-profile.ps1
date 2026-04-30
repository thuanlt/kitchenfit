"$content = Get-Content 'store\profile.store.new.ts' -Raw
$content = $content.Substring(1, $content.Length - 2)
Set-Content 'store\profile.store.ts' -Value $content -NoNewline
Write-Host 'Converted successfully'"