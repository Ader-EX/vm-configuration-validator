#!/bin/bash

echo "Setting up project..."

if [ -d "./frontend" ]; then
  echo "Setting up the frontend..."
  cd ./frontend || exit
  npm install
  echo "Starting frontend (npm run dev)..."
  npm run dev &
  FRONTEND_PID=$!
  cd ..
else
  echo "Frontend folder not found!"
fi


if [ -d "./backend" ]; then
  echo "Setting up the backend..."
  cd ./backend || exit
  npm install
  echo "Starting backend (npm run dev)..."
  npm run dev &
  BACKEND_PID=$!
  cd ..
else
  echo "Backend folder not found!"
fi

echo "Both servers are running....."

wait
