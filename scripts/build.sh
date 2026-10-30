#!/bin/sh
# Builds one self-contained playable file.
#   ./scripts/build.sh           -> dist/it-emperor.html (dev: labelled test questions)
#   ./scripts/build.sh release   -> dist/it-emperor-release.html (approved questions only)
set -e
cd "$(dirname "$0")/.."
MODE="${1:-dev}"
OUT="dist/it-emperor.html"
[ "$MODE" = "release" ] && OUT="dist/it-emperor-release.html"
mkdir -p dist
./scripts/jsc.sh scripts/build.js -- "$MODE" > "$OUT"
echo "built $OUT ($(wc -c < "$OUT" | tr -d ' ') bytes, mode=$MODE)"
