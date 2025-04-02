from app import create_app
from app.extensions import db
from app.models.models import User, Listing, ListingImage
from datetime import datetime
import os

def seed_database():
    app = create_app()
    app.app_context().push()  # Push an application context
    
    # Create tables
    db.create_all()
    
    # Create test user if it doesn't exist
    test_user = User.query.filter_by(username='testuser').first()
    if not test_user:
        test_user = User(
            username='testuser',
            email='test@example.com',
            password_hash='pbkdf2:sha256:260000$test_hash'
        )
        db.session.add(test_user)
        db.session.commit()
    
    # Create test listings
    test_listings = [
        {
            'title': 'Textbook: Introduction to Algorithms',
            'description': 'Used textbook in good condition. Includes all chapters and exercises.',
            'price': 45.00,
            'condition': 'good',
            'category': 'Books',
            'status': 'active',
            'views': 12,
            'seller_id': test_user.id,
            'images': ['textbook.jpg']
        },
        {
            'title': 'Gaming Laptop',
            'description': 'High-performance gaming laptop with RTX 3060. Used for 1 year.',
            'price': 800.00,
            'condition': 'like_new',
            'category': 'Electronics',
            'status': 'active',
            'views': 45,
            'seller_id': test_user.id,
            'images': ['laptop.jpg']
        },
        {
            'title': 'Bicycle',
            'description': 'Mountain bike in excellent condition. Recently serviced.',
            'price': 250.00,
            'condition': 'good',
            'category': 'Sports',
            'status': 'active',
            'views': 28,
            'seller_id': test_user.id,
            'images': ['bike.jpg']
        },
        {
            'title': 'Coffee Maker',
            'description': 'Brand new, never used coffee maker with timer.',
            'price': 35.00,
            'condition': 'new',
            'category': 'Home',
            'status': 'active',
            'views': 15,
            'seller_id': test_user.id,
            'images': ['coffee.jpg']
        },
        {
            'title': 'Guitar',
            'description': 'Acoustic guitar in fair condition. Comes with case.',
            'price': 150.00,
            'condition': 'fair',
            'category': 'Music',
            'status': 'active',
            'views': 33,
            'seller_id': test_user.id,
            'images': ['guitar.jpg']
        }
    ]
    
    # Add listings to database
    for listing_data in test_listings:
        # Remove images from listing data
        images = listing_data.pop('images')
        
        # Create listing
        listing = Listing(**listing_data)
        db.session.add(listing)
        db.session.flush()  # Get the listing ID
        
        # Add images
        for image_filename in images:
            image = ListingImage(filename=image_filename, listing_id=listing.id)
            db.session.add(image)
    
    db.session.commit()
    print("Database seeded successfully!")

if __name__ == '__main__':
    seed_database() 