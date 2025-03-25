import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'mysecretkey')  # Secret key for sessions
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # Disable modification tracking
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://localhost/mydb')  # Heroku will set this automatically
