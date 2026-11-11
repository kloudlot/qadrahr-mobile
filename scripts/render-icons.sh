#!/bin/sh
# Renders the app icon, adaptive icon (and its themed silhouette), splash mark and notification icon
# from their SVG sources in assets/source/. Run: npm run icons
#
# Rebranding for an operator means editing those SVGs (or dropping in
# PNGs of the same names and sizes) and rebuilding — icons are baked into
# the binary, so they cannot follow a tenant's branding at runtime.
#
# Needs rsvg-convert (brew install librsvg).
set -eu
cd "$(dirname "$0")/../assets"
command -v rsvg-convert >/dev/null || { echo "rsvg-convert not found: brew install librsvg" >&2; exit 1; }

rsvg-convert -w 1024 -h 1024 source/icon.svg -o icon.png
rsvg-convert -w 1024 -h 1024 source/adaptive-icon.svg -o adaptive-icon.png
rsvg-convert -w 1024 -h 1024 source/adaptive-monochrome.svg -o adaptive-monochrome.png
rsvg-convert -w 1024 -h 1024 source/splash-icon.svg -o splash-icon.png
rsvg-convert -w 96 -h 96 source/notification-icon.svg -o notification-icon.png
echo "rendered icon.png, adaptive-icon.png, adaptive-monochrome.png, splash-icon.png, notification-icon.png"
