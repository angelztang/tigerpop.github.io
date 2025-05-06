#!/usr/bin/env python

"""
Script to update existing listings to ensure seller relationships and fix any missing data.
This will help ensure existing listings can be used for email notifications.
"""

import os
import sys
from flask import Flask
from app import create_app
from app.models import Listing, User
from app.extensions import db

# Create app context
app = create_app()
app.app_context().push()

def update_listings():
    print("Updating listings to ensure seller relationships...")
    
    # Get all listings
    listings = Listing.query.all()
    print(f"Found {len(listings)} listings to check")
    
    updated_count = 0
    error_count = 0
    
    for listing in listings:
        try:
            # Check if there's a seller relationship
            if not listing.seller:
                # Try to find the seller by user_id
                seller = User.query.filter_by(id=listing.user_id).first()
                if seller:
                    print(f"Listing {listing.id} ({listing.title}): Fixing seller relationship")
                    # This will update the relationship in the ORM
                    listing.seller = seller
                    updated_count += 1
                else:
                    print(f"Listing {listing.id} ({listing.title}): Could not find seller with ID {listing.user_id}")
                    error_count += 1
            else:
                print(f"Listing {listing.id} ({listing.title}): Seller relationship OK")
        except Exception as e:
            print(f"Error processing listing {listing.id}: {str(e)}")
            error_count += 1
    
    # Commit the changes
    if updated_count > 0:
        db.session.commit()
        print(f"Updated {updated_count} listings")
    else:
        print("No listings needed updating")
    
    if error_count > 0:
        print(f"Warning: Could not fix {error_count} listings")
    
    return updated_count, error_count

if __name__ == "__main__":
    try:
        updated, errors = update_listings()
        print(f"Script completed. Updated: {updated}, Errors: {errors}")
    except Exception as e:
        print(f"Script failed: {str(e)}")
        sys.exit(1) 