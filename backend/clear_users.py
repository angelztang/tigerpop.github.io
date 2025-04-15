from app import create_app
from app.extensions import db
from app.models import User, Listing, HeartedListing, ListingImage

def clear_tables():
    app = create_app()
    with app.app_context():
        try:
            # Delete hearted listings first (they reference both users and listings)
            num_hearted_deleted = db.session.query(HeartedListing).delete()
            print(f"Deleted {num_hearted_deleted} hearted listings")
            
            # Clear listing images first (they reference listings)
            num_images_deleted = db.session.query(ListingImage).delete()
            print(f"Cleared {num_images_deleted} listing images")
            
            # Clear listings table (preserve structure)
            num_listings_deleted = db.session.query(Listing).delete()
            print(f"Cleared {num_listings_deleted} listings")
            
            # Now clear users table (preserve structure)
            num_users_deleted = db.session.query(User).delete()
            print(f"Cleared {num_users_deleted} users")
            
            db.session.commit()
            print("Successfully cleared all tables while preserving their structures")
        except Exception as e:
            db.session.rollback()
            print(f"Error clearing tables: {str(e)}")

if __name__ == '__main__':
    clear_tables() 