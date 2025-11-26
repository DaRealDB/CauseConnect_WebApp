#!/bin/bash

# Script to start the development server, automatically freeing port 3001 if needed

PORT=3001

# Function to kill process on port
free_port() {
  # Try multiple methods to find and kill processes on the port
  for pid in $(lsof -ti:$PORT 2>/dev/null); do
    echo "⚠️  Port $PORT is in use by process $pid. Killing it..."
    kill $pid 2>/dev/null
    sleep 0.5
    if kill -0 $pid 2>/dev/null; then
      echo "⚠️  Process still running, force killing..."
      kill -9 $pid 2>/dev/null
      sleep 0.5
    fi
  done
  
  # Also try fuser as backup
  fuser -k $PORT/tcp 2>/dev/null || true
  sleep 1
  
  # Verify port is free
  if lsof -ti:$PORT >/dev/null 2>&1 || fuser $PORT/tcp >/dev/null 2>&1; then
    echo "❌ Failed to free port $PORT. Please manually kill the process."
    exit 1
  else
    echo "✅ Port $PORT is available"
  fi
}

# Free the port before starting
free_port

# Start the development server
echo "🚀 Starting development server..."
npx tsx watch src/server.ts









