#!/bin/bash

# Script to run SQL commands to fix listing 234 in Heroku PostgreSQL

echo "Running fix for listing 234..."

# Step 1: Verify listing 234 exists
echo "Checking listing 234..."
heroku pg:psql --app tigerpop-marketplace-backend -c "SELECT id, title, user_id, status FROM listings WHERE id = 234;"

# Step 2: Confirm user 109 exists
echo "Checking user 109..."
heroku pg:psql --app tigerpop-marketplace-backend -c "SELECT id, netid FROM users WHERE id = 109;"

# Step 3: Check relationship
echo "Checking relationship..."
heroku pg:psql --app tigerpop-marketplace-backend -c "SELECT l.id, l.title, l.user_id, u.id AS actual_user_id, u.netid FROM listings l LEFT JOIN users u ON l.user_id = u.id WHERE l.id = 234;"

# Step 4: Update user_id to refresh relationship
echo "Refreshing relationship..."
heroku pg:psql --app tigerpop-marketplace-backend -c "UPDATE listings SET user_id = 109 WHERE id = 234;"

# Step 5: Verify fix worked
echo "Verifying fix..."
heroku pg:psql --app tigerpop-marketplace-backend -c "SELECT l.id, l.title, l.user_id, u.netid FROM listings l JOIN users u ON l.user_id = u.id WHERE l.id = 234;"

echo "Fix completed." 