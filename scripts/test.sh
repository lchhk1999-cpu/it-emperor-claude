#!/bin/sh
# Runs all tests. Exit code is non-zero if anything fails.
#  1. JS unit tests (JavaScriptCore on macOS, Node elsewhere)
#  2. Python question-bank importer tests (if python3 is available)
#  3. Release bundle contains no dev samples and no non-approved questions
#  4. 單機版 bundles contain no guild screen; the online edition does
#  5. The web version (加到主畫面) builds with its manifest, icons and offline worker
#  6. The 老師示範版 build is flagged and holds approved questions only
set -e
cd "$(dirname "$0")/.."
./scripts/jsc.sh tests/run.js
if command -v python3 >/dev/null 2>&1; then
  python3 -m unittest discover -s tests -p "test_*.py"
else
  echo "! python3 not found: importer tests skipped"
fi
./scripts/build.sh release > /dev/null
if grep -q "DEV-0\|devSampleQuestions = \[" dist/it-emperor-release.html; then
  echo "✗ release bundle contains dev sample questions"; exit 1
fi
if grep -q '"review_status": "\(review\|draft\|rejected\)"' dist/it-emperor-release.html; then
  echo "✗ release bundle contains non-approved questions"; exit 1
fi
if grep -q "教師審核（故事模式）" dist/it-emperor-release.html; then
  echo "✗ release bundle contains the dev-only teacher review screen"; exit 1
fi
total=$(grep -o '"review_status": "[a-z]*"' dist/it-emperor-release.html | wc -l | tr -d ' ')
approved=$(grep -o '"review_status": "approved"' dist/it-emperor-release.html | wc -l | tr -d ' ')
if [ "$total" != "$approved" ]; then
  echo "✗ release bundle: $approved of $total questions are approved"; exit 1
fi
if grep -q "<title>[^<]*原型" dist/it-emperor-release.html; then
  echo "✗ release bundle is still titled as a prototype"; exit 1
fi
if grep -q '"source_note"' dist/it-emperor-release.html; then
  echo "✗ release bundle contains internal question source notes"; exit 1
fi
echo "✓ release bundle: no dev samples, no source notes; all $approved questions are approved"
# 4. Editions: 單機版 (offline) has no guild screen or demo guilds; online keeps them.
./scripts/build.sh release online > /dev/null
./scripts/build.sh dev offline > /dev/null
for f in dist/it-emperor-release.html dist/it-emperor-offline.html; do
  if grep -q "ITE.guildUi = \|ITE.demoGuilds" "$f"; then
    echo "✗ $f (單機版) contains the guild screen or demo guilds"; exit 1
  fi
  grep -q 'ITE.EDITION = "offline"' "$f" || { echo "✗ $f is not marked offline"; exit 1; }
done
grep -q "ITE.guildUi = " dist/it-emperor-release-online.html || { echo "✗ online edition is missing the guild screen"; exit 1; }
echo "✓ editions: 單機版 has no guild; online edition keeps it"
# 5. Web version for the home screen.
./scripts/build-web.sh > /dev/null
for f in index.html manifest.webmanifest sw.js icon-192.png icon-512.png apple-touch-icon.png; do
  [ -s "dist/web/$f" ] || { echo "✗ web version is missing $f"; exit 1; }
done
grep -q "__BUILD__\|__KIND__" dist/web/sw.js && { echo "✗ web worker cache name was not stamped"; exit 1; }
sed -n '/<body>/,$p' dist/web/index.html > dist/.web-body
sed -n '/<body>/,$p' dist/it-emperor-release.html > dist/.release-body
cmp -s dist/.web-body dist/.release-body || { echo "✗ web version is not the release build"; exit 1; }
rm -f dist/.web-body dist/.release-body
echo "✓ web version: release build with manifest, icons and offline worker"
# 6. 老師示範版: release questions only, flagged as demo; the normal builds are not.
./scripts/build.sh demo > /dev/null
grep -q "ITE.DEMO = true" dist/it-emperor-demo.html || { echo "✗ demo build is not flagged"; exit 1; }
for f in dist/it-emperor-release.html dist/web/index.html; do
  grep -q "ITE.DEMO = true" "$f" && { echo "✗ $f is flagged as the demo"; exit 1; }
done
if grep -q "DEV-0\|devSampleQuestions = \[\|\"source_note\"" dist/it-emperor-demo.html || grep -q '"review_status": "\(review\|draft\|rejected\)"' dist/it-emperor-demo.html; then
  echo "✗ demo build has dev samples, source notes or unapproved questions"; exit 1
fi
./scripts/build-web.sh demo > /dev/null
grep -q '"short_name": "IT帝 示範"' dist/web-demo/manifest.webmanifest || { echo "✗ demo web manifest name"; exit 1; }
echo "✓ demo: approved questions only; normal builds are not demo"
