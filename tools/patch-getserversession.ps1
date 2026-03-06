$root = Join-Path $PSScriptRoot '..'
$apiDir = Join-Path $root 'src\app\api'
$files = Get-ChildItem -Path $apiDir -Recurse -File -Filter 'route.ts'
$needle = "const session = await getServerSession(authOptions);"
$replacement = "const session = (await getServerSession(authOptions as any)) as { user?: { id?: string; role?: string; email?: string } } | null;"
$changed = 0
foreach ($f in $files) {
  $c = Get-Content -LiteralPath $f.FullName -Raw
  if ($c.Contains($needle)) {
    $c2 = $c.Replace($needle, $replacement)
    if ($c2 -ne $c) {
      Set-Content -LiteralPath $f.FullName -Value $c2 -NoNewline
      $changed++
    }
  }
}
Write-Host "Patched $changed files."