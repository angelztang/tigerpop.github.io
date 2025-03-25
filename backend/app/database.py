# from flask_sqlalchemy import SQLAlchemy

# db = SQLAlchemy()

# def init_db(app):
#     db.init_app(app)

from . import db

def init_db():
    db.create_all()
