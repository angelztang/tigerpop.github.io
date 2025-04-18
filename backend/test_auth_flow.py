import os
import sys
import requests
from app import create_app
from app.models.user import User
from app.extensions import db
from app.cas.auth import get_or_create_user, validate_ticket
from dotenv import load_dotenv
from flask import Flask
import urllib.parse
import time

# Load environment variables
load_dotenv()

def test_auth_flow():
    print("Testing end-to-end authentication flow...")
    
    # Create a test Flask app with Heroku database URL
    app = Flask(__name__)
    database_url = os.environ.get('DATABASE_URL')
    if database_url and database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev')
    
    # Initialize database
    db.init_app(app)
    
    print("\nPlease enter your netid:")
    netid = input("Enter your netid: ").strip()
    
    print("\nCreating/retrieving user...")
    with app.app_context():
        try:
            user = get_or_create_user(netid)
            print(f"Successfully created/retrieved user {netid}")
            print(f"User details: {user.to_dict()}")
        except Exception as e:
            print(f"Error during user creation: {str(e)}")

if __name__ == "__main__":
    try:
        test_auth_flow()
    except Exception as e:
        print(f"Error during test: {str(e)}") 