#!/bin/sh
# Builds one folder to upload for the trial (試玩版):
#   dist/site/        學生正式版（加到主畫面：「IT帝」）
#   dist/site/demo/   老師示範版（加到主畫面：「IT帝 示範」）
# Approved questions only. Nothing is uploaded by this script.
set -e
cd "$(dirname "$0")/.."
./scripts/build-web.sh > /dev/null
./scripts/build-web.sh demo > /dev/null
rm -rf dist/site
cp -R dist/web dist/site
cp -R dist/web-demo dist/site/demo
# Ask search engines not to list the site (the link is only shared by hand).
printf 'User-agent: *\nDisallow: /\n' > dist/site/robots.txt
echo "built dist/site: $(find dist/site -type f | wc -l | tr -d ' ') files ($(du -sh dist/site | cut -f1))"
