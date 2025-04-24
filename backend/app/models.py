class ListingImage(db.Model):
    __tablename__ = 'listing_images'

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    listing_id = db.Column(db.Integer, db.ForeignKey('listings.id'), nullable=False)

    listing = db.relationship('Listing', backref=db.backref('images', lazy=True))

class Listing(db.Model):
    __tablename__ = 'listings'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    condition = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(20), default='available')
    pricing_mode = db.Column(db.String(20), default='fixed')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    seller = db.relationship('User', foreign_keys=[user_id], backref='listings')
    buyer = db.relationship('User', foreign_keys=[buyer_id], backref='purchases')