#!/bin/sh
# macOS built-in JavaScriptCore shell (no Node/Xcode needed).
exec /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc "$@"
