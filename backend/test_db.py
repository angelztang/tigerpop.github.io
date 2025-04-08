from sqlalchemy import create_engine, text
import pandas as pd
from dotenv import load_dotenv
import os
from datetime import datetime

# Load environment variables
load_dotenv()

# Database connection URL
DATABASE_URL = "postgresql://uedn8ls7k3kba6:p5d4e7b56227582d7bf016ab1885026c2520fdcdbfbe19ce1bba8ae229bb072ad@ceqbglof0h8enj.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d1pka31jq79v2e"

def insert_test_listing():
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Test data
        test_listing = {
            'title': 'Test Listing',
            'description': 'This is a test listing',
            'price': 9.99,
            'category': 'Other',
            'status': 'available',
            'created_at': datetime.utcnow()
        }
        
        # Insert test listing
        with engine.connect() as connection:
            result = connection.execute(text("""
                INSERT INTO listing (title, description, price, category, status, created_at)
                VALUES (:title, :description, :price, :category, :status, :created_at)
                RETURNING id
            """), test_listing)
            connection.commit()
            
            listing_id = result.scalar()
            print(f"Successfully inserted test listing with ID: {listing_id}")
            
            # Retrieve the inserted listing
            listing = connection.execute(text("""
                SELECT * FROM listing WHERE id = :id
            """), {'id': listing_id}).first()
            
            print(f"""
            Inserted listing details:
            ID: {listing.id}
            Title: {listing.title}
            Description: {listing.description}
            Price: ${listing.price}
            Category: {listing.category}
            Status: {listing.status}
            Created At: {listing.created_at}
            """)
                
    except Exception as e:
        print(f"Error inserting test listing: {e}")

def test_connection():
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Test connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("Database connection successful!")
            
            # Get table names
            tables = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))
            print("\nAvailable tables:")
            for table in tables:
                print(f"- {table[0]}")
            
            # Get column information for listings table
            columns = connection.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'listing'
            """))
            print("\nListing table columns:")
            for col in columns:
                print(f"- {col[0]}: {col[1]}")
            
            # Get listings data with more details
            listings = connection.execute(text("""
                SELECT l.*, u.netid 
                FROM listing l
                LEFT JOIN users u ON l.user_id = u.id
                ORDER BY l.created_at DESC
                LIMIT 5
            """))
            print("\nMost recent listings:")
            for listing in listings:
                print(f"""
                ID: {listing.id}
                Title: {listing.title}
                Description: {listing.description}
                Price: ${listing.price}
                Category: {listing.category}
                Status: {listing.status}
                Created At: {listing.created_at}
                User: {listing.netid}
                """)
                
    except Exception as e:
        print(f"Error connecting to database: {e}")

if __name__ == "__main__":
    print("Testing connection and viewing current data:")
    test_connection()
    print("\nInserting test listing:")
    insert_test_listing() 