$file = 'app/me/page.tsx'
$content = Get-Content $file -Raw

# Fix 1: Add fullName to profile object
$content = $content -replace '(const profile: UserProfile = \{)', '$1`n    fullName: fullName || "",'

# Fix 2: Change TextInput to use draft instead of direct store update
$content = $content -replace 'onChange=\{v => setStoreProfile\(\{ fullName: v \}\)\}', 'onChange={v => setDraft(d => ({ ...(d ?? profile), fullName: v }))}'
$content = $content -replace 'value=\{fullName \|\| ""\}', 'value={editDraft.fullName || ""}'

# Fix 3: Update save function to use draft.fullName
$content = $content -replace 'display_name: fullName,', 'display_name: updated.fullName,'

Set-Content $file -Value $content -NoNewline
Write-Host 'Bug fixed successfully!'