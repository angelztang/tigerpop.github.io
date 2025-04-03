from flask import Blueprint, request, jsonify, current_app, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
from .. import db
from ..models import Listing, ListingImage
from datetime import datetime
from sqlalchemy import and_
from ..utils.cloudinary_config import upload_image
import base64
import io
from PIL import Image

bp = Blueprint('listings', __name__, url_prefix='/api/listings')

# Configure upload settings
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_full_url(path):
    return path  # Return relative path instead of absolute URL

@bp.route('/upload', methods=['POST'])
def upload_images():
    try:
        current_app.logger.info("Starting image upload process...")
        
        # Get the image data from the request
        files = request.files.getlist('images')
        current_app.logger.info(f"Received {len(files)} files")
        
        if not files:
            current_app.logger.warning("No images provided in request")
            return jsonify({'error': 'No images provided'}), 400

        image_urls = []
        for file in files:
            current_app.logger.info(f"Processing file: {file.filename}")
            if file and allowed_file(file.filename):
                try:
                    # Upload to Cloudinary using our utility function
                    current_app.logger.info(f"Uploading {file.filename} to Cloudinary...")
                    upload_result = upload_image(file)
                    secure_url = upload_result['secure_url']
                    current_app.logger.info(f"Upload successful, URL: {secure_url}")
                    image_urls.append(secure_url)  # Use the Cloudinary secure_url directly
                except Exception as upload_error:
                    current_app.logger.error(f"Failed to upload {file.filename}: {str(upload_error)}")
                    raise upload_error
            else:
                current_app.logger.warning(f"Invalid file type for {file.filename}")
                return jsonify({'error': f'Invalid file type for {file.filename}'}), 400
        
        current_app.logger.info(f"Successfully uploaded {len(image_urls)} images")
        return jsonify({'urls': image_urls}), 200
    except Exception as e:
        current_app.logger.error(f"Error uploading images: {str(e)}")
        current_app.logger.exception("Full traceback:")
        return jsonify({'error': str(e)}), 500

@bp.route('/test-upload', methods=['POST'])
def test_upload():
    try:
        # Get the base64 image data from the request
        image_data = request.json.get('image')
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400

        # Convert base64 to image file
        image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Save to a temporary BytesIO object
        temp_buffer = io.BytesIO()
        image.save(temp_buffer, format='JPEG')
        temp_buffer.seek(0)

        # Upload to Cloudinary using our utility function
        upload_result = upload_image(temp_buffer)
        
        return jsonify({
            'message': 'Image uploaded successfully',
            'url': upload_result['secure_url'],
            'public_id': upload_result['public_id']
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error uploading image: {str(e)}")
        return jsonify({'error': str(e)}), 500

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
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Set a default user_id of 1 for now (since we're not requiring authentication)
        user_id = 1
        
        required_fields = ['title', 'description', 'price']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            return jsonify({'error': error_msg}), 400
        
        try:
            # Validate price
            price = float(data['price'])
            if price <= 0:
                return jsonify({'error': 'Price must be greater than 0'}), 400
            
            new_listing = Listing(
                title=data['title'],
                description=data['description'],
                price=price,
                category=data.get('category', 'other'),
                user_id=user_id
            )
            
            # Add images
            if 'image_urls' in data and isinstance(data['image_urls'], list):
                for url in data['image_urls']:
                    image = ListingImage(url=url)
                    new_listing.images.append(image)
            
            db.session.add(new_listing)
            db.session.commit()
            
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
            db.session.rollback()
            return jsonify({'error': f'Database error: {str(db_error)}'}), 500
            
    except Exception as e:
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
