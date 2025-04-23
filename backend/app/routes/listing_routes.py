from flask import Blueprint, request, jsonify, current_app, session
from werkzeug.utils import secure_filename
import os
from ..extensions import db, mail
from ..models import Listing, ListingImage, User, HeartedListing
from datetime import datetime
from sqlalchemy import and_, or_
from flask_mail import Message
from ..utils.cloudinary_config import upload_image
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import base64
import io
from PIL import Image
import json

bp = Blueprint('listing', __name__)

# Configure upload settings
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/upload', methods=['POST', 'OPTIONS'])
@bp.route('/upload/', methods=['POST', 'OPTIONS'])
def upload_images():
    if request.method == 'OPTIONS':
        return '', 200
        
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
                    image_urls.append(secure_url)
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

@bp.route('/', methods=['GET'])
def get_listings():
    try:
        # Get query parameters for filtering
        max_price = request.args.get('max_price', type=float)
        category = request.args.get('category')
        search = request.args.get('search')
        status = request.args.get('status', 'available')
        
        # Start with base query
        query = Listing.query
        
        # Apply filters if they exist
        if max_price:
            query = query.filter(Listing.price <= max_price)
        if category:
            query = query.filter(Listing.category.ilike(category))
        if status:
            query = query.filter(Listing.status == status)
            
        # Apply search filter if search query is provided
        if search:
            search_terms = search.split()
            for term in search_terms:
                query = query.filter(
                    db.or_(
                        Listing.title.ilike(f'%{term}%'),
                        Listing.description.ilike(f'%{term}%')
                    )
                )
            
        # Get all listings
        listings = query.order_by(Listing.created_at.desc()).all()
        
        # Convert to dictionary format
        return jsonify([{
            'id': listing.id,
            'title': listing.title,
            'description': listing.description,
            'price': listing.price,
            'category': listing.category,
            'status': listing.status,
            'user_id': listing.user_id,
            'created_at': listing.created_at.isoformat() if listing.created_at else None,
            'images': [image.filename for image in listing.images],
            'condition': listing.condition
        } for listing in listings])
    except Exception as e:
        current_app.logger.error(f"Error fetching listings: {str(e)}")
        return jsonify({'error': 'Failed to fetch listings'}), 500

@bp.route('', methods=['POST'])
def create_listing():
    try:
        # Handle both JSON and form data
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()

        current_app.logger.info(f"Received listing creation request with data: {data}")

        # Get required fields
        title = data.get('title')
        description = data.get('description')
        price = data.get('price')
        category = data.get('category', 'other')
        user_id = data.get('user_id')
        condition = data.get('condition', 'good')
        image_urls = data.get('images', [])

        # Validate required fields
        if not all([title, description, price, user_id, category]):
            missing_fields = []
            if not title: missing_fields.append('title')
            if not description: missing_fields.append('description')
            if not price: missing_fields.append('price')
            if not user_id: missing_fields.append('user_id')
            if not category: missing_fields.append('category')
            current_app.logger.error(f"Missing required fields: {missing_fields}")
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        try:
            # Validate price
            price = float(price)
            if price <= 0:
                return jsonify({'error': 'Price must be greater than 0'}), 400

            # Create new listing
            new_listing = Listing(
                title=title,
                description=description,
                price=price,
                category=category,
                status='available',
                user_id=user_id,
                condition=condition
            )

            # Add listing to database first to get the ID
            db.session.add(new_listing)
            db.session.commit()

            # Create image records if there are any
            if image_urls:
                for url in image_urls:
                    image = ListingImage(filename=url, listing_id=new_listing.id)
                    db.session.add(image)
                db.session.commit()

            current_app.logger.info(f"Successfully created listing with ID: {new_listing.id}")

            # Get the listing with its images
            listing_data = {
                'id': new_listing.id,
                'title': new_listing.title,
                'description': new_listing.description,
                'price': new_listing.price,
                'category': new_listing.category,
                'status': new_listing.status,
                'user_id': new_listing.user_id,
                'condition': new_listing.condition,
                'created_at': new_listing.created_at.isoformat() if new_listing.created_at else None,
                'images': [image.filename for image in new_listing.images]
            }

            return jsonify(listing_data), 201

        except Exception as db_error:
            db.session.rollback()
            current_app.logger.error(f"Database error: {str(db_error)}")
            current_app.logger.exception("Full traceback:")
            return jsonify({'error': 'Failed to create listing'}), 500

    except Exception as e:
        current_app.logger.error(f"Error creating listing: {str(e)}")
        return jsonify({'error': 'Failed to create listing'}), 500

@bp.route('/categories', methods=['GET'])
def get_categories():
    categories = [
        'tops', 'bottoms', 'dresses', 'shoes',
        'furniture', 'appliances', 'books', 'other'
    ]
    return jsonify(categories)

@bp.route('/user', methods=['GET'])
def get_user_listings():
    try:
        # Get the netid from the query parameters
        netid = request.args.get('netid')
        
        if not netid:
            return jsonify({'error': 'NetID is required'}), 400
            
        # Get all listings for this user by joining with users table
        listings = (Listing.query
                   .join(User, Listing.user_id == User.id)
                   .filter(User.netid == netid)
                   .order_by(Listing.created_at.desc())
                   .all())
        
        # Convert to dictionary format
        return jsonify([{
            'id': listing.id,
            'title': listing.title,
            'description': listing.description,
            'price': listing.price,
            'category': listing.category,
            'status': listing.status,
            'user_id': listing.user_id,
            'created_at': listing.created_at.isoformat() if listing.created_at else None,
            'images': [image.filename for image in listing.images]
        } for listing in listings])
    except Exception as e:
        current_app.logger.error(f"Error fetching user listings: {str(e)}")
        return jsonify({'error': 'Failed to fetch user listings'}), 500

@bp.route('/buyer', methods=['GET'])
@bp.route('/buyer/', methods=['GET'])
def get_buyer_listings():
    try:
        # Get the netid or user_id from the request parameters
        netid = request.args.get('netid')
        user_id = request.args.get('user_id')
        
        if not netid and not user_id:
            return jsonify({'error': 'No netid or user_id provided'}), 400
            
        # Get the user by netid or user_id
        if netid:
            user = User.query.filter_by(netid=netid).first()
        else:
            user = User.query.get(user_id)
            
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        # Query for listings where the user is the buyer
        listings = Listing.query.filter_by(buyer_id=user.id).order_by(Listing.created_at.desc()).all()
        
        # Convert to dictionary format
        return jsonify([{
            'id': listing.id,
            'title': listing.title,
            'description': listing.description,
            'price': listing.price,
            'category': listing.category,
            'status': listing.status,
            'user_id': listing.user_id,
            'buyer_id': listing.buyer_id,
            'created_at': listing.created_at.isoformat() if listing.created_at else None,
            'images': [image.filename for image in listing.images],
            'condition': listing.condition
        } for listing in listings])
    except Exception as e:
        current_app.logger.error(f"Error fetching buyer listings: {str(e)}")
        return jsonify({'error': 'Failed to fetch buyer listings'}), 500

@bp.route('/<int:id>/buy', methods=['POST'])
def request_to_buy(id):
    listing = Listing.query.get_or_404(id)
    data = request.get_json()
    
    # Convert buyer_id to integer if it's not already
    buyer_id = data.get('buyer_id')
    try:
        buyer_id = int(buyer_id)
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid buyer ID format'}), 400
    
    # Update listing with buyer information and set status to pending
    listing.buyer_id = buyer_id
    listing.status = 'pending'
    db.session.commit()
    
    # Get seller's email
    seller = User.query.get(listing.user_id)
    
    # Send email to seller
    msg = Message(
        subject=f'TigerPop: New Interest in Your Listing - {listing.title}',
        recipients=[f'{seller.netid}@princeton.edu'],
        body=f'Someone is interested in your listing "{listing.title}"', 
        html=f'''
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
                <h2 style="color: #4A90E2;">🎉 Someone is interested in your listing!</h2>
                <p><strong>Title:</strong> {listing.title}</p>
                <p><strong>Price:</strong> ${listing.price}</p>
                <p><strong>Category:</strong> {listing.category}</p>
                <hr style="margin: 20px 0;">
                <p>You can <a href="http://localhost:3000/listings/{listing.id}" style="color: #4A90E2;">view and manage your listing here</a>.</p>
                <p>– The <strong>TigerPop</strong> Team 🐯</p>
            </div>
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
            'status': listing.status,
            'buyer_id': listing.buyer_id
        }
    })

@bp.route('/<int:id>/status', methods=['PATCH', 'OPTIONS'])
@bp.route('/<int:id>/status/', methods=['PATCH', 'OPTIONS'])
def update_listing_status(id):
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        listing = Listing.query.get_or_404(id)
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({'error': 'Status is required'}), 400
            
        listing.status = data['status']
        db.session.commit()
        
        return jsonify({
            'id': listing.id,
            'status': listing.status
        })
    except Exception as e:
        current_app.logger.error(f"Error updating listing status: {str(e)}")
        return jsonify({'error': 'Failed to update listing status'}), 500

@bp.route('/<int:id>', methods=['DELETE', 'OPTIONS'])
@bp.route('/<int:id>/', methods=['DELETE', 'OPTIONS'])
def delete_listing(id):
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        listing = Listing.query.get_or_404(id)
        
        # Delete associated images
        for image in listing.images:
            try:
                os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], image.filename))
            except OSError:
                pass
        
        db.session.delete(listing)
        db.session.commit()
        
        return '', 204
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting listing: {str(e)}")
        return jsonify({'error': 'Failed to delete listing'}), 500

@bp.route('/<int:id>', methods=['OPTIONS'])
def handle_options_id(id):
    return '', 200

@bp.route('/<int:id>', methods=['GET', 'OPTIONS'])
@bp.route('/<int:id>/', methods=['GET', 'OPTIONS'])
def get_single_listing(id):
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        listing = Listing.query.get_or_404(id)
        return jsonify({
            'id': listing.id,
            'title': listing.title,
            'description': listing.description,
            'price': listing.price,
            'category': listing.category,
            'status': listing.status,
            'user_id': listing.user_id,
            'created_at': listing.created_at.isoformat() if listing.created_at else None,
            'images': [image.filename for image in listing.images],
            'condition': listing.condition
        })
    except Exception as e:
        current_app.logger.error(f"Error fetching listing {id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch listing'}), 500

@bp.route('/<int:id>/notify', methods=['POST'])
def notify_seller(id):
    try:
        listing = Listing.query.get_or_404(id)
        seller = User.query.get(listing.user_id)
        
        if not seller or not seller.netid:
            return jsonify({'error': 'Seller not found or no email address available'}), 404
            
        # Change email message here!!
        msg = Message(
            subject=f'TigerPop: New Interest in Your Listing - {listing.title}',
            recipients=[f'{seller.netid}@princeton.edu'],
            body=f'Someone is interested in your listing "{listing.title}"', 
            html=f'''
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
                <h2 style="color: #4A90E2;">🎉 Someone is interested in your listing!</h2>
                <p><strong>Title:</strong> {listing.title}</p>
                <p><strong>Price:</strong> ${listing.price}</p>
                <p><strong>Category:</strong> {listing.category}</p>
                <hr style="margin: 20px 0;">
                <p>You can <a href="http://localhost:3000/listings/{listing.id}" style="color: #4A90E2;">view and manage your listing here</a>.</p>
                <p>– The <strong>TigerPop</strong> Team 🐯</p>
            </div>
            '''
        )
        # Send email
        mail.send(msg)
        
        return jsonify({
            'message': 'Notification sent successfully',
            'details': f'Email sent to {seller.netid}@princeton.edu'
        })
        
    except Exception as e:
        current_app.logger.error(f"Error sending notification: {str(e)}")
        error_message = str(e)
        if "BadCredentials" in error_message:
            return jsonify({
                'error': 'Email service configuration error',
                'details': 'Please contact the administrator to fix the email settings'
            }), 500
        elif "Connection refused" in error_message:
            return jsonify({
                'error': 'Email service unavailable',
                'details': 'Please try again later'
            }), 500
        else:
            return jsonify({
                'error': 'Failed to send notification',
                'details': 'An unexpected error occurred'
            }), 500

@bp.route('/<int:id>', methods=['PUT', 'OPTIONS'])
@bp.route('/<int:id>/', methods=['PUT', 'OPTIONS'])
def update_listing(id):
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        listing = Listing.query.get_or_404(id)
        
        # Handle both JSON and form data
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
        
        # Update listing fields if provided
        if 'title' in data:
            listing.title = data['title']
        if 'description' in data:
            listing.description = data['description']
        if 'price' in data:
            try:
                price = float(data['price'])
                if price <= 0:
                    return jsonify({'error': 'Price must be greater than 0'}), 400
                listing.price = price
            except ValueError:
                return jsonify({'error': 'Invalid price format'}), 400
        if 'category' in data:
            listing.category = data['category']
        if 'images' in data:
            # Clear existing images
            ListingImage.query.filter_by(listing_id=listing.id).delete()
            # Add new image
            try:
                image_urls = json.loads(data['images']) if isinstance(data['images'], str) else data['images']
                for image_url in image_urls:
                    image = ListingImage(filename=image_url, listing_id=listing.id)
                    db.session.add(image)
            except json.JSONDecodeError:
                current_app.logger.error("Failed to parse image URLs")
                return jsonify({'error': 'Invalid image data format'}), 400
        if 'condition' in data:
            listing.condition = data['condition']
        
        db.session.commit()
        
        return jsonify({
            'id': listing.id,
            'title': listing.title,
            'description': listing.description,
            'price': listing.price,
            'category': listing.category,
            'status': listing.status,
            'user_id': listing.user_id,
            'created_at': listing.created_at.isoformat() if listing.created_at else None,
            'images': [image.filename for image in listing.images],
            'condition': listing.condition
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating listing: {str(e)}")
        return jsonify({'error': 'Failed to update listing'}), 500

@bp.route('/<int:id>/heart', methods=['POST', 'OPTIONS'])
@bp.route('/<int:id>/heart/', methods=['POST', 'OPTIONS'])
def heart_listing(id):
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        netid = data.get('netid')
        
        if not netid:
            return jsonify({'error': 'NetID is required'}), 400

        # Get the user from the database
        user = User.query.filter_by(netid=netid).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        listing = Listing.query.get_or_404(id)
        if listing.status != 'available':
            return jsonify({'error': 'Listing is not available'}), 400

        # Check if already hearted
        existing_heart = HeartedListing.query.filter_by(
            user_id=user.id,
            listing_id=id
        ).first()

        if existing_heart:
            return jsonify({'error': 'Listing already hearted'}), 400

        hearted_listing = HeartedListing(
            user_id=user.id,
            listing_id=id
        )
        db.session.add(hearted_listing)
        db.session.commit()

        return jsonify({'message': 'Listing hearted successfully'}), 200
    except Exception as e:
        current_app.logger.error(f"Error hearting listing: {str(e)}")
        current_app.logger.exception("Full traceback:")
        db.session.rollback()
        return jsonify({'error': 'Failed to heart listing'}), 500

@bp.route('/<int:id>/heart', methods=['DELETE', 'OPTIONS'])
@bp.route('/<int:id>/heart/', methods=['DELETE', 'OPTIONS'])
def unheart_listing(id):
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        netid = data.get('netid')
        
        if not netid:
            return jsonify({'error': 'NetID is required'}), 400

        # Get the user from the database
        user = User.query.filter_by(netid=netid).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        hearted_listing = HeartedListing.query.filter_by(
            user_id=user.id,
            listing_id=id
        ).first_or_404()

        db.session.delete(hearted_listing)
        db.session.commit()

        return jsonify({'message': 'Listing unhearted successfully'}), 200
    except Exception as e:
        current_app.logger.error(f"Error unhearting listing: {str(e)}")
        current_app.logger.exception("Full traceback:")
        return jsonify({'error': 'Failed to unheart listing'}), 500

@bp.route('/hearted', methods=['GET', 'OPTIONS'])
@bp.route('/hearted/', methods=['GET', 'OPTIONS'])
def get_hearted_listings():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        netid = request.args.get('netid')
        current_app.logger.info(f"Fetching hearted listings for netid: {netid}")
        
        if not netid:
            current_app.logger.error("No netid provided in request")
            return jsonify({'error': 'NetID is required'}), 400

        # Get the user from the database
        user = User.query.filter_by(netid=netid).first()
        if not user:
            current_app.logger.error(f"User not found for netid: {netid}")
            return jsonify({'error': 'User not found'}), 404

        # Get hearted listings
        hearted_listings = HeartedListing.query.filter_by(user_id=user.id).all()
        listing_ids = [hl.listing_id for hl in hearted_listings]
        
        # Get the actual listings
        listings = Listing.query.filter(Listing.id.in_(listing_ids)).all()
        
        current_app.logger.info(f"Found {len(listings)} hearted listings for user {netid}")
        return jsonify([listing.to_dict() for listing in listings]), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching hearted listings: {str(e)}")
        current_app.logger.exception("Full traceback:")
        return jsonify({'error': 'Failed to fetch hearted listings'}), 500
