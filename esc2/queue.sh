#!/bin/bash
# render each named shot's full frame range (resumable: existing frames are skipped). "pad:wide" → pad.py -- --cam wide
cd "$(dirname "$0")/.."
for s in "$@"; do
  f=${s%%:*}; c=${s#*:}; extra=(); [ "$c" != "$s" ] && extra=(--cam "$c")
  blender -b --python esc2/shots/$f.py -- "${extra[@]}" 2>&1 | grep -E "DONE|Error|Traceback" | grep -v distutils
done
echo QUEUE_DONE "$@"
