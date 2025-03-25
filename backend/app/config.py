import os
from urllib.parse import urlparse
from datetime import timedelta

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT settings
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)
    
    # Handle Heroku's DATABASE_URL
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        # Parse the database URL
        url = urlparse(database_url)
        username = url.username
        password = url.password
        hostname = url.hostname
        port = url.port
        database = url.path[1:]  # Remove leading slash
        SQLALCHEMY_DATABASE_URI = f"postgresql+psycopg2://{username}:{password}@{hostname}:{port}/{database}"
    else:
        SQLALCHEMY_DATABASE_URI = "sqlite:///app.db"  # Use SQLite for local development

    # Ensure SQLAlchemy can handle the database URL
    if SQLALCHEMY_DATABASE_URI.startswith("postgresql://"):
        import urllib.parse
        url = urllib.parse.urlparse(SQLALCHEMY_DATABASE_URI)
        SQLALCHEMY_DATABASE_URI = f"postgresql+psycopg2://{url.username}:{url.password}@{url.hostname}:{url.port}{url.path}"
