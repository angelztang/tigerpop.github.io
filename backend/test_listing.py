from app import create_app, db
import json
import threading
import time

app = create_app()

def run_flask_server():
    app.run(host='localhost', port=8000, debug=False)

def test_create_listing():
    # Start Flask server in a separate thread
    server_thread = threading.Thread(target=run_flask_server)
    server_thread.daemon = True
    server_thread.start()
    
    # Wait for server to start
    time.sleep(2)
    
    # Test data
    listing_data = {
        'title': 'Test Listing',
        'description': 'This is a test listing',
        'price': 99.99,
        'category': 'other'
    }
    
    try:
        # Create a test listing directly using the app context
        with app.app_context():
            from app.models import Listing
            
            new_listing = Listing(
                title=listing_data['title'],
                description=listing_data['description'],
                price=float(listing_data['price']),
                category=listing_data['category'],
                user_id=1  # Using default user_id
            )
            
            db.session.add(new_listing)
            db.session.commit()
            
            print("Test listing created successfully!")
            print("Listing ID:", new_listing.id)
            print("Title:", new_listing.title)
            print("Price:", new_listing.price)
            
            # Verify the listing exists
            listing = Listing.query.get(new_listing.id)
            if listing:
                print("Listing verified in database!")
            else:
                print("Error: Listing not found in database!")
                
    except Exception as e:
        print("Error creating listing:", str(e))

if __name__ == '__main__':
    test_create_listing() 