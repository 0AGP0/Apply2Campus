# Read stdin, remove lines containing Co-authored-by, write to stdout
$content = [System.Console]::In.ReadToEnd()
$lines = $content -split "`n"
foreach ($line in $lines) {
  if ($line -notmatch 'Co-authored-by') {
    [System.Console]::Out.WriteLine($line)
  }
}
