from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.extensions import db, migrate, init_extensions

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS with credentials
    CORS(app, 
         resources={r"/api/*": {
             "origins": "http://localhost:3000",
             "supports_credentials": True,
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
             "allow_headers": ["Content-Type", "Authorization"]
         }})

    # Initialize extensions
    init_extensions(app)

    # Register blueprints
    from app.routes.auth_routes import bp as auth_bp
    from app.routes.listing_routes import bp as listing_bp
    from app.routes.user_routes import bp as user_bp
    from app.cas.auth import cas_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(listing_bp, url_prefix='/api/listing')
    app.register_blueprint(user_bp, url_prefix='/api/user')

    return app
