-- TigerPop Database Fixes for Listing-User Relationships
-- Use these commands in the Heroku PostgreSQL console

-- 1. Diagnostic Queries

-- Show all listings with their related user information
SELECT l.id, l.title, l.user_id, u.id AS actual_user_id, u.netid
FROM listings l
LEFT JOIN users u ON l.user_id = u.id
ORDER BY l.id;

-- Identify listings with user_id values that don't match any user
SELECT l.id, l.title, l.user_id
FROM listings l
LEFT JOIN users u ON l.user_id = u.id
WHERE u.id IS NULL AND l.user_id IS NOT NULL
ORDER BY l.id;

-- Identify specific listing by ID (replace 234 with the problematic listing ID)
SELECT l.id, l.title, l.user_id, l.price, l.category, l.status, 
       u.id AS user_table_id, u.netid
FROM listings l
LEFT JOIN users u ON l.user_id = u.id
WHERE l.id = 234;

-- 2. Fix Commands

-- Update a specific listing's user_id to match a real user (example)
-- Replace [listing_id] with actual listing ID (e.g., 234)
-- Replace [correct_user_id] with a valid user ID from the users table
UPDATE listings 
SET user_id = [correct_user_id]
WHERE id = [listing_id];

-- Find a user by netid to get their ID (useful to find correct_user_id)
SELECT id, netid, email 
FROM users 
WHERE netid = 'somenetid';

-- Example: Fix listing 234 to use user ID 1 (assuming user 1 is the admin or default user)
-- UPDATE listings SET user_id = 1 WHERE id = 234;

-- 3. Batch Fixes

-- Fix all listings that belong to a specific user but have wrong user_id
-- Replace [old_user_id] with the incorrect ID
-- Replace [correct_user_id] with the proper user ID
UPDATE listings
SET user_id = [correct_user_id]
WHERE user_id = [old_user_id];

-- 4. Verification Queries

-- Verify a specific listing was updated correctly
SELECT l.id, l.title, l.user_id, u.netid
FROM listings l
JOIN users u ON l.user_id = u.id
WHERE l.id = [listing_id];

-- Count how many listings might still have issues
SELECT COUNT(*)
FROM listings l
LEFT JOIN users u ON l.user_id = u.id
WHERE u.id IS NULL AND l.user_id IS NOT NULL; 