# ============================================================
# compile.qutyshell.ps1 — Скрипт сборки оболочки для Quty.Launch
# ============================================================
# Назначение:
#   1. Читает текущую версию из public/manifest.json
#   2. Запрашивает новую версию (можно оставить текущую)
#   3. Запрашивает минимальную версию Quty.Launch (можно пропустить)
#   4. Обновляет public/manifest.json (без BOM)
#   5. Запускает сборку (npm run build)
#   6. Копирует файлы из dist/ во временную папку
#   7. Создаёт .qutyshell архив через WinRAR
#   8. Копирует итоговые файлы в репозиторий Quty.Launch.Server:
#      - store/shells/<ИмяОболочки>/<ИмяОболочки>.qutyshell
#      - store/shells/<ИмяОболочки>/manifest.json
#      - store/shells/<ИмяОболочки>/preview.png
#   9. Удаляет временную папку
#
# ПРИМЕЧАНИЕ:
#   - shell.json больше НЕ генерируется. Обновления оболочек идут
#     через store/shells.json, который автоматически собирает
#     GitHub Actions в репозитории Quty.Launch.Server при push
#     в store/shells/**.
#   - changelog больше не вводится — в новой схеме его нет.
#   - fileSize не задаётся вручную — GitHub Actions вычисляет его
#     из размера .qutyshell.
#   - datePublished вычисляется из даты коммита папки оболочки.
# ============================================================

# Отключаем вывод команд в консоль
$ErrorActionPreference = "Stop"

# --- Конфигурация ---
$PROJECT_NAME = "QutyAuto"                          # Имя оболочки (папка в store/shells/)
$MANIFEST_PATH = "public/manifest.json"             # Путь к манифесту
$DIST_PATH = "dist"                                 # Папка со сборкой
$TEMP_DIR = "temp_shell_build"                      # Временная папка для архива
$OUTPUT_FILE = "$PROJECT_NAME.qutyshell"            # Итоговый файл оболочки

# Путь к WinRAR (укажите свой!)
$WINRAR_PATH = "G:\Programs\WinRAR\WinRAR.exe"

# Путь к локальной копии репозитория Quty.Launch.Server
# Укажи свой путь. Пример: "D:\Android\Quty.Launch.Server"
$SERVER_REPO_PATH = "D:\Android\Quty.Launch.Server"

# Проверяем, существует ли WinRAR
if (-not (Test-Path $WINRAR_PATH)) {
    Write-Host "❌ Ошибка: WinRAR не найден по пути: $WINRAR_PATH" -ForegroundColor Red
    Write-Host "   Пожалуйста, укажите правильный путь к WinRAR.exe в скрипте." -ForegroundColor Yellow
    exit 1
}

# Проверяем, существует ли репозиторий сервера
if (-not (Test-Path $SERVER_REPO_PATH)) {
    Write-Host "❌ Ошибка: репозиторий Quty.Launch.Server не найден по пути: $SERVER_REPO_PATH" -ForegroundColor Red
    Write-Host "   Пожалуйста, укажите правильный путь к локальной копии Quty.Launch.Server." -ForegroundColor Yellow
    exit 1
}

# --- Функции ---

# Функция для удаления BOM-символа из строки
function Remove-BOM {
    param([string]$content)
    if ($content -and $content.Length -gt 0 -and $content[0] -eq [char]0xFEFF) {
        return $content.Substring(1)
    }
    return $content
}

# Функция для обновления JSON файла без BOM
function Update-JsonFile {
    param(
        [string]$FilePath,
        [string]$Key,
        [string]$Value
    )
    
    # Читаем файл
    $content = Get-Content -Path $FilePath -Raw -Encoding UTF8
    $content = Remove-BOM -content $content
    
    # Парсим JSON
    $json = $content | ConvertFrom-Json
    
    # Обновляем значение
    if ($Value) {
        $json | Add-Member -MemberType NoteProperty -Name $Key -Value $Value -Force
    } else {
        # Если значение пустое, удаляем поле
        $json.PSObject.Properties.Remove($Key)
    }
    
    # Преобразуем обратно в JSON (с отступами)
    $newContent = $json | ConvertTo-Json -Depth 10
    
    # Сохраняем без BOM
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($FilePath, $newContent, $utf8NoBom)
}

# --- Основной скрипт ---

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  🚀 СБОРКА ОБОЛОЧКИ $PROJECT_NAME" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Читаем текущую версию из manifest.json
Write-Host "📖 Чтение текущей версии из $MANIFEST_PATH..." -ForegroundColor Yellow

$manifestContent = Get-Content -Path $MANIFEST_PATH -Raw -Encoding UTF8
$manifestContent = Remove-BOM -content $manifestContent
$manifestJson = $manifestContent | ConvertFrom-Json

$currentVersion = $manifestJson.version
$currentMinQutyLaunch = $manifestJson.minQutyLaunchVersion

Write-Host "   Текущая версия оболочки: $currentVersion" -ForegroundColor Gray
if ($currentMinQutyLaunch) {
    Write-Host "   Текущая минимальная версия Quty.Launch: $currentMinQutyLaunch" -ForegroundColor Gray
} else {
    Write-Host "   Минимальная версия Quty.Launch не указана" -ForegroundColor Gray
}
Write-Host ""

# 2. Запрашиваем новую версию
Write-Host "📝 Введите новую версию (Enter для сохранения текущей $currentVersion):" -ForegroundColor Yellow
$newVersion = Read-Host
if ([string]::IsNullOrWhiteSpace($newVersion)) {
    $newVersion = $currentVersion
    Write-Host "   ✅ Оставлена версия: $newVersion" -ForegroundColor Green
} else {
    Write-Host "   ✅ Установлена версия: $newVersion" -ForegroundColor Green
}
Write-Host ""

# 3. Запрашиваем минимальную версию Quty.Launch
Write-Host "📝 Введите минимальную версию Quty.Launch (например, 0.1.0)" -ForegroundColor Yellow
Write-Host "   (Enter для пропуска, текущее значение: $currentMinQutyLaunch)" -ForegroundColor Gray
$minQutyLaunchVersion = Read-Host
if ([string]::IsNullOrWhiteSpace($minQutyLaunchVersion)) {
    $minQutyLaunchVersion = $currentMinQutyLaunch
    if ($minQutyLaunchVersion) {
        Write-Host "   ✅ Оставлена минимальная версия: $minQutyLaunchVersion" -ForegroundColor Green
    } else {
        Write-Host "   ⏭️ Поле minQutyLaunchVersion будет удалено" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✅ Установлена минимальная версия: $minQutyLaunchVersion" -ForegroundColor Green
}
Write-Host ""

# 4. Обновляем manifest.json
Write-Host "📝 Обновление $MANIFEST_PATH..." -ForegroundColor Yellow

# Обновляем версию
Update-JsonFile -FilePath $MANIFEST_PATH -Key "version" -Value $newVersion

# Обновляем или удаляем minQutyLaunchVersion
if ($minQutyLaunchVersion) {
    Update-JsonFile -FilePath $MANIFEST_PATH -Key "minQutyLaunchVersion" -Value $minQutyLaunchVersion
} else {
    # Если пусто — удаляем поле
    $content = Get-Content -Path $MANIFEST_PATH -Raw -Encoding UTF8
    $content = Remove-BOM -content $content
    $json = $content | ConvertFrom-Json
    $json.PSObject.Properties.Remove("minQutyLaunchVersion")
    $newContent = $json | ConvertTo-Json -Depth 10
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($MANIFEST_PATH, $newContent, $utf8NoBom)
}

Write-Host "   ✅ manifest.json обновлён" -ForegroundColor Green
Write-Host ""

# 5. Запускаем сборку
Write-Host "🔨 Запуск сборки (npm run build)..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка сборки! Скрипт остановлен." -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Сборка завершена" -ForegroundColor Green
Write-Host ""

# 6. Создаём временную папку
Write-Host "📁 Подготовка файлов для архива..." -ForegroundColor Yellow

if (Test-Path $TEMP_DIR) {
    Remove-Item -Path $TEMP_DIR -Recurse -Force
}
New-Item -Path $TEMP_DIR -ItemType Directory | Out-Null

# Копируем файлы из dist во временную папку
Copy-Item -Path "$DIST_PATH\*" -Destination $TEMP_DIR -Recurse -Force

# Копируем manifest.json и preview из public во временную папку
if (Test-Path "public\manifest.json") {
    Copy-Item -Path "public\manifest.json" -Destination $TEMP_DIR -Force
}
if (Test-Path "public\preview.png") {
    Copy-Item -Path "public\preview.png" -Destination $TEMP_DIR -Force
}
if (Test-Path "public\preview.jpg") {
    Copy-Item -Path "public\preview.jpg" -Destination $TEMP_DIR -Force
}
if (Test-Path "public\preview.ico") {
    Copy-Item -Path "public\preview.ico" -Destination $TEMP_DIR -Force
}

# Копируем favicon.ico если есть
if (Test-Path "public\favicon.ico") {
    Copy-Item -Path "public\favicon.ico" -Destination $TEMP_DIR -Force
}

Write-Host "   ✅ Файлы скопированы во временную папку" -ForegroundColor Green
Write-Host ""

# 7. Создаём ZIP архив через WinRAR (без сжатия)
Write-Host "📦 Создание архива $OUTPUT_FILE..." -ForegroundColor Yellow

# Удаляем старый архив если есть
if (Test-Path $OUTPUT_FILE) {
    Remove-Item -Path $OUTPUT_FILE -Force
}

# Формируем путь к архиву
$zipPath = Join-Path -Path (Get-Location) -ChildPath $OUTPUT_FILE

# Переходим во временную папку и создаём архив
Push-Location $TEMP_DIR

# WinRAR: a - добавить, -afzip - формат ZIP, -m0 - без сжатия, -r - рекурсивно
$arguments = "a -afzip -m0 -r `"$zipPath`" *"
$process = Start-Process -FilePath $WINRAR_PATH -ArgumentList $arguments -Wait -PassThru -WindowStyle Hidden

Pop-Location

if ($process.ExitCode -ne 0) {
    Write-Host "❌ Ошибка создания архива! Код ошибки: $($process.ExitCode)" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Архив создан: $OUTPUT_FILE" -ForegroundColor Green

# Проверяем размер архива
$fileSize = (Get-Item $OUTPUT_FILE).Length
$fileSizeMB = [math]::Round($fileSize / 1MB, 2)
Write-Host "   📊 Размер архива: $fileSizeMB MB" -ForegroundColor Gray
Write-Host ""

# 8. Копируем файлы в репозиторий Quty.Launch.Server
Write-Host "📁 Копирование файлов в Quty.Launch.Server..." -ForegroundColor Yellow

$serverShellsDir = Join-Path $SERVER_REPO_PATH "store\shells"
$targetShellDir = Join-Path $serverShellsDir $PROJECT_NAME

# Создаём папку store/shells/<PROJECT_NAME>/ если её ещё нет
if (-not (Test-Path $targetShellDir)) {
    New-Item -Path $targetShellDir -ItemType Directory -Force | Out-Null
    Write-Host "   📂 Создана папка: store/shells/$PROJECT_NAME/" -ForegroundColor Gray
}

# Копируем .qutyshell
Copy-Item -Path $OUTPUT_FILE -Destination (Join-Path $targetShellDir $OUTPUT_FILE) -Force
Write-Host "   ✅ $OUTPUT_FILE → store/shells/$PROJECT_NAME/" -ForegroundColor Green

# Копируем manifest.json
if (Test-Path "public\manifest.json") {
    Copy-Item -Path "public\manifest.json" -Destination (Join-Path $targetShellDir "manifest.json") -Force
    Write-Host "   ✅ manifest.json → store/shells/$PROJECT_NAME/" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ manifest.json не найден в public/" -ForegroundColor Yellow
}

# Копируем preview (любой из preview.png / preview.jpg / preview.ico)
$previewCopied = $false
foreach ($ext in @("png", "jpg", "ico")) {
    $previewSource = "public\preview.$ext"
    if (Test-Path $previewSource) {
        Copy-Item -Path $previewSource -Destination (Join-Path $targetShellDir "preview.$ext") -Force
        Write-Host "   ✅ preview.$ext → store/shells/$PROJECT_NAME/" -ForegroundColor Green
        $previewCopied = $true
        break
    }
}
if (-not $previewCopied) {
    Write-Host "   ⚠️ Превью не найдено в public/ (preview.png / .jpg / .ico)" -ForegroundColor Yellow
}

Write-Host ""

# 9. Удаляем временную папку
Write-Host "🧹 Очистка временных файлов..." -ForegroundColor Yellow
if (Test-Path $TEMP_DIR) {
    Remove-Item -Path $TEMP_DIR -Recurse -Force
}
Write-Host "   ✅ Временная папка удалена" -ForegroundColor Green
Write-Host ""

# 10. Выводим итоговую информацию
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  ✅ СБОРКА ЗАВЕРШЕНА УСПЕШНО!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Итоговые файлы в Quty.Launch.Server:" -ForegroundColor Yellow
Write-Host "   store/shells/$PROJECT_NAME/$OUTPUT_FILE ($fileSizeMB MB)" -ForegroundColor White
Write-Host "   store/shells/$PROJECT_NAME/manifest.json" -ForegroundColor White
Write-Host "   store/shells/$PROJECT_NAME/preview.*" -ForegroundColor White
Write-Host ""
Write-Host "📊 Информация о версии:" -ForegroundColor Yellow
Write-Host "   Версия оболочки: $newVersion" -ForegroundColor White
if ($minQutyLaunchVersion) {
    Write-Host "   Минимальная версия Quty.Launch: $minQutyLaunchVersion" -ForegroundColor White
} else {
    Write-Host "   Минимальная версия Quty.Launch: не указана" -ForegroundColor Gray
}
Write-Host ""
Write-Host "📌 Что дальше:" -ForegroundColor Yellow
Write-Host "   1. Закоммить изменения в Quty.Launch.Shell.$PROJECT_NAME" -ForegroundColor White
Write-Host "   2. Закоммить изменения в Quty.Launch.Server" -ForegroundColor White
Write-Host "      (git add store/shells/$PROJECT_NAME/ && git commit && git push)" -ForegroundColor Gray
Write-Host "   3. GitHub Actions автоматически пересоберёт store/shells.json" -ForegroundColor White
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Нажмите любую клавишу для выхода..." -ForegroundColor Yellow
Read-Host