from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
from .. import db
from ..models import Listing, ListingImage
from datetime import datetime
from sqlalchemy import and_
import logging

bp = Blueprint('listings', __name__, url_prefix='/api/listings')

# Configure upload settings
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_images():
    if 'images' not in request.files:
        return jsonify({'error': 'No images provided'}), 400
    
    uploaded_files = request.files.getlist('images')
    image_urls = []
    
    for file in uploaded_files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add timestamp to filename to make it unique
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_filename = f"{timestamp}_{filename}"
            file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
            file.save(file_path)
            
            # In production, you would upload to a cloud storage service
            # and get back a URL. For now, we'll use local path
            image_url = f"/uploads/{unique_filename}"
            image_urls.append(image_url)
    
    return jsonify({'urls': image_urls}), 200

@bp.route('/listings', methods=['GET'])
def get_listings():
    try:
        # Get query parameters
        price = request.args.get('price')
        category = request.args.get('category')
        
        # Start with base query
        query = Listing.query
        
        # Apply filters if provided
        if price:
            query = query.filter(Listing.price <= float(price))
        if category:
            query = query.filter(Listing.category == category)
        
        # Get all listings
        listings = query.all()
        
        # Convert to dict and include image URLs
        listings_data = []
        for listing in listings:
            listing_dict = {
                'id': listing.id,
                'title': listing.title,
                'description': listing.description,
                'price': listing.price,
                'category': listing.category,
                'user_id': listing.user_id,
                'created_at': listing.created_at.isoformat() if listing.created_at else None,
                'updated_at': listing.updated_at.isoformat() if listing.updated_at else None,
                'images': [img.url for img in listing.images]
            }
            listings_data.append(listing_dict)
        
        return jsonify(listings_data)
    except Exception as e:
        logger.error(f"Error fetching listings: {str(e)}")
        return jsonify({'error': 'Failed to fetch listings'}), 500

@bp.route('/listings', methods=['POST'])
def create_listing():
    try:
        data = request.get_json()
        logger.info(f"Received listing data: {data}")
        
        # Extract data from request
        title = data.get('title')
        description = data.get('description')
        price = data.get('price')
        category = data.get('category', 'other')
        user_id = data.get('user_id', 1)  # Default to user ID 1 if not provided
        
        if not all([title, description, price]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Create new listing
        new_listing = Listing(
            title=title,
            description=description,
            price=float(price),
            category=category,
            user_id=user_id
        )
        
        db.session.add(new_listing)
        db.session.commit()
        
        logger.info(f"Created listing with ID: {new_listing.id}")
        
        # Return the created listing
        return jsonify({
            'id': new_listing.id,
            'title': new_listing.title,
            'description': new_listing.description,
            'price': new_listing.price,
            'category': new_listing.category,
            'user_id': new_listing.user_id,
            'created_at': new_listing.created_at.isoformat() if new_listing.created_at else None,
            'updated_at': new_listing.updated_at.isoformat() if new_listing.updated_at else None,
            'images': []
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating listing: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create listing'}), 500

@bp.route('/categories', methods=['GET'])
def get_categories():
    categories = [
        'tops', 'bottoms', 'shoes', 'dresses',
        'fridges', 'couches', 'textbooks', 'other'
    ]
    return jsonify(categories)

@bp.route('/user', methods=['GET'])
@jwt_required()
def get_user_listings():
    user_id = get_jwt_identity()
    listings = Listing.query.filter_by(user_id=user_id).all()
    
    return jsonify([{
        'id': listing.id,
        'title': listing.title,
        'description': listing.description,
        'price': listing.price,
        'category': listing.category,
        'images': [img.url for img in listing.images],
        'status': listing.status,
        'user_id': listing.user_id,
        'created_at': listing.created_at.isoformat()
    } for listing in listings])

@bp.route('/<int:id>/status', methods=['PATCH'])
@jwt_required()
def update_listing_status(id):
    user_id = get_jwt_identity()
    listing = Listing.query.get_or_404(id)
    
    if listing.user_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    listing.status = data['status']
    db.session.commit()
    
    return jsonify({'message': 'Status updated successfully'})

@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_listing(id):
    user_id = get_jwt_identity()
    listing = Listing.query.get_or_404(id)
    
    if listing.user_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    db.session.delete(listing)
    db.session.commit()
    
    return jsonify({'message': 'Listing deleted successfully'})
