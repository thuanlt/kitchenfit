"$content = Get-Content 'store\profile.store.new.ts' -Raw
$content = $content -replace '^\"', ''
$content = $content -replace '\"$', ''
Set-Content 'store\profile.store.ts' -Value $content -NoNewline
Write-Host 'Fixed profile.store.ts'"