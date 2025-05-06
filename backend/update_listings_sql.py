#!/usr/bin/env python

"""
Script to update existing listings to ensure seller relationships are correctly set up
using direct SQL commands instead of ORM relationships.
"""

import os
import sys
import psycopg2
from psycopg2 import sql
from flask import Flask
from app import create_app
import os

# Get database URL from environment or use a default
DATABASE_URL = os.environ.get('DATABASE_URL')

def update_listings_sql():
    print("Updating listings using direct SQL commands...")
    
    if not DATABASE_URL:
        print("Error: DATABASE_URL environment variable not set")
        return 0, 1
    
    # Connect to the database
    try:
        # Handle Heroku's postgres:// vs postgresql:// URL format difference
        conn_string = DATABASE_URL
        if conn_string.startswith('postgres://'):
            conn_string = conn_string.replace('postgres://', 'postgresql://', 1)
            
        conn = psycopg2.connect(conn_string)
        cursor = conn.cursor()
        print("Connected to database successfully")
        
        # First, print out the current state of listings for debugging
        cursor.execute("""
            SELECT l.id, l.title, l.user_id, u.netid 
            FROM listings l
            LEFT JOIN users u ON l.user_id = u.id
            ORDER BY l.id
        """)
        
        listings = cursor.fetchall()
        print(f"Found {len(listings)} listings")
        
        for listing in listings:
            listing_id, title, user_id, netid = listing
            print(f"Listing {listing_id} ({title}): user_id={user_id}, netid={netid}")
        
        # We don't need to modify the database structure since user_netid is derived
        # from the relationship between listings and users
        
        # Count how many listings have issues (user_id with no corresponding user)
        cursor.execute("""
            SELECT COUNT(*) 
            FROM listings l
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.user_id IS NOT NULL AND u.id IS NULL
        """)
        
        bad_listings_count = cursor.fetchone()[0]
        print(f"Found {bad_listings_count} listings with invalid user_id")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return 0, bad_listings_count
        
    except Exception as e:
        print(f"Database error: {str(e)}")
        return 0, 1

if __name__ == "__main__":
    try:
        updated, errors = update_listings_sql()
        print(f"Script completed. Updated: {updated}, Errors/Issues detected: {errors}")
    except Exception as e:
        print(f"Script failed: {str(e)}")
        sys.exit(1) 