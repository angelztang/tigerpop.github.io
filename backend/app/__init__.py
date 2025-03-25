from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Initialize extensions globally
db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config.from_object('app.config.Config')  # Load configuration from app/config.py

    # Initialize the extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Import routes and models
    from . import routes  # Register routes

    app.register_blueprint(routes.bp)

    return app
