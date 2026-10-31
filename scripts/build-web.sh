#!/bin/sh
# Builds the web version that can be added to a phone's home screen (PWA):
#   ./scripts/build-web.sh  ->  dist/web/
# Always the release 單機版 (approved questions only). Upload the whole folder
# to a static host; nothing is uploaded by this script.
set -e
cd "$(dirname "$0")/.."
./scripts/build.sh release offline > /dev/null
OUT=dist/web
rm -rf "$OUT"
mkdir -p "$OUT"
STAMP=$(shasum dist/it-emperor-release.html | cut -c1-10)
HEAD='<link rel="manifest" href="manifest.webmanifest" />\
  <link rel="apple-touch-icon" href="apple-touch-icon.png" />\
  <link rel="icon" href="icon-192.png" />\
  <meta name="apple-mobile-web-app-capable" content="yes" />\
  <meta name="mobile-web-app-capable" content="yes" />\
  <meta name="apple-mobile-web-app-title" content="IT帝" />\
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />\
  <meta name="robots" content="noindex" />\
  <script>if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js"));</script>\
</head>'
sed "s#</head>#$HEAD#" dist/it-emperor-release.html > "$OUT/index.html"
cp assets/web/manifest.webmanifest assets/web/icon-192.png assets/web/icon-512.png "$OUT/"
cp assets/web/icon-180.png "$OUT/apple-touch-icon.png"
sed "s#__BUILD__#$STAMP#" assets/web/sw.js > "$OUT/sw.js"
grep -q 'rel="manifest"' "$OUT/index.html" || { echo "✗ manifest link missing" >&2; exit 1; }
echo "built $OUT (cache $STAMP): $(ls "$OUT" | tr '\n' ' ')"
