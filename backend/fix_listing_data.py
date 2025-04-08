from app import create_app
from app.extensions import db
from sqlalchemy import text

def fix_listing_data():
    app = create_app()
    
    try:
        with app.app_context():
            # First, let's create a backup of the current data
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS listing_backup AS 
                SELECT * FROM listing;
            """))
            
            # Update the misaligned data
            db.session.execute(text("""
                UPDATE listing 
                SET 
                    title = description,
                    description = created_at::text,
                    price = user_id::float,
                    created_at = CASE 
                        WHEN category ~ '^\\d{4}-\\d{2}-\\d{2}' 
                        THEN category::timestamp 
                        ELSE NOW() 
                    END,
                    category = title
                WHERE price IS NULL OR price::text ~ '[a-zA-Z]';
            """))
            
            db.session.commit()
            print("✅ Successfully fixed listing data!")
            
            # Print sample of updated data
            result = db.session.execute(text("SELECT * FROM listing LIMIT 5;"))
            print("\nSample of updated listing data:")
            for row in result:
                print(f"\nListing {row.id}:")
                print(f"  Title: {row.title}")
                print(f"  Description: {row.description}")
                print(f"  Price: ${row.price}")
                print(f"  Category: {row.category}")
                print(f"  Created At: {row.created_at}")
                
    except Exception as e:
        print("❌ Failed to fix listing data!")
        print(f"Error: {str(e)}")
        db.session.rollback()

if __name__ == '__main__':
    fix_listing_data() 