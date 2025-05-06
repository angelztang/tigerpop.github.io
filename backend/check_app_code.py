#!/usr/bin/env python

"""
Script to check for potential issues in how the application derives user_netid from listings.
This will examine how the relationship between listings and users is set up.
"""

import os
import sys
import psycopg2
from psycopg2 import sql
import inspect
import importlib.util
import re

# Get database URL from environment or use a default
DATABASE_URL = os.environ.get('DATABASE_URL')

def check_listing_model():
    """Check the Listing model definition for issues"""
    print("Checking Listing model definition...")
    
    model_paths = [
        'app/models/listing.py',
        'backend/app/models/listing.py',
        './app/models/listing.py',
        './backend/app/models/listing.py'
    ]
    
    for path in model_paths:
        if os.path.exists(path):
            with open(path, 'r') as f:
                content = f.read()
                print(f"Found model file: {path}")
                
                # Check for seller relationship definition
                seller_relation = re.search(r'seller\s*=\s*db\.relationship\(.*\)', content)
                if seller_relation:
                    print(f"Found seller relationship: {seller_relation.group(0)}")
                else:
                    print("WARNING: Could not find seller relationship in model file")
                
                # Check for user_id foreign key definition
                user_id_fk = re.search(r'user_id\s*=\s*db\.Column\(.*ForeignKey\(.*\)', content)
                if user_id_fk:
                    print(f"Found user_id foreign key: {user_id_fk.group(0)}")
                else:
                    print("WARNING: Could not find user_id foreign key in model file")
                    
                break
    else:
        print("Could not find Listing model file. Please check the path.")

def check_to_dict_method():
    """Check if the to_dict method in Listing model includes user_netid"""
    print("\nChecking to_dict method in Listing model...")
    
    model_paths = [
        'app/models/listing.py',
        'backend/app/models/listing.py',
        './app/models/listing.py',
        './backend/app/models/listing.py'
    ]
    
    for path in model_paths:
        if os.path.exists(path):
            with open(path, 'r') as f:
                content = f.read()
                
                # Check if to_dict includes user_netid
                to_dict_method = re.search(r'def\s+to_dict\s*\(.*?\):.*?return.*?}', content, re.DOTALL)
                if to_dict_method:
                    to_dict_content = to_dict_method.group(0)
                    print("Found to_dict method")
                    
                    if 'user_netid' in to_dict_content:
                        print("to_dict method includes user_netid")
                    else:
                        print("WARNING: to_dict method doesn't include user_netid")
                else:
                    print("WARNING: Could not find to_dict method in Listing model")
                
                break
    else:
        print("Could not find Listing model file. Please check the path.")

def check_route_user_netid():
    """Check how user_netid is added in the API routes"""
    print("\nChecking how user_netid is added in API routes...")
    
    routes_paths = [
        'app/routes/listing_routes.py',
        'backend/app/routes/listing_routes.py',
        './app/routes/listing_routes.py',
        './backend/app/routes/listing_routes.py'
    ]
    
    for path in routes_paths:
        if os.path.exists(path):
            with open(path, 'r') as f:
                content = f.read()
                
                # Check how user_netid is added
                user_netid_additions = re.findall(r"listing_dict\['user_netid'\]\s*=\s*(.*)", content)
                if user_netid_additions:
                    for addition in user_netid_additions:
                        print(f"Found user_netid addition in API route: {addition}")
                        
                        # Check specifically for the pattern we found in our investigation
                        if 'listing.seller.netid if listing.seller else None' in addition:
                            print("Confirmed API uses 'listing.seller.netid if listing.seller else None' pattern")
                else:
                    print("WARNING: Could not find how user_netid is added in API routes")
                
                break
    else:
        print("Could not find listing routes file. Please check the path.")

def check_db_consistency():
    """Check database for consistency in the users and listings tables"""
    print("\nChecking database for consistency...")
    
    if not DATABASE_URL:
        print("Error: DATABASE_URL environment variable not set")
        return
    
    try:
        # Handle Heroku's postgres:// vs postgresql:// URL format difference
        conn_string = DATABASE_URL
        if conn_string.startswith('postgres://'):
            conn_string = conn_string.replace('postgres://', 'postgresql://', 1)
            
        conn = psycopg2.connect(conn_string)
        cursor = conn.cursor()
        
        # Check specific listing 234
        cursor.execute("""
            SELECT l.id, l.title, l.user_id, u.id AS actual_user_id, u.netid
            FROM listings l
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.id = 234
        """)
        
        listing_data = cursor.fetchone()
        if listing_data:
            listing_id, title, user_id, actual_user_id, netid = listing_data
            print(f"Listing 234: title='{title}', user_id={user_id}, actual_user_id={actual_user_id}, netid={netid}")
            
            if actual_user_id is None or netid is None:
                print("WARNING: Join did not find a matching user for listing 234")
            else:
                print("Join successfully found user for listing 234")
                
        else:
            print("Could not find listing 234 in database")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error checking database: {str(e)}")

if __name__ == "__main__":
    print("Checking for issues in the TigerPop application code")
    print("==================================================\n")
    
    check_listing_model()
    check_to_dict_method()
    check_route_user_netid()
    
    if DATABASE_URL:
        check_db_consistency()
    else:
        print("\nCannot check database consistency: DATABASE_URL not set")
    
    print("\nCheck complete. Please review the findings above to identify potential issues.") 