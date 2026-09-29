#!/bin/sh
# Turns the raw captures in .capture/ into the images in docs/. Needs ffmpeg.
#   node tools/build.mjs && node tools/capture.mjs && sh tools/make-media.sh
set -e
cd "$(dirname "$0")/.."
C=.capture
mkdir -p docs
ffmpeg -v error -y -i $C/og.png -vf scale=1200:630 docs/og.png
ffmpeg -v error -y -framerate 1 -i $C/still-%d.png -vf "scale=480:-1,tile=3x3:padding=6:color=0x04050A" -frames:v 1 -q:v 3 docs/scenes.jpg
ffmpeg -v error -y -framerate 12 -i $C/frames/f%03d.png \
  -vf "split[a][b];[a]palettegen=max_colors=192:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" \
  -loop 0 docs/zoom.gif
ls -l docs
