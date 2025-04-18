from flask import Blueprint, request, jsonify, redirect, session, Response, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import db
from ..models import User
from ..cas.auth import cas_bp, is_authenticated, get_cas_ticket, validate_cas_ticket, create_or_update_user, generate_jwt_token, CAS_SERVER
from sqlalchemy import text
import bcrypt
import logging
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

@bp.route('/test-db', methods=['GET'])
def test_db():
    """Test database connection."""
    try:
        logger.info("Starting database connection test")
        
        # Set a shorter timeout for the query
        # Get the database URL from config
        db_url = db.engine.url
        logger.info(f"Using database URL: {db_url}")
        
        # Create a new engine with a timeout
        engine = create_engine(db_url, connect_args={'connect_timeout': 10})
        
        # Try to execute a simple query with the new engine
        with engine.connect() as conn:
            logger.info("Executing test query")
            result = conn.execute(text('SELECT 1'))
            logger.info("Query executed successfully")
            return jsonify({'status': 'success', 'message': 'Database connection is working'}), 200
            
    except OperationalError as e:
        logger.error(f"Database operational error: {str(e)}")
        return jsonify({'status': 'error', 'message': 'Database connection timeout'}), 503
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data['username']
    email = data['email']
    password = data['password']
    
    # Hash the password before storing
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    new_user = User(username=username, email=email, password=hashed.decode('utf-8'))
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User created successfully!'}), 201

@bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'message': 'Username and password are required'}), 400
            
        user = User.query.filter_by(username=username).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({'message': 'Invalid username or password'}), 401
            
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        })
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'message': 'An error occurred during login'}), 500

@bp.route('/cas/login')
def cas_login():
    """Handle CAS login."""
    ticket = get_cas_ticket()
    
    if not ticket:
        # If no ticket, redirect to CAS login
        login_url = 'https://fed.princeton.edu/cas/login'
        service_url = request.args.get('redirect_uri', 'http://localhost:3000')
        return redirect(f'{login_url}?service={service_url}')
    
    # Validate the ticket
    username = validate_cas_ticket(ticket)
    if not username:
        return redirect(f'http://localhost:3000/login?error=invalid_ticket')
    
    # Create or update user
    user = create_or_update_user(username)
    
    # Generate JWT token
    token = generate_jwt_token(user)
    
    # Redirect back to frontend with token
    redirect_uri = request.args.get('redirect_uri', 'http://localhost:3000')
    return redirect(f'{redirect_uri}?token={token}')

@bp.route('/cas/logout')
def cas_logout():
    """Handle CAS logout."""
    # Clear session
    session.clear()
    
    # Redirect to CAS logout
    logout_url = 'https://fed.princeton.edu/cas/logout'
    service_url = request.args.get('redirect_uri', 'http://localhost:3000')
    return redirect(f'{logout_url}?service={service_url}')

@bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token():
    """Verify the JWT token and return user info."""
    try:
        current_user_id = get_jwt_identity()
        logger.info(f"Verifying token for user_id: {current_user_id}")
        
        # Get additional claims from the token
        additional_claims = get_jwt()
        netid = additional_claims.get('netid')
        logger.info(f"Token claims: {additional_claims}")
        
        if not netid:
            logger.error("No netid found in token claims")
            return jsonify({'error': 'Invalid token claims'}), 401
            
        user = User.query.get(current_user_id)
        if not user:
            # If user doesn't exist, create them
            logger.info(f"User not found, creating new user with netid: {netid}")
            user = User(netid=netid)
            db.session.add(user)
            db.session.commit()
            logger.info(f"Created new user with id: {user.id}")
            
        logger.info(f"Token verified successfully for user: {user.netid}")
        return jsonify({
            'netid': user.netid,
            'user_id': user.id
        }), 200
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        return jsonify({'error': 'Invalid token'}), 401

@bp.route('/validate', methods=['GET'])
def validate_ticket():
    """Validate CAS ticket and return netid."""
    ticket = request.args.get('ticket')
    if not ticket:
        return jsonify({'error': 'No ticket provided'}), 400
    
    # Get the service URL from the request
    service_url = request.args.get('service')
    if not service_url:
        return jsonify({'error': 'No service URL provided'}), 400
    
    # Validate the ticket with CAS server
    try:
        # Call validate_cas_ticket with both ticket and service URL
        netid = validate_cas_ticket(ticket, service_url)
        if netid:
            return jsonify({'netid': netid}), 200
        return jsonify({'error': 'Invalid ticket'}), 401
    except Exception as e:
        current_app.logger.error(f"Error validating ticket: {str(e)}")
        return jsonify({'error': 'Error validating ticket'}), 500

@bp.route('/users/initialize', methods=['POST'])
def initialize_user():
    """Initialize a user in the database after successful CAS authentication."""
    try:
        data = request.get_json()
        netid = data.get('netid')
        
        if not netid:
            return jsonify({'error': 'No netid provided'}), 400
            
        logger.info(f"Initializing user with netid: {netid}")
        
        # Check if user exists
        user = User.query.filter_by(netid=netid).first()
        
        if not user:
            # Create new user
            logger.info(f"Creating new user for netid: {netid}")
            user = User(netid=netid)
            db.session.add(user)
            db.session.commit()
            logger.info(f"Created new user with id: {user.id}")
        else:
            logger.info(f"Found existing user with id: {user.id}")
        
        return jsonify({
            'netid': user.netid,
            'user_id': user.id
        }), 200
        
    except Exception as e:
        logger.error(f"Error initializing user: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to initialize user'}), 500

@bp.route('/users/check', methods=['POST', 'OPTIONS'])
def check_user():
    """Check if user exists, create if they don't."""
    # Handle preflight request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response

    try:
        data = request.get_json()
        netid = data.get('netid')
        
        if not netid:
            logger.error("No netid provided")
            return jsonify({'error': 'No netid provided'}), 400
            
        # Simplified user check and creation
        user = User.query.filter_by(netid=netid).first()
        if not user:
            user = User(netid=netid)
            db.session.add(user)
            db.session.commit()
            logger.info(f"Created new user with netid: {netid}")
        else:
            logger.info(f"Found existing user with netid: {netid}")
        
        response = jsonify({
            'netid': user.netid,
            'user_id': user.id
        })
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response, 200
        
    except Exception as e:
        logger.error(f"Error checking/creating user: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
