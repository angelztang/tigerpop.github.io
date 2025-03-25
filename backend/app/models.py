# from .database import db

# # Updated Listing Model
# class Listing(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     title = db.Column(db.String(100), nullable=False)
#     category = db.Column(db.String(50), nullable=False)
#     price = db.Column(db.Float, nullable=False)
#     size = db.Column(db.String(50), nullable=False)
#     images = db.Column(db.String(500), nullable=False)
#     user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Seller's ID
#     buyer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # Buyer's ID (nullable until sold)

#     user = db.relationship('User', backref=db.backref('posted_items', lazy=True))
#     buyer = db.relationship('User', backref=db.backref('bought_items', lazy=True))

#     def __repr__(self):
#         return f'<Listing {self.title}>'

# # Updated User Model (for bought_items and posted_items)
# # class User(db.Model):
# #     id = db.Column(db.Integer, primary_key=True)
# #     username = db.Column(db.String(80), unique=True, nullable=False)
# #     email = db.Column(db.String(120), unique=True, nullable=False)
# #     password = db.Column(db.String(120), nullable=False)

# #     # List of items posted by the user (seller)
# #     posted_items = db.relationship('Listing', backref='user', lazy=True)

# #     # List of items bought by the user (buyer)
# #     bought_items = db.relationship('Listing', backref='buyer', lazy=True)

# #     def __repr__(self):
# #         return f'<User {self.username}>'

# class User(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     netid = db.Column(db.String(80), unique=True, nullable=False)
#     profile_picture = db.Column(db.String(200), nullable=True)  # URL of profile picture
#     selling_list = db.relationship('Listing', backref='seller', lazy=True)
#     sold_list = db.relationship('Listing', backref='sold_by', lazy=True)
#     bought_list = db.relationship('Listing', backref='bought_by', lazy=True)
#     liked_list = db.Column(db.String(500), nullable=True)  # Comma-separated list of liked listing IDs

#     def __repr__(self):
#         return f'<User {self.netid}>'

from . import db

class MyModel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))

    def __repr__(self):
        return f'<MyModel {self.name}>'
