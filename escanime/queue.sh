#!/bin/bash
# render the anime reel's shots (resumable)
cd "$(dirname "$0")/.."
for s in "$@"; do blender -b --python escanime/scene.py -- --shot $s 2>&1 | grep -E "DONE|Error|Traceback" | grep -v distutils; done
echo QUEUE_DONE "$@"
