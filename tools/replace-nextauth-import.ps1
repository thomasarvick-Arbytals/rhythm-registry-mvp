$root = Join-Path $PSScriptRoot '..'
$apiDir = Join-Path $root 'src\app\api'
$files = Get-ChildItem -Path $apiDir -Recurse -File -Filter '*.ts'
$changed = 0
foreach ($f in $files) {
  $c = Get-Content -LiteralPath $f.FullName -Raw
  if ($c -like "*from 'next-auth';*") {
    $c2 = $c.Replace("from 'next-auth';", "from 'next-auth/next';")
    if ($c2 -ne $c) {
      Set-Content -LiteralPath $f.FullName -Value $c2 -NoNewline
      $changed++
    }
  }
}
Write-Host "Updated $changed files."