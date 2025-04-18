import os
import sys
from flask import Flask
from app.models.user import User
from app.config import Config
from app.extensions import db
from app.cas.auth import get_or_create_user
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class TestConfig(Config):
    TESTING = True
    # Use the actual Heroku database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace("postgres://", "postgresql://", 1)

def create_test_app():
    app = Flask(__name__)
    app.config.from_object(TestConfig)
    db.init_app(app)
    return app

def test_user_creation(app):
    netid = "testuser3"
    print("Testing creation of new user...")
    print(f"Using database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    
    # Test creating a new user
    user = get_or_create_user(netid)
    print(f"Created user: {user.netid}")
    
    # Test getting the same user
    retrieved_user = get_or_create_user(netid)
    print(f"Retrieved user: {retrieved_user.netid}")
    
    # Assert that both users are the same
    assert user.netid == retrieved_user.netid
    print("Test passed: User creation and retrieval working correctly")

if __name__ == "__main__":
    app = create_test_app()
    with app.app_context():
        try:
            test_user_creation(app)
        finally:
            # Don't drop tables since we're using the production database
            db.session.remove() 