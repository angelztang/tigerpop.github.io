from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
from ..extensions import db, mail
from ..models import Listing, ListingImage, User
from datetime import datetime
from sqlalchemy import and_, or_
from flask_mail import Message

bp = Blueprint('listings', __name__)

# Configure upload settings
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/upload', methods=['POST'])
def upload_images():
    if 'files[]' not in request.files:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.files.getlist('files[]')
    uploaded_files = []
    
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_filename = f"{timestamp}_{filename}"
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(file_path)
            uploaded_files.append(unique_filename)
    
    return jsonify({'files': uploaded_files})

@bp.route('', methods=['GET'])
def get_listings():
    # Get query parameters
    category = request.args.get('category')
    min_price = request.args.get('min_price')
    max_price = request.args.get('max_price')
    condition = request.args.get('condition')
    search = request.args.get('search')
    
    # Start with base query
    query = Listing.query.filter_by(status='active')
    
    # Apply filters
    if category:
        query = query.filter(Listing.category == category)
    if min_price:
        query = query.filter(Listing.price >= float(min_price))
    if max_price:
        query = query.filter(Listing.price <= float(max_price))
    if condition:
        query = query.filter(Listing.condition == condition)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Listing.title.ilike(search_term),
                Listing.description.ilike(search_term)
            )
        )
    
    # Execute query
    listings = query.order_by(Listing.created_at.desc()).all()
    
    # Format response
    return jsonify([{
        'id': listing.id,
        'title': listing.title,
        'description': listing.description,
        'price': listing.price,
        'condition': listing.condition,
        'category': listing.category,
        'created_at': listing.created_at.isoformat(),
        'updated_at': listing.updated_at.isoformat(),
        'seller_id': listing.seller_id,
        'images': [image.filename for image in listing.images]
    } for listing in listings])

@bp.route('', methods=['POST'])
def create_listing():
    data = request.get_json()
    
    # Create new listing with a default seller_id for testing
    listing = Listing(
        title=data['title'],
        description=data['description'],
        price=float(data['price']),
        condition=data.get('condition', 'new'),
        category=data['category'],
        seller_id=1  # Default seller_id for testing
    )
    
    # Add images if provided
    if 'images' in data:
        for filename in data['images']:
            image = ListingImage(filename=filename, listing_id=listing.id)
            listing.images.append(image)
    
    db.session.add(listing)
    db.session.commit()
    
    return jsonify({
        'id': listing.id,
        'title': listing.title,
        'description': listing.description,
        'price': listing.price,
        'condition': listing.condition,
        'category': listing.category,
        'created_at': listing.created_at.isoformat(),
        'updated_at': listing.updated_at.isoformat(),
        'seller_id': listing.seller_id,
        'images': [image.filename for image in listing.images]
    }), 201

@bp.route('/categories', methods=['GET'])
def get_categories():
    categories = db.session.query(Listing.category).distinct().all()
    return jsonify([category[0] for category in categories])

@bp.route('/user', methods=['GET'])
def get_user_listings():
    user_id = 1  # Default user_id for testing
    listings = Listing.query.filter_by(seller_id=user_id).order_by(Listing.created_at.desc()).all()
    
    return jsonify([{
        'id': listing.id,
        'title': listing.title,
        'description': listing.description,
        'price': listing.price,
        'condition': listing.condition,
        'category': listing.category,
        'created_at': listing.created_at.isoformat(),
        'updated_at': listing.updated_at.isoformat(),
        'seller_id': listing.seller_id,
        'images': [image.filename for image in listing.images]
    } for listing in listings])

@bp.route('/<int:id>/buy', methods=['POST'])
def request_to_buy(id):
    listing = Listing.query.get_or_404(id)
    data = request.get_json()
    
    # Update listing with buyer information
    listing.buyer_id = data.get('buyer_id')
    listing.buyer_message = data.get('message')
    listing.buyer_contact = data.get('contact_info')
    listing.status = 'pending'
    db.session.commit()
    
    # Get seller's email
    seller = User.query.get(listing.seller_id)
    
    # Send email to seller
    msg = Message(
        subject=f'New Purchase Request for {listing.title}',
        recipients=[seller.email],
        body=f'''
        Someone wants to buy your item: {listing.title}
        
        Message from buyer:
        {listing.buyer_message}
        
        Contact information:
        {listing.buyer_contact}
        
        You can respond to this email to contact the buyer.
        '''
    )
    
    try:
        mail.send(msg)
    except Exception as e:
        current_app.logger.error(f"Failed to send email: {str(e)}")
    
    return jsonify({
        'message': 'Purchase request sent successfully',
        'listing': {
            'id': listing.id,
            'status': listing.status
        }
    })

@bp.route('/<int:id>/status', methods=['PATCH'])
def update_listing_status(id):
    listing = Listing.query.get_or_404(id)
    user_id = 1  # Default user_id for testing
    
    if listing.seller_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    listing.status = data['status']
    db.session.commit()
    
    return jsonify({
        'id': listing.id,
        'status': listing.status
    })

@bp.route('/<int:id>', methods=['DELETE'])
def delete_listing(id):
    listing = Listing.query.get_or_404(id)
    user_id = 1  # Default user_id for testing
    
    if listing.seller_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Delete associated images
    for image in listing.images:
        try:
            os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], image.filename))
        except OSError:
            pass
    
    db.session.delete(listing)
    db.session.commit()
    
    return '', 204
