# from flask import Flask
# from .config import Config
# from .database import db
# from .routes import auth_routes, user_routes, listing_routes, purchase_routes, message_routes

# def create_app():
#     app = Flask(__name__)
#     app.config.from_object(Config)

#     db.init_app(app)

#     app.register_blueprint(auth_routes.bp, url_prefix='/auth')
#     app.register_blueprint(user_routes.bp, url_prefix='/users')
#     app.register_blueprint(listing_routes.bp, url_prefix='/listings')
#     app.register_blueprint(purchase_routes.bp, url_prefix='/purchases')
#     app.register_blueprint(message_routes.bp, url_prefix='/messages')

#     return app

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

# Initialize the Flask application
app = Flask(__name__)

# Load the configuration
app.config.from_object('config.Config')

# Initialize the database and migration tool
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Import routes and models
from . import models

