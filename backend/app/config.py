import os
from datetime import timedelta
<<<<<<< HEAD
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
=======
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908

class Config:
    # Basic Flask config
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-please-change'
    
    # JWT config
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    
    # Database config
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///tigerpop.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
<<<<<<< HEAD
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
=======
    # File upload config
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    
<<<<<<< HEAD
    # Ensure SQLAlchemy can handle the database URL
    if SQLALCHEMY_DATABASE_URI.startswith("postgresql://"):
        try:
            url = urlparse(SQLALCHEMY_DATABASE_URI)
            SQLALCHEMY_DATABASE_URI = f"postgresql://{url.username}:{url.password}@{url.hostname}:{url.port}{url.path}"
            logger.info(f"Final database URL: {SQLALCHEMY_DATABASE_URI}")
        except Exception as e:
            logger.error(f"Error parsing database URL: {str(e)}")
            raise
=======
    # Email config
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', True)
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME', 'your-email@gmail.com')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', 'your-app-password')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'your-email@gmail.com')
    
    # Ensure upload directory exists
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    
    # Parse database URL for Heroku
    if SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace("postgres://", "postgresql://", 1)
>>>>>>> c4d72ccc050220ad09ebb324fa9247b67b9a7908
