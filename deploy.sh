#!/bin/bash

# Build the frontend
cd frontend
npm install
npm run build

# Move the build to the root directory
cd ..
rm -rf dist
mv frontend/build dist

# Create a simple package.json for Heroku
cat > package.json << EOL
{
  "name": "tigerpop-marketplace-frontend",
  "version": "1.0.0",
  "engines": {
    "node": "20.x"
  },
  "scripts": {
    "start": "echo 'Starting NGINX...'"
  }
}
EOL

# Create Procfile for NGINX
echo "web: bin/start-nginx-static" > Procfile

# Commit and push to Heroku
git add .
git commit -m "Deploy frontend"
git push -f heroku main 