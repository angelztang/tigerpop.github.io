from ..extensions import db
from datetime import datetime
from .user import User

class Listing(db.Model):
    __tablename__ = 'listings'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    starting_price = db.Column(db.Float, nullable=True)  # For auctions
    pricing_mode = db.Column(db.String(20), default='fixed')  # 'fixed' or 'auction'
    category = db.Column(db.String(50))
    status = db.Column(db.String(20), default='available')
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    condition = db.Column(db.String(50), nullable=True)
    bidding_end_date = db.Column(db.DateTime, nullable=True)  # For auctions
    
    # Add relationship with ListingImage
    images = db.relationship('ListingImage', backref='listing', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, title, description, price, category, status, user_id, condition='good', created_at=None, starting_price=None, pricing_mode='fixed', bidding_end_date=None):
        self.title = title
        self.description = description
        self.price = price
        self.category = category
        self.status = status
        self.user_id = user_id
        self.condition = condition
        self.starting_price = starting_price
        self.pricing_mode = pricing_mode
        self.bidding_end_date = bidding_end_date
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
            'buyer_id': self.buyer_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'images': [image.filename for image in self.images],
            'condition': self.condition,
            'starting_price': self.starting_price,
            'pricing_mode': self.pricing_mode,
            'bidding_end_date': self.bidding_end_date.isoformat() if self.bidding_end_date else None,
            'current_bid': self.get_current_bid()
        }
    
    def get_current_bid(self):
        if self.pricing_mode == 'auction' and self.bids:
            return max(bid.amount for bid in self.bids)
        return None
    
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