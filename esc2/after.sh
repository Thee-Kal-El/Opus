#!/bin/bash
# wait for a previous queue log to say QUEUE_DONE, then render more shots
LOG=$1; shift; until grep -q QUEUE_DONE "$LOG" 2>/dev/null; do sleep 20; done
exec "$(dirname "$0")/queue.sh" "$@"
