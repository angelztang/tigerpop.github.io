from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
from ..extensions import db, mail
from ..models import Listing, ListingImage, User
from datetime import datetime
from sqlalchemy import and_, or_
from flask_mail import Message
from ..utils.cloudinary_config import upload_image
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
        
        # Start with base query
        query = Listing.query
        
        # Apply filters if they exist
        if max_price:
            query = query.filter(Listing.price <= max_price)
        if category:
            query = query.filter(Listing.category.ilike(category))
            
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
            'images': [image.filename for image in listing.images]  # Include image URLs
        } for listing in listings])
    except Exception as e:
        current_app.logger.error(f"Error fetching listings: {str(e)}")
        return jsonify({'error': 'Failed to fetch listings'}), 500

@bp.route('', methods=['POST'])
def create_listing():
    try:
        # Get form data
        title = request.form.get('title')
        description = request.form.get('description')
        price = request.form.get('price')
        category = request.form.get('category', 'other')
        user_id = request.form.get('user_id')
        images = request.form.get('images')

        # Validate required fields
        if not all([title, description, price, user_id]):
            return jsonify({'error': 'Missing required fields'}), 400

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
                user_id=user_id
            )

            # Add listing to database first to get the ID
            db.session.add(new_listing)
            db.session.commit()

            # Handle images if provided
            image_urls = []
            if images:
                try:
                    image_urls = json.loads(images)
                    for url in image_urls:
                        image = ListingImage(filename=url, listing_id=new_listing.id)
                        db.session.add(image)
                    db.session.commit()
                except json.JSONDecodeError:
                    current_app.logger.error("Failed to parse image URLs")
                    # Don't fail the listing creation if image parsing fails

            return jsonify({
                'id': new_listing.id,
                'title': new_listing.title,
                'description': new_listing.description,
                'price': new_listing.price,
                'category': new_listing.category,
                'status': new_listing.status,
                'user_id': new_listing.user_id,
                'images': image_urls,
                'created_at': new_listing.created_at.isoformat() if new_listing.created_at else None
            }), 201

        except Exception as db_error:
            db.session.rollback()
            current_app.logger.error(f"Database error: {str(db_error)}")
            return jsonify({'error': f'Database error: {str(db_error)}'}), 500

    except Exception as e:
        current_app.logger.error(f"Error creating listing: {str(e)}")
        return jsonify({'error': str(e)}), 500

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
        # Get the user_id from the query parameters
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
            
        # Get all listings for this user
        listings = Listing.query.filter_by(user_id=user_id).order_by(Listing.created_at.desc()).all()
        
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
def get_buyer_listings():
    try:
        # Get the user_id from the query parameters
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
            
        # Convert user_id to integer
        try:
            user_id = int(user_id)
        except ValueError:
            current_app.logger.error(f"Invalid user_id format: {user_id}")
            return jsonify({'error': 'Invalid user ID format'}), 400
            
        # Get all listings where this user is the buyer
        listings = Listing.query.filter_by(buyer_id=user_id).order_by(Listing.created_at.desc()).all()
        
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
    
    # Update listing with buyer information
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
    
    if listing.user_id != user_id:
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

@bp.route('/<int:id>', methods=['GET'])
def get_single_listing(id):
    try:
        listing = Listing.query.get_or_404(id)
        user = User.query.get(listing.user_id)
        return jsonify({
            'id': listing.id,
            'title': listing.title,
            'description': listing.description,
            'price': listing.price,
            'category': listing.category,
            'status': listing.status,
            'user_id': listing.user_id,
            'user_netid': user.netid if user else None,
            'created_at': listing.created_at.isoformat() if listing.created_at else None,
            'images': [image.filename for image in listing.images]
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

@bp.route('/<int:id>', methods=['PUT'])
def update_listing(id):
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
            # Add new images
            try:
                image_urls = json.loads(data['images']) if isinstance(data['images'], str) else data['images']
                for image_url in image_urls:
                    image = ListingImage(filename=image_url, listing_id=listing.id)
                    db.session.add(image)
            except json.JSONDecodeError:
                current_app.logger.error("Failed to parse image URLs")
                return jsonify({'error': 'Invalid image data format'}), 400
        
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
            'images': [image.filename for image in listing.images]
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating listing: {str(e)}")
        return jsonify({'error': 'Failed to update listing'}), 500

@bp.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response
