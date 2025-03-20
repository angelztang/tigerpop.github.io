from .database import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'

class Listing(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # Women, Men, Clothing, etc.
    price = db.Column(db.Float, nullable=False)  # Price in dollars
    size = db.Column(db.String(50), nullable=False)
    images = db.Column(db.String(500), nullable=False)  # Comma-separated image URLs

    def __repr__(self):
        return f'<Listing {self.title}>'
