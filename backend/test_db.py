from app import create_app, db
from app.models import Listing, ListingImage, User
from werkzeug.security import generate_password_hash

def test_database():
    app = create_app()
    with app.app_context():
        try:
            # Create a test user if it doesn't exist
            test_user = User.query.filter_by(email='test@example.com').first()
            if not test_user:
                test_user = User(
                    username='testuser',
                    email='test@example.com',
                    password=generate_password_hash('testpassword')
                )
                db.session.add(test_user)
                db.session.commit()
                print('Test user created with ID:', test_user.id)
            
            # Create a test listing
            test_listing = Listing(
                title='Test Couch',
                description='A comfortable test couch',
                price=199.99,
                category='couches',
                user_id=test_user.id
            )
            
            # Add a test image
            test_image = ListingImage(url='/uploads/test_couch.jpg')
            test_listing.images.append(test_image)
            
            # Save to database
            db.session.add(test_listing)
            db.session.commit()
            print('Test listing created with ID:', test_listing.id)
            
            # Query all listings
            all_listings = Listing.query.all()
            print(f'\nAll listings in database ({len(all_listings)}):\n')
            for listing in all_listings:
                print(f'- {listing.title} (${listing.price}) - {len(listing.images)} images')
                print(f'  Description: {listing.description}')
                print(f'  Category: {listing.category}')
                print(f'  Status: {listing.status}')
                print(f'  Images: {[img.url for img in listing.images]}')
                print()
                
        except Exception as e:
            print(f"Error occurred: {str(e)}")
            db.session.rollback()

if __name__ == '__main__':
    test_database() 