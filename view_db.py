from app import create_app, db
from app.models import User, Listing, ListingImage

app = create_app()

with app.app_context():
    print("\n=== Users ===")
    users = User.query.all()
    for user in users:
        print(f"ID: {user.id}, Username: {user.username}, Email: {user.email}")
    
    print("\n=== Listings ===")
    listings = Listing.query.all()
    for listing in listings:
        print(f"ID: {listing.id}, Title: {listing.title}, Price: ${listing.price}, Status: {listing.status}")
        print(f"Description: {listing.description}")
        print(f"User ID: {listing.user_id}")
        print("Images:")
        for image in listing.images:
            print(f"  - {image.url}")
        print("---") 