from ..extensions import db
from datetime import datetime

class Bid(db.Model):
    __tablename__ = 'bids'

    id = db.Column(db.Integer, primary_key=True)
    listing_id = db.Column(db.Integer, db.ForeignKey('listings.id', ondelete='CASCADE'), nullable=False)
    bidder_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    listing = db.relationship('Listing')
    bidder = db.relationship('User', backref=db.backref('bids', lazy=True))

    def __init__(self, listing_id, bidder_id, amount, timestamp=None):
        self.listing_id = listing_id
        self.bidder_id = bidder_id
        self.amount = amount
        if timestamp:
            self.timestamp = timestamp

    def to_dict(self):
        return {
            'id': self.id,
            'listing_id': self.listing_id,
            'bidder_id': self.bidder_id,
            'amount': self.amount,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

    def __repr__(self):
        return f'<Bid {self.id} on Listing {self.listing_id}>'
