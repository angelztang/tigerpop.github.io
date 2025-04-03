from flask import Blueprint, request, jsonify, current_app, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
from .. import db
from ..models import Listing, ListingImage
from datetime import datetime
from sqlalchemy import and_

bp = Blueprint('listings', __name__, url_prefix='/api/listings')

# Configure upload settings
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_full_url(path):
    return path  # Return relative path instead of absolute URL

@bp.route('/upload', methods=['POST'])
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
            
            # Generate relative URL for the image
            image_url = f"/uploads/{unique_filename}"
            image_urls.append(image_url)
    
    return jsonify({'urls': image_urls}), 200

@bp.route('', methods=['GET'])
def get_listings():
    print("Received GET request for listings")  # Debug log
    # Get filter parameters
    max_price = request.args.get('max_price', type=float)
    category = request.args.get('category')
    include_sold = request.args.get('include_sold', 'false').lower() == 'true'
    
    print(f"Filter parameters - max_price: {max_price}, category: {category}, include_sold: {include_sold}")  # Debug log
    
    # Build query
    query = Listing.query
    
    if not include_sold:
        query = query.filter(Listing.status != 'sold')
    
    if max_price is not None:
        query = query.filter(Listing.price <= max_price)
    
    if category:
        query = query.filter(Listing.category == category)
    
    listings = query.all()
    print(f"Found {len(listings)} listings")  # Debug log
    
    result = [{
        'id': listing.id,
        'title': listing.title,
        'description': listing.description,
        'price': listing.price,
        'category': listing.category,
        'images': [img.url for img in listing.images],
        'status': listing.status,
        'user_id': listing.user_id,
        'created_at': listing.created_at.isoformat()
    } for listing in listings]
    
    print("Returning listings:", result)  # Debug log
    return jsonify(result)

@bp.route('', methods=['POST'])
def create_listing():
    try:
        print("Headers:", dict(request.headers))  # Debug log
        data = request.get_json()
        print("Received data:", data)  # Debug log
        
        if not data:
            print("No JSON data received")
            return jsonify({'error': 'No data provided'}), 400
        
        # Set a default user_id of 1 for now
        user_id = 1
        print("Using default user ID:", user_id)  # Debug log
        
        required_fields = ['title', 'description', 'price']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            print(error_msg)
            return jsonify({'error': error_msg}), 400
        
        try:
            # Validate price
            try:
                price = float(data['price'])
                if price <= 0:
                    return jsonify({'error': 'Price must be greater than 0'}), 400
            except ValueError:
                return jsonify({'error': 'Invalid price format'}), 400
            
            new_listing = Listing(
                title=data['title'],
                description=data['description'],
                price=price,
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
                'id': new_listing.id,
                'title': new_listing.title,
                'description': new_listing.description,
                'price': new_listing.price,
                'category': new_listing.category,
                'images': [img.url for img in new_listing.images],
                'status': new_listing.status,
                'user_id': new_listing.user_id,
                'created_at': new_listing.created_at.isoformat()
            }), 201
        except Exception as db_error:
            print("Database error:", str(db_error))  # Debug log
            db.session.rollback()
            return jsonify({'error': f'Database error: {str(db_error)}'}), 500
            
    except Exception as e:
        print("Error creating listing:", str(e))  # Debug log
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
    
    try:
        # Delete associated images from the filesystem
        for image in listing.images:
            image_path = os.path.join(UPLOAD_FOLDER, image.url.split('/')[-1])
            if os.path.exists(image_path):
                os.remove(image_path)
        
        # Delete the listing and its images from the database
        db.session.delete(listing)
        db.session.commit()
        
        return jsonify({'message': 'Listing deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
