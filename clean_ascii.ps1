$files = Get-ChildItem -Recurse -Include *.ts,*.tsx | Where-Object { $_.FullName -notlike "*.next*" -and $_.FullName -notlike "*node_modules*" } | Select-String -Pattern "[^\x00-\x7F]" | Select-Object -ExpandProperty Path -Unique

foreach ($file in $files) {
  $content = Get-Content $file -Raw -Encoding UTF8
  $content = $content -replace '[─━═]', '-'
  $content = $content -replace '[—–]', '-'
  $content = $content -replace '[\u201C\u201D]', '"'
  $content = $content -replace '[\u2018\u2019]', "'"
  $content = $content -replace '[^\x00-\x7F]', ''
  Set-Content $file -Value $content -Encoding UTF8 -NoNewline
}

Write-Host "Done cleaning all files"
