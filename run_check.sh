#!/bin/bash

# Script to run the application code check with proper DATABASE_URL

# Get the DATABASE_URL from Heroku
export DATABASE_URL=$(heroku config:get DATABASE_URL --app tigerpop-marketplace-backend)

echo "Using DATABASE_URL from Heroku"
echo "Running application code check..."

# Run the check script
python backend/check_app_code.py

echo "Check completed." 