#!/bin/bash

# Script to start the development server, automatically freeing port 3001 if needed

PORT=3001

# Function to kill process on port
free_port() {
  PID=$(lsof -ti:$PORT 2>/dev/null)
  if [ ! -z "$PID" ]; then
    echo "⚠️  Port $PORT is in use by process $PID. Killing it..."
    kill $PID 2>/dev/null
    sleep 1
    
    # Check if process is still running (force kill if needed)
    if lsof -ti:$PORT >/dev/null 2>&1; then
      echo "⚠️  Process still running, force killing..."
      kill -9 $PID 2>/dev/null
      sleep 1
    fi
    
    if ! lsof -ti:$PORT >/dev/null 2>&1; then
      echo "✅ Port $PORT is now free"
    else
      echo "❌ Failed to free port $PORT"
      exit 1
    fi
  else
    echo "✅ Port $PORT is available"
  fi
}

# Free the port before starting
free_port

# Start the development server
echo "🚀 Starting development server..."
npx tsx watch src/server.ts






