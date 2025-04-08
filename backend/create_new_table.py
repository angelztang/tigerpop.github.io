from app import create_app, db
from app.models.listing import Listing
from app.models.user import User
from datetime import datetime

def create_tables():
    app = create_app()
    with app.app_context():
        # Drop existing tables if they exist
        db.drop_all()
        
        # Create all tables fresh
        db.create_all()
        
        # Create a test user
        test_user = User(netid='testuser456')
        db.session.add(test_user)
        db.session.commit()
        
        # Create a test listing
        test_listing = Listing(
            title='Test Listing',
            description='This is a test listing',
            price=99.99,
            category='other',
            status='available',
            user_id=test_user.id,
            created_at=datetime.utcnow()
        )
        db.session.add(test_listing)
        db.session.commit()
        
        print("✅ Tables created successfully!")
        print("✅ Test user and listing created!")

if __name__ == '__main__':
    create_tables()