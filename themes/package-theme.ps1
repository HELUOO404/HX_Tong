# 主题资源包打包脚本
# 使用方法: .\package-theme.ps1 [theme-name]

param(
    [string]$ThemeName = "modern-blue"
)

$sourceDir = Join-Path $PSScriptRoot $ThemeName
$outputDir = Join-Path $PSScriptRoot "dist"

# 检查源目录
if (-not (Test-Path $sourceDir)) {
    Write-Error "找不到主题目录: $sourceDir"
    exit 1
}

# 读取主题配置
$configPath = Join-Path $sourceDir "theme.config.json"
if (-not (Test-Path $configPath)) {
    Write-Error "找不到 theme.config.json 文件"
    exit 1
}

$config = Get-Content $configPath | ConvertFrom-Json
$themeId = $config.theme.id
$version = $config.theme.version

Write-Host "🚀 开始打包主题资源包..." -ForegroundColor Green
Write-Host "   主题ID: $themeId" -ForegroundColor Cyan
Write-Host "   版本: $version" -ForegroundColor Cyan
Write-Host ""

# 确保输出目录存在
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
}

# 生成文件名
$zipName = "$themeId-v$version.zip"
$zipPath = Join-Path $outputDir $zipName

# 删除已存在的文件
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

# 创建临时目录
$tempDir = Join-Path $env:TEMP "theme-build-$(Get-Random)"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

# 复制文件到临时目录
$exclude = @("*.zip", "node_modules", ".git", "*.md")
Copy-Item -Path "$sourceDir\*" -Destination $tempDir -Recurse -Force -Exclude $exclude

# 创建 ZIP 文件
Add-Type -AssemblyName System.IO.Compression.FileSystem
$compressionLevel = [System.IO.Compression.CompressionLevel]::Optimal

# 删除已存在的 ZIP
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

# 创建 ZIP
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $zipPath, $compressionLevel, $false)

# 清理临时目录
Remove-Item $tempDir -Recurse -Force

# 显示结果
$zipInfo = Get-Item $zipPath
$sizeKB = [math]::Round($zipInfo.Length / 1KB, 2)

Write-Host "✅ 主题包打包完成!" -ForegroundColor Green
Write-Host "   文件名: $zipName" -ForegroundColor Cyan
Write-Host "   大小: $sizeKB KB" -ForegroundColor Cyan
Write-Host "   路径: $zipPath" -ForegroundColor Cyan
Write-Host ""

# 显示文件列表
Write-Host "📦 包内文件列表:" -ForegroundColor Yellow
Expand-Archive -Path $zipPath -DestinationPath "$tempDir-extract" -Force
Get-ChildItem "$tempDir-extract" -Recurse | Where-Object { -not $_.PSIsContainer } | ForEach-Object {
    $relativePath = $_.FullName.Substring(("$tempDir-extract").Length + 1)
    $fileSize = [math]::Round($_.Length / 1KB, 2)
    Write-Host "   $relativePath ($fileSize KB)" -ForegroundColor Gray
}

# 清理
Remove-Item "$tempDir-extract" -Recurse -Force

Write-Host ""
Write-Host "🎉 打包成功!" -ForegroundColor Green
