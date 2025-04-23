from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
import os
from ..models.listing import Listing, ListingImage
from ..models.bid import Bid
from ..extensions import db
from ..services.notification_service import send_notification
from datetime import datetime

listings_bp = Blueprint('listings', __name__)

@listings_bp.route('/listings', methods=['POST'])
@login_required
def create_listing():
    try:
        data = request.form.to_dict()
        files = request.files.getlist('images')
        
        # Validate required fields
        required_fields = ['title', 'description', 'price', 'category', 'pricing_mode']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create listing
        listing = Listing(
            title=data['title'],
            description=data['description'],
            price=float(data['price']),
            category=data['category'],
            status='available',
            user_id=current_user.id,
            condition=data.get('condition', 'good'),
            pricing_mode=data['pricing_mode']
        )
        
        # Set starting price for auctions
        if data['pricing_mode'] == 'auction':
            starting_price = data.get('starting_price')
            if not starting_price:
                return jsonify({'error': 'Starting price is required for auctions'}), 400
            listing.starting_price = float(starting_price)
        
        db.session.add(listing)
        db.session.commit()
        
        # Handle image uploads
        if files:
            for file in files:
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                    file.save(filepath)
                    
                    listing_image = ListingImage(filename=filename, listing_id=listing.id)
                    db.session.add(listing_image)
            
            db.session.commit()
        
        return jsonify(listing.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@listings_bp.route('/listings/<int:listing_id>', methods=['PUT'])
@login_required
def update_listing(listing_id):
    listing = Listing.query.get_or_404(listing_id)
    
    if listing.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        data = request.form.to_dict()
        files = request.files.getlist('images')
        
        # Update basic fields
        if 'title' in data:
            listing.title = data['title']
        if 'description' in data:
            listing.description = data['description']
        if 'price' in data:
            listing.price = float(data['price'])
        if 'category' in data:
            listing.category = data['category']
        if 'condition' in data:
            listing.condition = data['condition']
        if 'pricing_mode' in data:
            listing.pricing_mode = data['pricing_mode']
            if data['pricing_mode'] == 'auction' and 'starting_price' in data:
                listing.starting_price = float(data['starting_price'])
        
        # Handle image uploads
        if files:
            for file in files:
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                    file.save(filepath)
                    
                    listing_image = ListingImage(filename=filename, listing_id=listing.id)
                    db.session.add(listing_image)
        
        db.session.commit()
        return jsonify(listing.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'} 