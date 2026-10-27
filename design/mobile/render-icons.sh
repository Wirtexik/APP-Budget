#!/bin/sh
# Jednorazowe generowanie ikon PWA z ikona.svg / ikona-pelna.svg (faza N etapu 4).
# SVG ma rozmycie (feGaussianBlur), którego next/og nie obsługuje, więc PNG
# renderuje Chrome headless, a wyniki trafiają do repo. Uruchamiać z katalogu
# głównego projektu: sh design/mobile/render-icons.sh
set -eu

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
SRC="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p public/icons

# render <svg> <rozmiar> <plik wynikowy>
render() {
  cat > "$TMP/icon.html" <<EOF
<!doctype html>
<style>html,body{margin:0;background:transparent}img{display:block;width:$2px;height:$2px}</style>
<img src="file://$SRC/$1">
EOF
  "$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --default-background-color=00000000 --window-size="$2,$2" \
    --screenshot="$TMP/out.png" "file://$TMP/icon.html" >/dev/null 2>&1
  mv "$TMP/out.png" "$3"
  echo "$3 ($2×$2)"
}

# Zaokrąglona z przezroczystymi rogami: Android („any”) i karta przeglądarki.
render ikona.svg 192 public/icons/icon-192.png
render ikona.svg 512 public/icons/icon-512.png
render ikona.svg 64 app/icon.png
# Pełne tło: maskable (system sam przycina kształt) i iOS (bez przezroczystości).
render ikona-pelna.svg 512 public/icons/icon-maskable-512.png
render ikona-pelna.svg 180 app/apple-icon.png
