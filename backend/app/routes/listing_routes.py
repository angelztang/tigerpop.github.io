from flask import Blueprint, request, jsonify, current_app, session
from werkzeug.utils import secure_filename
import os
from ..extensions import db
from ..models import Listing, ListingImage, User, HeartedListing
from ..models.bid import Bid
from datetime import datetime, timedelta
from sqlalchemy import and_, or_, func
from ..utils.cloudinary_config import upload_image
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from flask_mail import Message
from ..extensions import mail

bp = Blueprint('listing', __name__)

# Configure upload settings
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}  # Only allow these image formats

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
        conditions = request.args.getlist('condition')  # Get list of conditions
        
        # Log the incoming request parameters
        current_app.logger.info(f"Listing request parameters: status={status}, category={category}, max_price={max_price}")
        
        # Start with base query
        query = Listing.query
        
        # Log the initial query
        current_app.logger.info("Initial query before filters:")
        current_app.logger.info(str(query))
        
        try:
            # Apply filters if they exist
            if max_price:
                query = query.filter(Listing.price <= max_price)
            if category:
                query = query.filter(Listing.category.ilike(category))
            if status:
                query = query.filter(Listing.status == status)
                current_app.logger.info(f"Applied status filter: {status}")
                current_app.logger.info(f"Query after status filter: {str(query)}")
            if conditions:  # Handle multiple conditions
                query = query.filter(Listing.condition.in_(conditions))
                
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
            current_app.logger.info("Executing query...")
            listings = query.order_by(Listing.created_at.desc()).all()
            current_app.logger.info(f"Query executed successfully. Found {len(listings)} listings.")
            
            # Log the raw listings from the database
            current_app.logger.info(f"Raw listings from database (count: {len(listings)}):")
            for listing in listings:
                current_app.logger.info(f"Listing ID: {listing.id}, Title: {listing.title}, Status: {listing.status}, Pricing Mode: {listing.pricing_mode}")
            
            # Convert to dictionary format using the model's to_dict method
            result = []
            for listing in listings:
                try:
                    listing_dict = listing.to_dict()
                    # Add any additional fields needed
                    listing_dict['user_netid'] = listing.seller.netid if listing.seller else None
                    listing_dict['seller_id'] = listing.user_id
                    result.append(listing_dict)
                    
                    # Log the processed listing data
                    current_app.logger.info(f"Processed listing: ID={listing_dict['id']}, Status={listing_dict['status']}, Pricing Mode={listing_dict['pricing_mode']}")
                except Exception as dict_error:
                    current_app.logger.error(f"Error converting listing {listing.id} to dict: {str(dict_error)}")
                    current_app.logger.exception("Full traceback:")
                    continue
            
            # Log the final result count
            current_app.logger.info(f"Final result count: {len(result)}")
            
            return jsonify(result)
        except Exception as query_error:
            current_app.logger.error(f"Error executing query: {str(query_error)}")
            current_app.logger.exception("Full traceback:")
            return jsonify({'error': 'Failed to execute query'}), 500
            
    except Exception as e:
        current_app.logger.error(f"Error fetching listings: {str(e)}")
        current_app.logger.exception("Full traceback:")
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
        if not all([title, description, category, user_id, pricing_mode]):
            missing_fields = []
            if not title: missing_fields.append('title')
            if not description: missing_fields.append('description')
            if not category: missing_fields.append('category')
            if not condition: missing_fields.append('condition')
            if not user_id: missing_fields.append('user_id')
            if not pricing_mode: missing_fields.append('pricing_mode')
            current_app.logger.error(f"Missing required fields: {missing_fields}")
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        # Validate pricing_mode
        if pricing_mode.lower() not in ['fixed', 'auction']:
            current_app.logger.error(f"Invalid pricing_mode: {pricing_mode}")
            return jsonify({'error': 'pricing_mode must be either "fixed" or "auction"'}), 400

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
                pricing_mode=pricing_mode.lower()  # Ensure consistent casing
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
        
        # Debug log raw listings
        current_app.logger.info(f"Raw listings before serialization:")
        for listing in listings:
            current_app.logger.info(f"Listing {listing.id}: pricing_mode={listing.pricing_mode}, title={listing.title}")
            current_app.logger.info(f"Full listing object: {listing.__dict__}")
        
        # Convert to dictionary format using the model's to_dict method
        result = []
        for listing in listings:
            listing_dict = listing.to_dict()
            # Log the pricing_mode value from the database
            current_app.logger.info(f"Listing {listing.id} pricing_mode from DB: {listing.pricing_mode}")
            # Log the pricing_mode value after serialization
            current_app.logger.info(f"Listing {listing.id} pricing_mode after serialization: {listing_dict.get('pricing_mode')}")
            result.append(listing_dict)
        
        # Debug log serialized listings
        current_app.logger.info(f"Serialized listings:")
        for listing_dict in result:
            current_app.logger.info(f"Listing {listing_dict['id']}: pricing_mode={listing_dict.get('pricing_mode')}, title={listing_dict.get('title')}")
        
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f"Error in get_user_listings: {str(e)}")
        return jsonify({'error': str(e)}), 500

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
        
        # Convert to dictionary format using the model's to_dict method
        return jsonify([listing.to_dict() for listing in listings])
    except Exception as e:
        current_app.logger.error(f"Error fetching buyer listings: {str(e)}")
        return jsonify({'error': 'Failed to fetch buyer listings'}), 500

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
            # Update the listing with the winning bid information
            listing.buyer_id = highest_bid.bidder_id
            listing.current_bid = highest_bid.amount
            db.session.commit()
            
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
                if field == 'pricing_mode':
                    # Validate pricing_mode
                    if data[field].lower() not in ['fixed', 'auction']:
                        current_app.logger.error(f"Invalid pricing_mode: {data[field]}")
                        return jsonify({'error': 'pricing_mode must be either "fixed" or "auction"'}), 400
                    setattr(listing, field, data[field].lower())  # Ensure consistent casing
                else:
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
        
        # Convert to list of dictionaries using the model's to_dict method
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

@bp.route('/<int:listing_id>/request', methods=['POST'])
def request_to_buy(listing_id):
    try:
        current_app.logger.info(f"Starting request_to_buy for listing {listing_id}")
        
        # Get the listing
        listing = Listing.query.get_or_404(listing_id)
        current_app.logger.info(f"Found listing: {listing.id}, status: {listing.status}")
        
        # Get buyer's netid from request
        data = request.get_json()
        current_app.logger.info(f"Received request data: {data}")
        
        buyer_netid = data.get('netid')
        if not buyer_netid:
            current_app.logger.error("No netid provided in request")
            return jsonify({'error': 'Buyer netid is required'}), 400
            
        # Get the buyer's information
        buyer = User.query.filter_by(netid=buyer_netid).first()
        if not buyer:
            current_app.logger.error(f"Buyer not found with netid {buyer_netid}")
            return jsonify({'error': 'Buyer not found'}), 404
        
        # Prevent users from requesting their own listings
        if listing.user_id == buyer.id:
            current_app.logger.error(f"User {buyer_netid} attempted to buy their own listing")
            return jsonify({'error': 'You cannot request to buy your own listing'}), 400
            
        # Check if listing is available
        if listing.status != 'available':
            current_app.logger.error(f"Listing {listing_id} is not available (status: {listing.status})")
            return jsonify({'error': 'This listing is no longer available'}), 400
        
        # Get the seller's information
        seller = User.query.get(listing.user_id)
        if not seller:
            current_app.logger.error(f"Seller not found for listing {listing_id}")
            return jsonify({'error': 'Seller not found'}), 404
            
        # Log email addresses
        seller_email = seller.email
        buyer_email = buyer.email
        current_app.logger.info(f"Seller's email address: {seller_email}")
        current_app.logger.info(f"Buyer's email address: {buyer_email}")
        current_app.logger.info(f"Seller's NetID: {seller.netid}")
        current_app.logger.info(f"Buyer's NetID: {buyer.netid}")
            
        # Update listing status to pending
        try:
            listing.status = 'pending'
            listing.buyer_id = buyer.id
            db.session.commit()
            current_app.logger.info(f"Updated listing {listing_id} status to pending")
            
            # Send email notification to seller
            try:
                current_app.logger.info(f"Preparing to send email to seller at {seller_email}")
                current_app.logger.info(f"Email will contain buyer's contact info: {buyer_email}")
                msg = Message(
                    'New Purchase Request',
                    recipients=[seller_email],
                    body=f'You have received a purchase request for your listing "{listing.title}" from {buyer.netid}.\n\n'
                         f'Please contact them at {buyer_email} to arrange the transaction.'
                )
                mail.send(msg)
                current_app.logger.info(f"Successfully sent purchase request notification to seller at {seller_email}")
            except Exception as email_error:
                current_app.logger.error(f"Error sending email notification to {seller_email}: {str(email_error)}")
                # Don't fail the request if email fails
                
        except Exception as db_error:
            current_app.logger.error(f"Database error while updating listing: {str(db_error)}")
            current_app.logger.exception("Full traceback:")
            db.session.rollback()
            return jsonify({'error': 'Failed to update listing status'}), 500
        
        return jsonify({
            'message': 'Request sent successfully',
            'listing': listing.to_dict()
        }), 200
            
    except Exception as e:
        current_app.logger.error(f"Error processing buy request: {str(e)}")
        current_app.logger.exception("Full traceback:")
        return jsonify({'error': 'Failed to process request'}), 500
