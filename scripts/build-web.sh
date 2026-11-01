#!/bin/sh
# Builds the web version that can be added to a phone's home screen (PWA):
#   ./scripts/build-web.sh        ->  dist/web/       (release 單機版)
#   ./scripts/build-web.sh demo   ->  dist/web-demo/  (老師示範版)
# Approved questions only. Upload the whole folder to a static host; nothing
# is uploaded by this script.
set -e
cd "$(dirname "$0")/.."
if [ "$1" = "demo" ]; then
  ./scripts/build.sh demo > /dev/null
  SRC=dist/it-emperor-demo.html; OUT=dist/web-demo; APPNAME="IT帝 示範"; FULLNAME="IT帝：老師示範版"; KIND=demo
else
  ./scripts/build.sh release offline > /dev/null
  SRC=dist/it-emperor-release.html; OUT=dist/web; APPNAME="IT帝"; FULLNAME="IT帝：ICT 學習冒險"; KIND=web
fi
rm -rf "$OUT"
mkdir -p "$OUT"
STAMP=$(shasum "$SRC" | cut -c1-10)
HEAD='<link rel="manifest" href="manifest.webmanifest" />\
  <link rel="apple-touch-icon" href="apple-touch-icon.png" />\
  <link rel="icon" href="icon-192.png" />\
  <meta name="apple-mobile-web-app-capable" content="yes" />\
  <meta name="mobile-web-app-capable" content="yes" />\
  <meta name="apple-mobile-web-app-title" content="'"$APPNAME"'" />\
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />\
  <meta name="robots" content="noindex" />\
  <script>if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js"));</script>\
</head>'
# 驗證碼 (src/core/gate.js): if secrets/access-code.txt exists (gitignored),
# the page asks for that code once per device. Only a salted hash goes in.
CODEFILE=secrets/access-code.txt
if [ -f "$CODEFILE" ]; then
  CODE=$(tr -cd '0-9A-Za-z' < "$CODEFILE" | tr 'a-z' 'A-Z')
  [ -n "$CODE" ] || { echo "✗ $CODEFILE has no letters or digits" >&2; exit 1; }
  ACCESS=$(printf '%s' "it-emperor-access-v1:$CODE" | shasum -a 256 | cut -d' ' -f1)
  HEAD='<script>window.ITE_ACCESS = "'"$ACCESS"'";</script>\
  '"$HEAD"
fi
sed "s#</head>#$HEAD#" "$SRC" > "$OUT/index.html"
sed -e "s#\"name\": \"IT帝：ICT 學習冒險\"#\"name\": \"$FULLNAME\"#" -e "s#\"short_name\": \"IT帝\"#\"short_name\": \"$APPNAME\"#" assets/web/manifest.webmanifest > "$OUT/manifest.webmanifest"
cp assets/web/icon-192.png assets/web/icon-512.png "$OUT/"
cp assets/web/icon-180.png "$OUT/apple-touch-icon.png"
sed -e "s#__BUILD__#$STAMP#" -e "s#__KIND__#$KIND#" assets/web/sw.js > "$OUT/sw.js"
grep -q 'rel="manifest"' "$OUT/index.html" || { echo "✗ manifest link missing" >&2; exit 1; }
echo "built $OUT (cache $STAMP): $(ls "$OUT" | tr '\n' ' ')"
