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
import os
import urllib.parse
import requests
from app.cas.auth import extract_netid_from_cas_response

bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

CAS_URL = 'https://fed.princeton.edu/cas/'

def strip_ticket(url):
    """Remove the ticket parameter from the URL."""
    parsed = urllib.parse.urlparse(url)
    query = urllib.parse.parse_qs(parsed.query)
    if 'ticket' in query:
        del query['ticket']
    new_query = urllib.parse.urlencode(query, doseq=True)
    return urllib.parse.urlunparse(parsed._replace(query=new_query))

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
            
        # Include netid in the token claims
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                'netid': user.netid
            }
        )
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'netid': user.netid
            }
        })
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'message': 'An error occurred during login'}), 500

@bp.route('/cas/login', methods=['GET'])
def cas_login():
    # If user is already authenticated, return their info
    if 'netid' in session:
        user = User.query.filter_by(netid=session['netid']).first()
        if user:
            return jsonify({
                'netid': user.netid,
                'name': user.name,
                'email': user.email
            })
        return jsonify({'netid': session['netid']})

    # Get the ticket from the request
    ticket = request.args.get('ticket')
    if not ticket:
        # No ticket, redirect to CAS login
        service_url = request.url
        login_url = f"{CAS_URL}/login?service={urllib.parse.quote(service_url)}"
        return redirect(login_url)

    # Validate the ticket
    service_url = strip_ticket(request.url)
    user_info = validate_cas_ticket(ticket, service_url)
    if not user_info:
        # Invalid ticket, redirect to CAS login
        login_url = f"{CAS_URL}/login?service={urllib.parse.quote(service_url)}"
        return redirect(login_url)

    # Store netid in session
    netid = user_info.get('netid')
    session['netid'] = netid

    # Check if user exists, create if not
    user = User.query.filter_by(netid=netid).first()
    if not user:
        user = User(netid=netid)
        db.session.add(user)
        db.session.commit()

    # Redirect back to frontend with netid
    frontend_url = request.args.get('redirect_uri', FRONTEND_URL)
    return redirect(f"{frontend_url}/auth/callback?netid={netid}")

@bp.route('/cas/logout', methods=['GET'])
def cas_logout():
    # Clear the session
    session.clear()
    # Redirect to CAS logout
    return redirect(f"{CAS_URL}logout")

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

@bp.route('/users/check', methods=['POST'])
@jwt_required()
def check_user():
    """Check if user exists, create if they don't."""
    try:
        # Get the current user from the JWT token
        current_user = get_jwt_identity()
        netid = current_user.get('netid')
        
        if not netid:
            logger.error("No netid found in JWT token")
            return jsonify({'error': 'No netid found in token'}), 401
            
        # Simplified user check and creation
        user = User.query.filter_by(netid=netid).first()
        if not user:
            # Create new user if they don't exist
            user = User(netid=netid)
            db.session.add(user)
            db.session.commit()
            logger.info(f"Created new user with netid: {netid}")
        
        return jsonify({
            'message': 'User checked successfully',
            'user_id': user.id,
            'netid': user.netid
        }), 200
        
    except Exception as e:
        logger.error(f"Error checking user: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to check user'}), 500

@bp.route('/validate', methods=['POST'])
def validate():
    """Validate a user's credentials."""
    data = request.get_json()
    if not data or 'netid' not in data:
        return jsonify({'error': 'Missing netid'}), 400

    netid = data['netid']
    try:
        user = User.query.filter_by(netid=netid).first()
        if not user:
            user = User(netid=netid)
            db.session.add(user)
            db.session.commit()

        # Include netid in the token claims
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                'netid': user.netid
            }
        )
        return jsonify({
            'token': access_token,
            'user': user.to_dict()
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error in validate: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Server error'}), 500

@bp.route('/validate', methods=['GET'])
def validate_session():
    if 'netid' in session:
        netid = session['netid']
        user = User.query.filter_by(netid=netid).first()
        if user:
            return jsonify({
                'netid': user.netid,
                'name': user.name,
                'email': user.email
            })
    return jsonify({'error': 'Not authenticated'}), 401
