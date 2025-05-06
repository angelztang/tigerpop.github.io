-- SQL script to check and fix listing 234

-- 1. First, verify listing 234 exists and check its current user_id
SELECT id, title, user_id, status 
FROM listings 
WHERE id = 234;

-- 2. Confirm that user with ID 109 exists (we already know it does from the screenshot)
SELECT id, netid 
FROM users 
WHERE id = 109;

-- 3. Try to directly fetch the listing with its related user to see if the relationship works
SELECT l.id, l.title, l.user_id, u.id AS actual_user_id, u.netid
FROM listings l
LEFT JOIN users u ON l.user_id = u.id
WHERE l.id = 234;

-- 4. If the relationship is broken despite user 109 existing, verify the join syntax in the application
-- The issue might be in how the backend queries for the listings

-- 5. Try refreshing the relationship by re-setting the user_id to the same value
UPDATE listings 
SET user_id = 109 
WHERE id = 234;

-- 6. Verify the fix worked by checking if the listing now has a netid through the relationship
SELECT l.id, l.title, l.user_id, u.netid 
FROM listings l
JOIN users u ON l.user_id = u.id
WHERE l.id = 234; 