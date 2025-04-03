from app import create_app, db
from app.models import User, Listing, ListingImage

app = create_app()

with app.app_context():
    # Drop all tables
    db.drop_all()
    # Create all tables
    db.create_all()
    print("Database tables created successfully!")

    # Create a test user
    test_user = User(
        username='testuser',
        email='test@example.com',
        password='password123'
    )
    db.session.add(test_user)
    db.session.commit()
    print("Test user created successfully!")

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'} 