$html = Get-Content -Path 'dashboard_template.txt' -Raw; Set-Content -Path 'prototype_dashboard.html' -Value $html -Encoding UTF8
