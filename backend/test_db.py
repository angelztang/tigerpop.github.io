from app import create_app, db
from sqlalchemy import text

def test_db_connection():
    app = create_app()
    with app.app_context():
        try:
            # Get database URL from config
            print(f"Database URL: {app.config['SQLALCHEMY_DATABASE_URI']}")
            
            # Test connection by executing a simple query
            result = db.session.execute(text('SELECT 1'))
            print("✅ Successfully connected to the database!")
            
            # List all tables
            result = db.session.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))
            print("\nTables in database:")
            for row in result:
                print(f"- {row[0]}")
            
            # Get listing table structure
            result = db.session.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'listing'
            """))
            print("\nListing table structure:")
            for row in result:
                print(f"- {row[0]}: {row[1]}")
            
            # Count rows in listing table
            result = db.session.execute(text("SELECT COUNT(*) FROM listing"))
            count = result.scalar()
            print(f"\nNumber of rows in listing table: {count}")
            
            # Get sample data
            if count > 0:
                result = db.session.execute(text("SELECT * FROM listing LIMIT 5"))
                print("\nSample listing data:")
                for row in result:
                    print(row)
                    
        except Exception as e:
            print("❌ Failed to connect to the database!")
            print(f"Error: {str(e)}")

if __name__ == '__main__':
    test_db_connection() 