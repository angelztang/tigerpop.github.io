from app import create_app
from app.extensions import db
from sqlalchemy import text

def drop_listings_table():
    app = create_app()
    
    with app.app_context():
        try:
            # Drop the listings table
            db.session.execute(text('DROP TABLE IF EXISTS listings CASCADE;'))
            db.session.commit()
            print("✅ Successfully dropped the listings table!")
            
            # Drop the listing_images table
            db.session.execute(text('DROP TABLE IF EXISTS listing_images CASCADE;'))
            db.session.commit()
            print("✅ Successfully dropped the listing_images table!")
            
        except Exception as e:
            print("❌ Error dropping tables:")
            print(str(e))
            db.session.rollback()

if __name__ == '__main__':
    drop_listings_table() 