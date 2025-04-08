import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def check_schema():
    # Get the database URL from environment variable
    DATABASE_URL = os.getenv('DATABASE_URL')
    
    try:
        # Connect to the database
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Get all tables
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = cur.fetchall()
        
        print("\nTables in database:")
        for table in tables:
            print(f"\n{table[0]} table:")
            # Get columns for each table
            cur.execute(f"""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '{table[0]}'
            """)
            columns = cur.fetchall()
            for col in columns:
                print(f"  - {col[0]}: {col[1]}")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check_schema() 