from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os
from .config import Config

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__, static_folder='../uploads', static_url_path='/uploads')
    CORS(app)
    
    # Load configuration
    app.config.from_object(Config)
    
    # Ensure SQLAlchemy can handle the database URL
    if app.config['SQLALCHEMY_DATABASE_URI'].startswith("postgresql://"):
        import urllib.parse
        url = urllib.parse.urlparse(app.config['SQLALCHEMY_DATABASE_URI'])
        app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{url.username}:{url.password}@{url.hostname}:{url.port}{url.path}"
    
    print("Using database URL:", app.config['SQLALCHEMY_DATABASE_URI'])  # Debug log
    
    db.init_app(app)
    jwt.init_app(app)

    # Register blueprints
    from .routes import auth_routes, listing_routes
    app.register_blueprint(auth_routes.bp)
    app.register_blueprint(listing_routes.bp)

    # Create tables
    with app.app_context():
        db.create_all()

    return app
