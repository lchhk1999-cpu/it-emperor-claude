#!/bin/sh
# Runs all unit tests, then checks the release bundle contains no dev questions.
# Exit code is non-zero if anything fails.
set -e
cd "$(dirname "$0")/.."
./scripts/jsc.sh tests/run.js
./scripts/build.sh release > /dev/null
if grep -q "DEV-0\|devSampleQuestions = \[" dist/it-emperor-release.html; then
  echo "✗ release bundle contains dev sample questions"; exit 1
fi
echo "✓ release bundle contains no dev sample questions"
