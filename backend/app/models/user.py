from ..extensions import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    notifications = db.Column(db.JSON, default=list)
    
    # Relationships
    listings = db.relationship('Listing', backref='seller', lazy=True, foreign_keys='Listing.user_id')
    bought_listings = db.relationship('Listing', backref='buyer', lazy=True, foreign_keys='Listing.buyer_id')
    bids = db.relationship('Bid', backref='bidder', lazy=True)
    
    def __init__(self, username, email, password_hash):
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.notifications = []
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'notifications': self.notifications
        }
    
    def __repr__(self):
        return f'<User {self.username}>' 