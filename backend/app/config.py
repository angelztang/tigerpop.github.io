import os
from urllib.parse import urlparse
from datetime import timedelta
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT settings
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-key-change-this')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)
    
    # Get the database URL and parse it
    database_url = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
    logger.info(f"Initial database URL: {database_url}")
    
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
        logger.info(f"Converted postgres:// to postgresql://: {database_url}")
    
    SQLALCHEMY_DATABASE_URI = database_url
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # Ensure SQLAlchemy can handle the database URL
    if SQLALCHEMY_DATABASE_URI.startswith("postgresql://"):
        try:
            url = urlparse(SQLALCHEMY_DATABASE_URI)
            SQLALCHEMY_DATABASE_URI = f"postgresql://{url.username}:{url.password}@{url.hostname}:{url.port}{url.path}"
            logger.info(f"Final database URL: {SQLALCHEMY_DATABASE_URI}")
        except Exception as e:
            logger.error(f"Error parsing database URL: {str(e)}")
            raise
