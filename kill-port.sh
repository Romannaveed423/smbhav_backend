#!/bin/bash
# Helper script to kill processes on port 3000

PORT=${1:-3000}
PIDS=$(lsof -ti:$PORT)

if [ -z "$PIDS" ]; then
  echo "No processes found on port $PORT"
else
  echo "Killing processes on port $PORT: $PIDS"
  kill -9 $PIDS
  sleep 1
  if lsof -ti:$PORT > /dev/null 2>&1; then
    echo "Warning: Some processes may still be running"
  else
    echo "Successfully freed port $PORT"
  fi
fi

