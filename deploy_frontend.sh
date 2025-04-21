#!/bin/bash

# Create a new branch for deployment
git checkout -b frontend-deploy

# Copy frontend files to root
cp -r frontend/* .
cp frontend/.gitignore . 2>/dev/null || true

# Install dependencies and build
npm install
npm install -g serve
npm run build

# Create static.json for Heroku static buildpack configuration
echo '{
  "root": "build",
  "clean_urls": false,
  "routes": {
    "/**": "index.html"
  },
  "headers": {
    "/**": {
      "Cache-Control": "no-store, no-cache"
    },
    "/static/**": {
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  }
}' > static.json

# Add and commit changes
git add .
git commit -m "Deploy frontend"

# Push to Heroku frontend app
git push https://git.heroku.com/tigerpop-marketplace-frontend.git frontend-deploy:main -f

# Clean up: switch back to original branch and delete deployment branch
git checkout hannah
git branch -D frontend-deploy