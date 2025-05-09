#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting backend deployment..."

# Create and switch to deployment branch
echo "📦 Creating deployment branch..."
git checkout -b backend-deploy

# Copy backend files to root
echo "📂 Copying backend files..."
cp -r backend/* .
cp backend/.env .
cp backend/requirements.txt .
cp backend/Procfile .

# Add and commit changes
echo "💾 Committing changes..."
git add .
git commit -m "Deploy backend"

# Push to Heroku
echo "⬆️ Pushing to Heroku..."
git push https://git.heroku.com/tigerpop-marketplace-backend.git backend-deploy:main --force

# Cleanup
echo "🧹 Cleaning up..."
git checkout hannah
git branch -D backend-deploy

echo "✅ Backend deployment complete!" 