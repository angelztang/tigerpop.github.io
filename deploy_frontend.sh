#!/bin/bash

# Create a new branch for deployment
git checkout -b frontend-deploy

# Install dependencies
npm install

# Build the frontend
npm run build

# Create Procfile for serving static files
echo "web: serve -s build" > Procfile

# Create static.json for Heroku static buildpack configuration
echo '{
  "root": "build/",
  "routes": {
    "/**": "index.html"
  }
}' > static.json

# Add and commit changes
git add .
git commit -m "Deploy frontend"

# Push to Heroku
git push heroku frontend-deploy:main --force

# Clean up: switch back to original branch and delete deployment branch
git checkout -
git branch -D frontend-deploy 