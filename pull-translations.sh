#!/bin/bash

LOCO_API_KEY="1Mp2W1UEwGp2VZFfEAnoBEYf9mDjZliN"
LOCALE_DIR="reuse/assets/i18n-common"

mkdir -p "$LOCALE_DIR"

LOCALES=("en_GB" "nl_BE" "fr_BE" "de_DE")

for locale in "${LOCALES[@]}"; do
  echo "Pulling $locale translations..."

  HTTP_CODE=$(curl -s -w "%{http_code}" \
    "https://localise.biz/api/export/locale/$locale.json" \
    -H "Authorization: Loco $LOCO_API_KEY" \
    -o "$LOCALE_DIR/$locale.json")

  if [ "$HTTP_CODE" -ne 200 ]; then
    echo "❌ Failed to pull $locale (HTTP $HTTP_CODE)"
    cat "$LOCALE_DIR/$locale.json"  # Show error message
    exit 1
  fi
done

echo "✅ All translations updated."
git add "$LOCALE_DIR"/*.json
