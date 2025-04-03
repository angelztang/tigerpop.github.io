from flask import Flask, request
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
    
    # Define allowed origins
    allowed_origins = [
        "http://localhost:3000",
        "https://tigerpop-marketplace.herokuapp.com",
        "https://tigerpop.github.io"
    ]
    
    # Initialize extensions with explicit CORS configuration
    CORS(app, resources={
        r"/*": {
            "origins": allowed_origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    }, expose_headers=["Content-Type", "Authorization"])
    
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Print database URL for debugging (remove in production)
    logger.info(f"Database URL: {app.config['SQLALCHEMY_DATABASE_URI']}")
    
    # Register blueprints
    from .routes import auth_routes, listing_routes
    app.register_blueprint(auth_routes.bp)
    app.register_blueprint(listing_routes.bp)
    
    # Create tables if they don't exist
    with app.app_context():
        try:
            db.create_all()
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Error creating database tables: {str(e)}")
            raise
    
    # Serve static files with CORS headers
    @app.after_request
    def after_request(response):
        origin = request.headers.get('Origin')
        if origin in allowed_origins:
            response.headers.add('Access-Control-Allow-Origin', origin)
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    return app
