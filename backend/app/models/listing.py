from ..extensions import db
from datetime import datetime
from .user import User

class Listing(db.Model):
    __tablename__ = 'listings'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    condition = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(20), default='available')
    pricing_mode = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    bidding_end_date = db.Column(db.DateTime, nullable=True)
    current_bid = db.Column(db.Float, nullable=True)
    current_bidder_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    current_bidder = db.relationship('User', foreign_keys=[current_bidder_id])
    seller = db.relationship('User', foreign_keys=[user_id], backref='listings')
    buyer = db.relationship('User', foreign_keys=[buyer_id], backref='purchases')
    images = db.relationship('ListingImage', backref='listing', lazy=True, cascade='all, delete-orphan')
    bids = db.relationship('Bid', backref=db.backref('listing_parent', lazy=True), lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, title, description, price, user_id, category=None, condition=None, status='available', pricing_mode='fixed'):
        self.title = title
        self.description = description
        self.price = price
        self.user_id = user_id
        self.category = category or 'other'
        self.condition = condition
        self.status = status
        self.pricing_mode = pricing_mode
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'price': self.price,
            'category': self.category,
            'condition': self.condition,
            'status': self.status,
            'pricing_mode': self.pricing_mode,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user_id': self.user_id,
            'buyer_id': self.buyer_id,
            'images': [image.filename for image in self.images],
            'current_bid': self.get_current_bid()
        }
    
    def get_current_bid(self):
        if self.pricing_mode == 'auction' and self.bids:
            return max(bid.amount for bid in self.bids)
        return None
    
    def __repr__(self):
        return f'<Listing {self.id}: {self.title}>'

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

class HeartedListing(db.Model):
    __tablename__ = 'hearted_listings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    listing_id = db.Column(db.Integer, db.ForeignKey('listings.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('hearted_listings', lazy=True))
    listing = db.relationship('Listing', backref=db.backref('hearted_by', lazy=True))

    def __repr__(self):
        return f'<HeartedListing {self.id}>' 