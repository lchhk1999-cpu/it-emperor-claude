#!/bin/sh
# Builds one self-contained playable file.
#   ./scripts/build.sh [dev|release|demo] [online|offline]
#   mode:    dev = labelled test questions; release = approved questions only
#   edition: online = with 校際公會 (and later friends / leaderboard);
#            offline = 單機版, no guild (user decision 2026-10-31: ship offline first)
#   Defaults: dev -> online, release -> offline.
#   dev online      -> dist/it-emperor.html
#   dev offline     -> dist/it-emperor-offline.html
#   release offline -> dist/it-emperor-release.html
#   release online  -> dist/it-emperor-release-online.html
#   demo            -> dist/it-emperor-demo.html (老師示範版: release questions,
#                      單機版, rich starting profile, every story level open)
set -e
cd "$(dirname "$0")/.."
MODE="${1:-dev}"
EDITION="${2:-}"
if [ "$MODE" = "demo" ]; then
  mkdir -p dist
  ./scripts/jsc.sh scripts/build.js -- release offline demo > dist/it-emperor-demo.html
  echo "built dist/it-emperor-demo.html ($(wc -c < dist/it-emperor-demo.html | tr -d ' ') bytes, 老師示範版)"
  exit 0
fi
if [ -z "$EDITION" ]; then
  if [ "$MODE" = "release" ]; then EDITION=offline; else EDITION=online; fi
fi
case "$MODE-$EDITION" in
  dev-online) OUT="dist/it-emperor.html" ;;
  dev-offline) OUT="dist/it-emperor-offline.html" ;;
  release-offline) OUT="dist/it-emperor-release.html" ;;
  release-online) OUT="dist/it-emperor-release-online.html" ;;
  *) echo "usage: $0 [dev|release] [online|offline]" >&2; exit 2 ;;
esac
mkdir -p dist
./scripts/jsc.sh scripts/build.js -- "$MODE" "$EDITION" > "$OUT"
echo "built $OUT ($(wc -c < "$OUT" | tr -d ' ') bytes, mode=$MODE, edition=$EDITION)"
