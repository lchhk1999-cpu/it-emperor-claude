#!/bin/sh
# Runs a jsc-style script: macOS built-in JavaScriptCore if present (no install
# needed), otherwise Node via scripts/node-shim.js (Linux / cloud routines).
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
if [ -x "$JSC" ]; then
  exec "$JSC" "$@"
elif command -v node >/dev/null 2>&1; then
  exec node "$(dirname "$0")/node-shim.js" "$@"
else
  echo "error: need macOS JavaScriptCore or Node.js to run $1" >&2
  exit 127
fi
