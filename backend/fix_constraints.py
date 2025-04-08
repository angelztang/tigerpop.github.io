import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def fix_constraints():
    # Get the database URL from environment variable
    DATABASE_URL = os.getenv('DATABASE_URL')
    
    try:
        # Connect to the database
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # First, let's clear any existing listing images
        cur.execute("DELETE FROM listing_image;")
        
        # Then clear any existing listings
        cur.execute("DELETE FROM listing;")
        
        # Drop the existing foreign key constraint
        cur.execute("""
            ALTER TABLE listing 
            DROP CONSTRAINT IF EXISTS listing_user_id_fkey;
        """)
        
        # Add the new foreign key constraint
        cur.execute("""
            ALTER TABLE listing 
            ADD CONSTRAINT listing_user_id_fkey 
            FOREIGN KEY (user_id) 
            REFERENCES users(id);
        """)
        
        # Commit the changes
        conn.commit()
        print("✅ Database constraints updated successfully!")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    fix_constraints() 