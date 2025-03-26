from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os
from sqlalchemy import create_engine
from urllib.parse import urlparse

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__, static_folder='../uploads', static_url_path='/uploads')
    CORS(app)

    # Get the database URL and parse it
    database_url = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)

    # Create the engine directly
    engine = create_engine(database_url)
    
    # Configure SQLAlchemy
    app.config['SQLALCHEMY_ENGINE'] = engine
    app.config['SQLALCHEMY_DATABASE_URI'] = str(engine.url)
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-key-change-this')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

    db.init_app(app)
    jwt.init_app(app)

    # Register blueprints (if any)
    from .routes import auth_routes, listing_routes
    app.register_blueprint(auth_routes.bp)
    app.register_blueprint(listing_routes.bp)

    # Create tables
    with app.app_context():
        db.create_all()

    return app
