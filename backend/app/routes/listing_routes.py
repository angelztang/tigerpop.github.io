from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
from .. import db
from ..models import Listing, ListingImage
from datetime import datetime
from sqlalchemy import and_

bp = Blueprint('listings', __name__, url_prefix='/api/listings')

# Configure upload settings
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

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

@bp.route('', methods=['GET'])
def get_listings():
    # Get filter parameters
    max_price = request.args.get('max_price', type=float)
    category = request.args.get('category')
    
    # Build query
    query = Listing.query
    
    if max_price is not None:
        query = query.filter(Listing.price <= max_price)
    
    if category:
        query = query.filter(Listing.category == category)
    
    listings = query.all()
    
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

@bp.route('', methods=['POST'])
def create_listing():
    try:
        data = request.get_json()
        print("Received data:", data)  # Debug log
        
        # For now, set a default user_id of 1
        user_id = 1
        
        new_listing = Listing(
            title=data['title'],
            description=data['description'],
            price=data['price'],
            category=data.get('category', 'other'),
            user_id=user_id
        )
        
        # Add images
        if 'image_urls' in data:
            for url in data['image_urls']:
                image = ListingImage(url=url)
                new_listing.images.append(image)
        
        db.session.add(new_listing)
        db.session.commit()
        
        print("Listing created successfully with ID:", new_listing.id)  # Debug log
        
        return jsonify({
            'message': 'Listing created successfully',
            'id': new_listing.id,
            'category': new_listing.category,
            'images': [img.url for img in new_listing.images]
        }), 201
    except Exception as e:
        print("Error creating listing:", str(e))  # Debug log
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

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
