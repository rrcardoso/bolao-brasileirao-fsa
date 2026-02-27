#!/usr/bin/env bash
set -e

echo "=== Building frontend ==="
cd frontend
npm install
npm run build
cd ..

echo "=== Copying frontend build to backend ==="
rm -rf backend/frontend_dist
mkdir -p backend/frontend_dist
cp -r frontend/dist/* backend/frontend_dist/

echo "=== Installing backend dependencies ==="
cd backend
pip install poetry
poetry install --no-root

echo "=== Build complete ==="
