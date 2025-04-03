import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from .utils.cloudinary_config import init_cloudinary
import logging
import traceback

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app(test_config=None):
    app = Flask(__name__)
    
    # Configure logging first
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    if test_config is None:
        # Load config from environment variables
        database_url = os.environ.get('DATABASE_URL')
        logger.info(f"Original DATABASE_URL: {database_url}")
        
        if not database_url:
            logger.error("No DATABASE_URL environment variable found")
            raise ValueError("DATABASE_URL environment variable is required")
            
        # Convert heroku postgres:// to postgresql://
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
            logger.info(f"Converted DATABASE_URL to: {database_url}")
            
        app.config.from_mapping(
            SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
            SQLALCHEMY_DATABASE_URI=database_url,
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
            JWT_SECRET_KEY=os.environ.get('JWT_SECRET_KEY', 'dev')
        )
        
        logger.info(f"Final SQLALCHEMY_DATABASE_URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
    else:
        app.config.update(test_config)
    
    # Initialize Cloudinary
    with app.app_context():
        init_cloudinary()
    
    # Define allowed origins
    allowed_origins = [
        "http://localhost:3000",
        "https://tigerpop-marketplace.herokuapp.com",
        "https://tigerpop.github.io",
        "https://tigerpop-marketplace-frontend-df8f1fbc1309.herokuapp.com"
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
    
    # Initialize database
    try:
        db.init_app(app)
        logger.info("Successfully initialized database")
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        logger.exception("Full traceback:")
        raise
        
    migrate.init_app(app, db)
    jwt.init_app(app)
    
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
            logger.error(traceback.format_exc())
            raise
    
    # Error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({'error': 'Not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {str(error)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500

    @app.errorhandler(Exception)
    def handle_exception(e):
        logger.error(f"Unhandled exception: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500
    
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
