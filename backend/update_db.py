from app import create_app
import psycopg2
import os

def update_database():
    app = create_app()
    with app.app_context():
        # Get database URL from environment or config
        database_url = os.environ.get('DATABASE_URL', 'postgresql://localhost/tigerpop')
        
        # Connect to the database
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        try:
            # Drop old columns
            cur.execute("""
                ALTER TABLE users 
                DROP COLUMN IF EXISTS username,
                DROP COLUMN IF EXISTS email,
                DROP COLUMN IF EXISTS password_hash,
                DROP COLUMN IF EXISTS created_at,
                DROP COLUMN IF EXISTS updated_at;
            """)
            
            # Add netid column
            cur.execute("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS netid VARCHAR(80) UNIQUE NOT NULL DEFAULT '';
            """)
            
            conn.commit()
            print("Successfully updated users table schema")
            
        except Exception as e:
            print(f"Error: {e}")
            conn.rollback()
        
        finally:
            cur.close()
            conn.close()

if __name__ == '__main__':
    update_database() 