# import os

# class Config:
#     SQLALCHEMY_TRACK_MODIFICATIONS = False
#     SECRET_KEY = os.environ.get('SECRET_KEY', 'mysecretkey')  # For JWT
#     SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')  # Heroku automatically sets DATABASE_URL
#     CLOUDINARY_API_KEY = os.environ.get('CLOUDINARY_API_KEY')
#     CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET')
#     CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME')

import os

class Config:
    # Secret key for sessions and cookies
    SECRET_KEY = os.environ.get('SECRET_KEY', 'mysecretkey')
    
    # Database configuration
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://localhost/mydb')
