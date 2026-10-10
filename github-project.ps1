$ErrorActionPreference = 'Continue'

# === НАСТРОЙКИ ===
$OUT_FILE = 'all-code.txt'

# ============================================================
# [0/4] Добавляем всё новое/изменённое в git
# ============================================================
Write-Host ''
Write-Host '[0/4] git add . ...'
Write-Host ''

# Проверка, что мы в git-репозитории
$gitCheck = & git rev-parse --is-inside-work-tree 2>&1
if ($gitCheck.Trim() -ne 'true') {
    Write-Host '[!] Not a git repository. Run this from project root.'
    Read-Host 'Press Enter to close'
    exit 1
}

# Добавляем всё (учитывая .gitignore). Ошибки не критичны — просто предупреждения.
& git add . 2>&1 | ForEach-Object { Write-Host "  $_" }

Write-Host ''

# ============================================================
# [1/4] Собираем файлы
# ============================================================
Write-Host '[1/4] Collecting files from git...'
Write-Host ''

# Расширения файлов, которые нужно забрать
$extFilter = @(
    '.jsx','.js','.ts','.tsx',
    '.css','.scss',
    '.html',
    '.java',
    '.json','.yml','.yaml',
    '.xml','.properties',
    '.md','.sql'
)

# Собираем только то, что отслеживается git'ом (без мусора, без node_modules, без target)
$tracked = & git ls-files 2>&1
$files = $tracked | Where-Object {
    $ext = [System.IO.Path]::GetExtension($_)
    $ext -in $extFilter
} | Sort-Object

$total = $files.Count
Write-Host "Files: $total"
Write-Host ''

if ($total -eq 0) {
    Write-Host '[!] No files found.'
    Read-Host 'Press Enter to close'
    exit 1
}

# ============================================================
# [2/4] Собираем в одну большую txt-шку
# ============================================================
Write-Host '[2/4] Building one big text file...'
Write-Host ''

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("# TaskBoard code snapshot")
[void]$sb.AppendLine("# Commit: $((& git rev-parse HEAD).Trim())")
[void]$sb.AppendLine("# Date:   $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
[void]$sb.AppendLine("# Files:  $total")
[void]$sb.AppendLine("#")

$errors = 0
foreach ($path in $files) {
    $cleanPath = $path -replace '\\', '/'
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("==================== $cleanPath ====================")
    try {
        $content = Get-Content -Raw -Path $path -Encoding UTF8
        [void]$sb.AppendLine($content)
    } catch {
        [void]$sb.AppendLine("[!] Failed to read: $_")
        $errors++
    }
}

# Пишем в UTF-8 без BOM
[System.IO.File]::WriteAllText(
    (Join-Path (Get-Location) $OUT_FILE),
    $sb.ToString(),
    [System.Text.UTF8Encoding]::new($false)
)

$size = (Get-Item $OUT_FILE).Length

Write-Host ("Saved: {0}" -f $OUT_FILE)
Write-Host ("Size:  {0:N0} bytes ({1:N1} KB, {2:N2} MB)" -f $size, ($size / 1KB), ($size / 1MB))
if ($errors -gt 0) {
    Write-Host ("Errors while reading: {0}" -f $errors) -ForegroundColor Yellow
}
Write-Host ''

# ============================================================
# [3/4] Готово
# ============================================================
Write-Host '[3/4] Done.'
Write-Host ''
Write-Host '============================================================'
Write-Host "  File: $OUT_FILE"
Write-Host "  Size: $([math]::Round($size/1MB, 2)) MB"
Write-Host '============================================================'
Write-Host ''
Write-Host 'Next step:'
Write-Host "  Открой $OUT_FILE и прикрепи его в чат."
Write-Host ''

# ============================================================
# [4/4] Закрываем консоль
# ============================================================
Write-Host 'Closing in 3 seconds...'
Start-Sleep -Seconds 3
exit