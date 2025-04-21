#!/bin/bash

# Create and switch to a new deployment branch
git checkout -b backend-deploy

# Copy backend files to root
cp -r backend/* .
cp backend/.env .
cp backend/.gitignore .

# Install dependencies
pip install -r requirements.txt

# Create Procfile for backend
echo "web: gunicorn wsgi:app" > Procfile

# Add and commit changes
git add .
git commit -m "Deploy backend"

# Push to Heroku backend app
git push https://git.heroku.com/tigerpop-marketplace-backend.git backend-deploy:main -f

# Run database migrations
heroku run --app tigerpop-marketplace-backend "PYTHONPATH=/app flask db upgrade"

# Clean up: switch back to previous branch and delete deployment branch
git checkout -
git branch -D backend-deploy 