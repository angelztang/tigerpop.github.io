#!/bin/bash

# Remove temporary directories
rm -rf logs/ instance/ __pycache__/ dist/ venv/ migrations/ uploads/

# Move backend files back to backend directory
mv wsgi.py test_*.py requirements.txt run.py manage.py drop_columns.py app/ backend/ 2>/dev/null

# Remove backend-related files from root
rm -f Procfile runtime.txt .env server.js

# Keep only frontend-related files
rm -f deploy.sh deploy_backend.sh

# Clean up any remaining Python cache files
find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null
find . -type d -name "*.pyc" -exec rm -f {} + 2>/dev/null

echo "Cleanup completed!" 