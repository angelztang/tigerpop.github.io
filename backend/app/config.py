import os
from urllib.parse import urlparse

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Handle Heroku's DATABASE_URL
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        # Heroku provides postgres:// but SQLAlchemy needs postgresql://
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        SQLALCHEMY_DATABASE_URI = database_url
    else:
        SQLALCHEMY_DATABASE_URI = "postgresql://localhost/yourdb"
