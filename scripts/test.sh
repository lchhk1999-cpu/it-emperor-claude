#!/bin/sh
# Runs all tests. Exit code is non-zero if anything fails.
#  1. JS unit tests (JavaScriptCore on macOS, Node elsewhere)
#  2. Python question-bank importer tests (if python3 is available)
#  3. Release bundle contains no dev samples and no non-approved questions
#  4. 單機版 bundles contain no guild screen; the online edition does
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
echo "✓ release bundle: no dev samples; all $approved questions are approved"
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
