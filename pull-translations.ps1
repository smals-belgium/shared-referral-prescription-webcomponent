$LOCO_API_KEY = "1Mp2W1UEwGp2VZFfEAnoBEYf9mDjZliN"
$LOCALE_DIR="reuse/assets/i18n-common"

New-Item -ItemType Directory -Force -Path $LOCALE_DIR | Out-Null

$locales = @("en_GB", "nl_BE", "fr_BE", "de_DE")

foreach ($locale in $locales) {
    Write-Host "Pulling $locale translations..."

    $url = "https://localise.biz/api/export/locale/$locale.json"
    $outFile = "$LOCALE_DIR/$locale.json"

    try {
        Invoke-WebRequest -Uri $url -Headers @{"Authorization"="Loco $LOCO_API_KEY"} -OutFile $outFile -UseBasicParsing
        Write-Host "✅ $locale done"
    } catch {
        Write-Host "❌ Failed to pull $locale : $_"
        exit 1
    }
}

Write-Host "✅ All translations updated."

git add $LOCALE_DIR/*.json
