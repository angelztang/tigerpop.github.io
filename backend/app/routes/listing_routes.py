from flask import Blueprint, request, jsonify, current_app, session
from werkzeug.utils import secure_filename
import os
from ..extensions import db, mail
from ..models import Listing, ListingImage, User, HeartedListing
from ..models.bid import Bid
from datetime import datetime, timedelta
from sqlalchemy import and_, or_, func
from flask_mail import Message
from ..utils.cloudinary_config import upload_image
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

# --- Email Notification Helpers ---
def get_user_email(user_id):
    user = User.query.get(user_id)
    return getattr(user, 'email', None) if user else None

def notify_seller_new_bid(listing, bid):
    seller = User.query.get(listing.user_id)
    if not seller or not getattr(seller, 'email', None):
        current_app.logger.warning(f"No email for seller (user_id={listing.user_id})")
        return
    msg = Message(
        subject=f"New Bid on Your Listing: {listing.title}",
        recipients=[seller.email],
        body=f"A new bid of ${bid.amount:.2f} was placed on your auction '{listing.title}'."
    )
    try:
        mail.send(msg)
        current_app.logger.info(f"Notified seller {seller.email} of new bid.")
    except Exception as e:
        current_app.logger.error(f"Failed to send seller bid email: {e}")

def notify_outbid(prev_bid, listing):
    prev_bidder = User.query.get(prev_bid.bidder_id)
    if not prev_bidder or not getattr(prev_bidder, 'email', None):
        current_app.logger.warning(f"No email for outbid user (user_id={prev_bid.bidder_id})")
        return
    msg = Message(
        subject=f"You've Been Outbid on {listing.title}",
        recipients=[prev_bidder.email],
        body=f"You've been outbid on '{listing.title}'. The new highest bid is ${prev_bid.amount:.2f}."
    )
    try:
        mail.send(msg)
        current_app.logger.info(f"Notified outbid user {prev_bidder.email}.")
    except Exception as e:
        current_app.logger.error(f"Failed to send outbid email: {e}")

def notify_winner(winning_bid, listing):
    winner = User.query.get(winning_bid.bidder_id)
    if not winner or not getattr(winner, 'email', None):
        current_app.logger.warning(f"No email for winner (user_id={winning_bid.bidder_id})")
        return
    msg = Message(
        subject=f"You Won the Auction: {listing.title}",
        recipients=[winner.email],
        body=f"Congratulations! You won the auction for '{listing.title}' with a bid of ${winning_bid.amount:.2f}."
    )
    try:
        mail.send(msg)
        current_app.logger.info(f"Notified winner {winner.email}.")
    except Exception as e:
        current_app.logger.error(f"Failed to send winner email: {e}")

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
        result = []
        for listing in listings:
            try:
                current_bid = listing.get_current_bid()
            except Exception as e:
                current_app.logger.error(f"Error getting current bid for listing {listing.id}: {str(e)}")
                current_bid = None
                
            result.append({
                'id': listing.id,
                'title': listing.title,
                'description': listing.description,
                'price': listing.price,
                'category': listing.category,
                'status': listing.status,
                'user_id': listing.user_id,
                'created_at': listing.created_at.isoformat() if listing.created_at else None,
                'images': [image.filename for image in listing.images],
                'condition': listing.condition,
                'pricing_mode': listing.pricing_mode,
                'current_bid': current_bid
            })
        
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f"Error fetching listings: {str(e)}")
        return jsonify({'error': 'Failed to fetch listings'}), 500

@bp.route('', methods=['POST'])
@bp.route('/', methods=['POST'])
def create_listing():
    try:
        # Handle both JSON and form data
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()

        current_app.logger.info(f"Received listing creation request with data: {data}")
        current_app.logger.info(f"Pricing mode from request: {data.get('pricing_mode')}")
        current_app.logger.info(f"Full request data: {data}")

        # Get required fields
        title = data.get('title')
        description = data.get('description')
        price = data.get('price')
        category = data.get('category', 'other')
        condition = data.get('condition', 'good')
        image_urls = data.get('images', [])
        pricing_mode = data.get('pricing_mode')
        user_id = data.get('user_id')  # Get user_id from request data instead of JWT
        
        current_app.logger.info(f"Pricing mode after processing: {pricing_mode}")

        # Validate required fields
        if not all([title, description, category, user_id]):
            missing_fields = []
            if not title: missing_fields.append('title')
            if not description: missing_fields.append('description')
            if not category: missing_fields.append('category')
            if not user_id: missing_fields.append('user_id')
            current_app.logger.error(f"Missing required fields: {missing_fields}")
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        # Validate price based on pricing mode
        if not price:
            return jsonify({'error': 'Price is required'}), 400
        try:
            price = float(price)
            if price <= 0:
                return jsonify({'error': 'Price must be greater than 0'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid price format'}), 400

        try:
            # Create new listing
            new_listing = Listing(
                title=title,
                description=description,
                price=price,
                user_id=user_id,
                category=category,
                condition=condition,
                status='available',
                pricing_mode=pricing_mode
            )
            current_app.logger.info(f"Created listing with pricing_mode: {new_listing.pricing_mode}")
            current_app.logger.info(f"Listing object before commit: {new_listing.__dict__}")

            # Add listing to database first to get the ID
            db.session.add(new_listing)
            db.session.commit()
            current_app.logger.info(f"Committed listing with pricing_mode: {new_listing.pricing_mode}")
            current_app.logger.info(f"Listing object after commit: {new_listing.__dict__}")

            # Create image records if there are any
            if image_urls:
                for url in image_urls:
                    image = ListingImage(filename=url, listing_id=new_listing.id)
                    db.session.add(image)
                db.session.commit()

            current_app.logger.info(f"Successfully created listing with ID: {new_listing.id}")
            current_app.logger.info(f"Listing pricing mode: {new_listing.pricing_mode}")

            # Return the listing with all its fields
            return jsonify(new_listing.to_dict()), 201

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
        result = []
        for listing in listings:
            try:
                current_bid = listing.get_current_bid()
            except Exception as e:
                current_app.logger.error(f"Error getting current bid for listing {listing.id}: {str(e)}")
                current_bid = None
                
            result.append({
                'id': listing.id,
                'title': listing.title,
                'description': listing.description,
                'price': listing.price,
                'category': listing.category,
                'status': listing.status,
                'user_id': listing.user_id,
                'created_at': listing.created_at.isoformat() if listing.created_at else None,
                'images': [image.filename for image in listing.images],
                'condition': listing.condition,
                'pricing_mode': listing.pricing_mode,
                'current_bid': current_bid
            })
        
        return jsonify(result)
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

@bp.route('/<int:id>/bids', methods=['POST'])
def place_bid(id):
    try:
        listing = Listing.query.get_or_404(id)
        data = request.get_json()
        
        # Check if listing is an auction
        if listing.pricing_mode != 'auction':
            return jsonify({'error': 'Bids can only be placed on auction listings'}), 400
            
        # Convert bidder_id to integer if it's not already
        bidder_id = data.get('bidder_id')
        try:
            bidder_id = int(bidder_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid bidder ID format'}), 400
            
        # Check if bidder is the seller
        if bidder_id == listing.user_id:
            return jsonify({'error': 'Seller cannot bid on their own listing'}), 400
            
        # Convert amount to float if it's not already
        amount = data.get('amount')
        try:
            amount = float(amount)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid amount format'}), 400
            
        # Check if listing is available
        if listing.status != 'available':
            return jsonify({'error': 'Listing is not available'}), 400
            
        # Find previous highest bid (if any)
        prev_highest_bid = Bid.query.filter_by(listing_id=listing.id).order_by(Bid.amount.desc()).first()
        
        # Validate bid amount
        if prev_highest_bid and amount <= prev_highest_bid.amount:
            return jsonify({'error': 'Bid must be higher than current highest bid'}), 400
        elif amount <= listing.price:
            return jsonify({'error': 'Bid must be higher than starting price'}), 400
            
        # Place the new bid
        new_bid = Bid(listing_id=listing.id, bidder_id=bidder_id, amount=amount)
        db.session.add(new_bid)
        
        # Update listing's current bid
        listing.current_bid = amount
        listing.current_bidder_id = bidder_id
        
        db.session.commit()
        
        # Notify seller
        notify_seller_new_bid(listing, new_bid)
        
        # Notify previous highest bidder if outbid and not the same as new bidder
        if prev_highest_bid and prev_highest_bid.bidder_id != bidder_id:
            notify_outbid(prev_highest_bid, listing)
            
        # Return success
        return jsonify({'message': 'Bid placed successfully', 'bid': new_bid.to_dict()}), 201
    except Exception as e:
        current_app.logger.error(f"Error placing bid: {str(e)}")
        return jsonify({'error': 'Failed to place bid'}), 500

@bp.route('/<int:id>/heart', methods=['POST', 'OPTIONS'])
@bp.route('/<int:id>/heart/', methods=['POST', 'OPTIONS'])
def heart_listing(id):
    """Heart a listing."""
    # Handle OPTIONS request
    if request.method == 'OPTIONS':
        response = current_app.make_default_options_response()
        response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        return response

    try:
        data = request.get_json()
        netid = data.get('netid')
        
        if not netid:
            return jsonify({'error': 'NetID is required'}), 400

        # Get the user from the database
        user = User.query.filter_by(netid=netid).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Check if already hearted
        existing_heart = HeartedListing.query.filter_by(
            user_id=user.id,
            listing_id=id
        ).first()

        if existing_heart:
            return jsonify({'message': 'Listing already hearted'}), 200

        # Create new heart
        new_heart = HeartedListing(user_id=user.id, listing_id=id)
        db.session.add(new_heart)
        db.session.commit()

        return jsonify({'message': 'Listing hearted successfully'}), 201
    except Exception as e:
        current_app.logger.error(f"Error hearting listing: {str(e)}")
        current_app.logger.exception("Full traceback:")
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

@bp.route('/<int:id>/close-bidding', methods=['POST'])
def close_bidding(id):
    try:
        listing = Listing.query.get_or_404(id)
        if listing.pricing_mode != 'auction':
            return jsonify({'error': 'Only auction listings can be closed'}), 400
        
        listing.status = 'pending'
        db.session.commit()
        
        # Get highest bid
        highest_bid = Bid.query.filter_by(listing_id=id).order_by(Bid.amount.desc()).first()
        if highest_bid:
            # Send notification to highest bidder
            notify_winner(highest_bid, listing)
            
        return jsonify({'message': 'Bidding closed successfully'}), 200
    except Exception as e:
        current_app.logger.error(f"Error closing bidding: {str(e)}")
        return jsonify({'error': 'Failed to close bidding'}), 500

@bp.route('/<int:listing_id>', methods=['GET'])
def get_listing(listing_id):
    try:
        listing = Listing.query.get_or_404(listing_id)
        return jsonify(listing.to_dict())
    except Exception as e:
        current_app.logger.error(f"Error fetching listing: {str(e)}")
        return jsonify({'error': 'Failed to fetch listing'}), 500

@bp.route('/<int:listing_id>', methods=['PUT'])
def update_listing(listing_id):
    try:
        listing = Listing.query.get_or_404(listing_id)
        data = request.get_json()
        
        # Update allowed fields
        allowed_fields = ['title', 'description', 'price', 'category', 'condition', 'status', 'pricing_mode']
        for field in allowed_fields:
            if field in data:
                setattr(listing, field, data[field])
        
        db.session.commit()
        
        return jsonify(listing.to_dict())
    except Exception as e:
        current_app.logger.error(f"Error updating listing: {str(e)}")
        return jsonify({'error': 'Failed to update listing'}), 500

@bp.route('/<int:listing_id>/status', methods=['PATCH'])
def update_listing_status(listing_id):
    try:
        listing = Listing.query.get_or_404(listing_id)
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({'error': 'Status is required'}), 400
            
        listing.status = data['status']
        db.session.commit()
        
        return jsonify(listing.to_dict())
    except Exception as e:
        current_app.logger.error(f"Error updating listing status: {str(e)}")
        return jsonify({'error': 'Failed to update listing status'}), 500

@bp.route('/<int:listing_id>', methods=['DELETE'])
def delete_listing(listing_id):
    try:
        listing = Listing.query.get_or_404(listing_id)
        db.session.delete(listing)
        db.session.commit()
        return '', 204
    except Exception as e:
        current_app.logger.error(f"Error deleting listing: {str(e)}")
        return jsonify({'error': 'Failed to delete listing'}), 500

@bp.route('/hot', methods=['GET'])
def get_hot_items():
    """Get the 4 most hearted items from the last 3 days."""
    try:
        # Calculate the date 3 days ago
        three_days_ago = datetime.utcnow() - timedelta(days=3)
        
        # Query to get listings with their heart counts, including listings with no hearts
        hot_listings = db.session.query(
            Listing,
            func.count(HeartedListing.id).label('heart_count')
        ).outerjoin(  # Use outer join to include listings with no hearts
            HeartedListing,
            and_(
                Listing.id == HeartedListing.listing_id,
                HeartedListing.created_at >= three_days_ago
            )
        ).filter(
            Listing.status == 'available'  # Only show available listings
        ).group_by(
            Listing.id
        ).order_by(
            func.count(HeartedListing.id).desc(),  # Order by heart count
            Listing.created_at.desc()  # Secondary sort by creation date for ties
        ).limit(4).all()  # Get top 4
        
        # Convert to list of dictionaries
        result = []
        for listing, heart_count in hot_listings:
            listing_dict = listing.to_dict()
            listing_dict['heart_count'] = heart_count
            result.append(listing_dict)
        
        # Log the results for debugging
        current_app.logger.info(f"Found {len(result)} hot items")
        for item in result:
            current_app.logger.info(f"Hot item: {item['title']} with {item['heart_count']} hearts")
        
        return jsonify(result), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting hot items: {str(e)}")
        return jsonify({'error': 'Failed to get hot items'}), 500

@bp.route('/<int:id>/bids', methods=['GET'])
def get_bids(id):
    try:
        listing = Listing.query.get_or_404(id)
        bids = Bid.query.filter_by(listing_id=id).order_by(Bid.amount.desc()).all()
        return jsonify([bid.to_dict() for bid in bids])
    except Exception as e:
        current_app.logger.error(f"Error fetching bids: {str(e)}")
        return jsonify({'error': 'Failed to fetch bids'}), 500
