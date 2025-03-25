# import os
# from flask import Flask
# from flask_sqlalchemy import SQLAlchemy
# from flask_migrate import Migrate

# app = Flask(__name__)

# # Configure the app
# app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://localhost/mydb')
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# # Initialize the database and migration
# db = SQLAlchemy(app)
# migrate = Migrate(app, db)

# # Define your models
# class MyModel(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     name = db.Column(db.String(50))

# # Run the app if this is the main file
# if __name__ == '__init__':
#     app.run(debug=True)

from . import app, db
from flask import render_template

@app.route('/')
def home():
    return "Welcome to Flask!"
