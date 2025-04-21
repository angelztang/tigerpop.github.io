#!/bin/bash

# Create a new branch for deployment
git checkout -b frontend-deploy

# Install dependencies
cd frontend
npm install

# Build the frontend
npm run build

# Move back to root directory
cd ..

# Create Procfile for serving static files
echo "web: serve -s frontend/build" > Procfile

# Create static.json for Heroku static buildpack configuration
echo '{
  "root": "frontend/build/",
  "routes": {
    "/**": "index.html"
  }
}' > static.json

# Add and commit changes
git add .
git commit -m "Deploy frontend"

# Push to Heroku frontend app
git push https://git.heroku.com/tigerpop-marketplace-frontend.git frontend-deploy:main -f

# Clean up: switch back to original branch and delete deployment branch
git checkout -
git branch -D frontend-deploy 