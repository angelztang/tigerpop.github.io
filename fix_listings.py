#!/usr/bin/env python

"""
Script to fix listings with missing or invalid user_id relationships.
This script will assign a default user ID to any listings that have user_id values
that don't correspond to actual users in the database.
"""

import os
import sys
import psycopg2
from psycopg2 import sql

# Get database URL from environment or use a default
DATABASE_URL = os.environ.get('DATABASE_URL')

def fix_listings():
    if not DATABASE_URL:
        print("Error: DATABASE_URL environment variable not set")
        return 0, 1
    
    try:
        # Handle Heroku's postgres:// vs postgresql:// URL format difference
        conn_string = DATABASE_URL
        if conn_string.startswith('postgres://'):
            conn_string = conn_string.replace('postgres://', 'postgresql://', 1)
            
        print("Connecting to database...")
        conn = psycopg2.connect(conn_string)
        cursor = conn.cursor()
        print("Connected successfully")
        
        # Step 1: Find a default user to use for listings with invalid user_id
        print("Looking for default user...")
        cursor.execute("SELECT id, netid FROM users ORDER BY id LIMIT 1")
        default_user = cursor.fetchone()
        
        if not default_user:
            print("Error: No users found in the database")
            return 0, 1
            
        default_user_id, default_user_netid = default_user
        print(f"Using default user: ID={default_user_id}, netid={default_user_netid}")
        
        # Step 2: Identify listings with invalid user_id values
        print("Identifying listings with invalid user_id values...")
        cursor.execute("""
            SELECT l.id, l.title, l.user_id
            FROM listings l
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.user_id IS NOT NULL AND u.id IS NULL
        """)
        
        bad_listings = cursor.fetchall()
        
        if not bad_listings:
            print("No listings with invalid user_id found. All listings are properly linked.")
            return 0, 0
            
        print(f"Found {len(bad_listings)} listings with invalid user_id values:")
        for listing in bad_listings:
            listing_id, title, user_id = listing
            print(f"  - Listing {listing_id} ({title}): current user_id={user_id}, will set to {default_user_id}")
        
        # Step 3: Fix the invalid listings
        print("\nUpdating listings with valid user_id...")
        listing_ids = [l[0] for l in bad_listings]
        
        # Convert list to string for SQL query
        listing_ids_str = ','.join(str(id) for id in listing_ids)
        
        update_query = f"""
            UPDATE listings
            SET user_id = {default_user_id}
            WHERE id IN ({listing_ids_str})
        """
        
        cursor.execute(update_query)
        rows_updated = cursor.rowcount
        
        # Commit the changes
        conn.commit()
        print(f"Updated {rows_updated} listings to use user_id={default_user_id}")
        
        # Step 4: Verify the fix worked
        print("\nVerifying fix...")
        cursor.execute(f"""
            SELECT l.id, l.title, l.user_id, u.netid
            FROM listings l
            JOIN users u ON l.user_id = u.id
            WHERE l.id IN ({listing_ids_str})
        """)
        
        fixed_listings = cursor.fetchall()
        print(f"Successfully fixed {len(fixed_listings)} listings:")
        for listing in fixed_listings:
            listing_id, title, user_id, netid = listing
            print(f"  - Listing {listing_id} ({title}): now has user_id={user_id}, netid={netid}")
        
        cursor.close()
        conn.close()
        
        return rows_updated, 0
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return 0, 1

if __name__ == "__main__":
    try:
        fixed, errors = fix_listings()
        if errors > 0:
            print("Script completed with errors")
            sys.exit(1)
        else:
            print(f"Script completed successfully. Fixed {fixed} listings.")
            sys.exit(0)
    except Exception as e:
        print(f"Script failed: {str(e)}")
        sys.exit(1) 