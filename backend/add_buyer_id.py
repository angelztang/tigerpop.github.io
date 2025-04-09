from app import create_app
from app.extensions import db
from app.models.listing import Listing

def add_buyer_id_column():
    app = create_app()
    with app.app_context():
        # Add buyer_id column if it doesn't exist
        try:
            # Check if the column exists
            inspector = db.inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('listings')]
            
            if 'buyer_id' not in columns:
                # Add the column
                db.engine.execute('ALTER TABLE listings ADD COLUMN buyer_id INTEGER REFERENCES users(id)')
                print("Successfully added buyer_id column to listings table")
            else:
                print("buyer_id column already exists in listings table")
                
        except Exception as e:
            print(f"Error adding buyer_id column: {str(e)}")

if __name__ == '__main__':
    add_buyer_id_column() 