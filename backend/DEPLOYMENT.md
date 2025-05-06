# TigerPop Backend Updates Deployment

This document outlines the steps to deploy the latest changes to the TigerPop backend to fix issues with seller contact information and email notifications.

## Changes Made

1. Added a new endpoint: `/api/listing/<id>/request` to handle buyer requests
2. Created a diagnostic script `update_listings_sql.py` to verify user relationships

## Deployment Steps

### 1. Deploy Code Changes to Heroku

```bash
# Make sure you're logged into Heroku
heroku login

# Push the latest changes to Heroku
git push heroku main
```

### 2. Run the Script to Verify Listing Relationships

After deploying, run the diagnostic script to check for any issues with user relationships:

```bash
# Connect to a Heroku shell
heroku run bash --app tigerpop-marketplace-backend

# Run the diagnostic script
python backend/update_listings_sql.py
```

### 3. Direct SQL Commands for Problematic Listings

If the script identifies listings with missing relationships, you can run the following SQL commands directly:

```bash
# Connect to Heroku PostgreSQL
heroku pg:psql --app tigerpop-marketplace-backend
```

Then run these SQL commands:

```sql
-- List all listings with their associated seller netid (useful for inspection)
SELECT l.id, l.title, l.user_id, u.netid 
FROM listings l
LEFT JOIN users u ON l.user_id = u.id
ORDER BY l.id;

-- Identify listings with problems (null netid but valid user_id)
SELECT l.id, l.title, l.user_id
FROM listings l
LEFT JOIN users u ON l.user_id = u.id
WHERE l.user_id IS NOT NULL AND u.id IS NULL;

-- If there are specific listings you need to fix, you can update their user_id:
-- Example: UPDATE listings SET user_id = [correct_user_id] WHERE id = [listing_id];
```

## Verifying the Changes

1. Check that API requests to `/api/listing/<id>/request` now return a 200 status instead of 404
2. Verify that listings include the `user_netid` field in their responses by using this query:
   ```sql
   SELECT l.id, l.title, u.netid 
   FROM listings l
   JOIN users u ON l.user_id = u.id
   WHERE l.id = 234; -- Check specific listing
   ```
3. Test that email notifications work properly for listings

## Rollback Plan

If issues occur, you can revert to the previous version by:

1. Rolling back the Heroku deployment:
   ```
   heroku rollback --app tigerpop-marketplace-backend
   ```

2. If database queries caused issues, you can revert specific changes:
   ```sql
   -- Example: Revert a user_id change if needed
   UPDATE listings SET user_id = [original_user_id] WHERE id = [listing_id];
   ```

## Contact

If you have questions or need assistance with the deployment, please contact the development team. 