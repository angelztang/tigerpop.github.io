from ..extensions import db
from datetime import datetime
from .user import User

class Listing(db.Model):
    __tablename__ = 'listings'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50))
    status = db.Column(db.String(20), default='available')
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Add relationship with ListingImage
    images = db.relationship('ListingImage', backref='listing', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, title, description, price, category, status, user_id, created_at=None):
        self.title = title
        self.description = description
        self.price = price
        self.category = category
        self.status = status
        self.user_id = user_id
        if created_at:
            self.created_at = created_at
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'price': self.price,
            'category': self.category,
            'status': self.status,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'images': [image.filename for image in self.images]
        }
    
    def __repr__(self):
        return f'<Listing {self.title}>'

class ListingImage(db.Model):
    __tablename__ = 'listing_images'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    listing_id = db.Column(db.Integer, db.ForeignKey('listings.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __init__(self, filename, listing_id):
        self.filename = filename
        self.listing_id = listing_id
    
    def __repr__(self):
        return f'<ListingImage {self.filename}>' 