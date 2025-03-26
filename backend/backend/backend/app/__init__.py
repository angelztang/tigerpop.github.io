from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from .config import Config
import os
import logging

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app(config_class=Config):
    app = Flask(__name__, static_folder='../uploads', static_url_path='/uploads')
    app.config.from_object(config_class)
    
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    # Initialize extensions
    CORS(app)
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Print database URL for debugging (remove in production)
    logger.info(f"Database URL: {app.config['SQLALCHEMY_DATABASE_URI']}")
    
    # Register blueprints with URL prefix
    from .routes import auth_routes, listing_routes
    app.register_blueprint(auth_routes.bp, url_prefix='/api')
    app.register_blueprint(listing_routes.bp, url_prefix='/api')
    
    # Create tables if they don't exist
    with app.app_context():
        try:
            db.create_all()
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Error creating database tables: {str(e)}")
            raise
    
    return app
