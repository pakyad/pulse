$files = Get-ChildItem -Recurse -Include *.ts,*.tsx | Where-Object { $_.FullName -notlike "*.next*" -and $_.FullName -notlike "*node_modules*" } | Select-String -Pattern "[^\x00-\x7F]" | Select-Object -ExpandProperty Path -Unique

foreach ($file in $files) {
  Write-Host "Cleaning $file"
  $content = [System.IO.File]::ReadAllText($file)
  $content = $content -replace '[─━═]', '-'
  $content = $content -replace '[—–]', '-'
  $content = $content -replace '[\u201C\u201D]', '"'
  $content = $content -replace '[\u2018\u2019]', "'"
  $content = $content -replace '[^\x00-\x7F]', ''
  
  # Write back as UTF8 without BOM
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
}

Write-Host "Done cleaning all files"
