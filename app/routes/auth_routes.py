from flask import Blueprint, request, jsonify, redirect, session, Response, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import db
from ..models import User
from ..cas.auth import cas_bp, is_authenticated, get_cas_ticket, validate, create_or_update_user, generate_jwt_token, CAS_SERVER
from sqlalchemy import text
import bcrypt
import logging
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
import os
import urllib.parse
import requests
from app.cas.auth import extract_netid_from_cas_response
import xml.etree.ElementTree as ET

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
    """Handle CAS login and ticket validation."""
    ticket = request.args.get('ticket')
    
    if not ticket:
        # No ticket provided, redirect to CAS login
        service_url = request.url
        cas_login_url = f"{CAS_URL}/login?service={urllib.parse.quote(service_url)}"
        return redirect(cas_login_url)
    
    # Validate the ticket
    user_info = validate(ticket)
    if not user_info:
        current_app.logger.error("Failed to validate CAS ticket")
        return jsonify({'error': 'Invalid ticket'}), 401
    
    # Get the netid from the user info
    netid = user_info.get('user')
    if not netid:
        current_app.logger.error("No netid found in CAS response")
        return jsonify({'error': 'No netid found'}), 401
    
    # Check if user exists in database
    user = User.query.filter_by(netid=netid).first()
    if not user:
        # Create new user
        user = User(netid=netid)
        db.session.add(user)
        db.session.commit()
        current_app.logger.info(f"Created new user: {netid}")
    
    # Generate JWT token
    access_token = create_access_token(
        identity=user.id,
        additional_claims={
            'netid': user.netid
        }
    )
    
    # Store the netid in the session
    session['netid'] = netid
    session['access_token'] = access_token
    
    # Redirect back to frontend with the netid and token
    frontend_url = f"{current_app.config['FRONTEND_URL']}/auth/callback?netid={netid}&token={access_token}"
    return redirect(frontend_url)

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
def validate_ticket_route():
    """Validate a CAS ticket and return user info."""
    ticket = request.args.get('ticket')
    service_url = request.args.get('service')
    
    current_app.logger.info(f"Validating ticket: {ticket}")
    current_app.logger.info(f"Service URL: {service_url}")
    
    if not ticket:
        current_app.logger.error("Missing ticket")
        return jsonify({'error': 'Missing ticket'}), 400
    
    # Use the frontend URL as the service URL
    service_url = service_url or f"{current_app.config['FRONTEND_URL']}/api/auth/cas/login"
    
    # Validate ticket with CAS
    val_url = f'{CAS_SERVER}/serviceValidate?service={urllib.parse.quote(service_url)}&ticket={urllib.parse.quote(ticket)}'
    current_app.logger.info(f"Validation URL: {val_url}")
    
    try:
        # Make request to CAS server
        response = requests.get(val_url, verify=True)  # Always verify SSL in production
        response.raise_for_status()
        
        current_app.logger.info(f"CAS Response: {response.text}")
        
        # Parse XML response
        root = ET.fromstring(response.text)
        success = root.find('.//{http://www.yale.edu/tp/cas}authenticationSuccess')
        
        if success is not None:
            # Get netid from response
            user = success.find('{http://www.yale.edu/tp/cas}user')
            if user is not None:
                netid = user.text
                current_app.logger.info(f"Found netid: {netid}")
                
                # Create or update user
                user = User.query.filter_by(netid=netid).first()
                if not user:
                    current_app.logger.info(f"Creating new user with netid: {netid}")
                    user = User(netid=netid)
                    db.session.add(user)
                    db.session.commit()
                    current_app.logger.info(f"Created new user with id: {user.id}")
                else:
                    current_app.logger.info(f"Found existing user with id: {user.id}")
                
                # Generate JWT token
                access_token = create_access_token(
                    identity=user.id,
                    additional_claims={
                        'netid': user.netid
                    }
                )
                
                # Store in session and return
                session['netid'] = netid
                session['access_token'] = access_token
                current_app.logger.info(f"Stored netid in session: {netid}")
                return jsonify({
                    'netid': netid,
                    'access_token': access_token
                }), 200
        
        current_app.logger.error("Invalid ticket - no success element found in CAS response")
        return jsonify({'error': 'Invalid ticket'}), 401
        
    except Exception as e:
        current_app.logger.error(f"Error validating ticket: {str(e)}")
        return jsonify({'error': 'Validation failed'}), 500

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
def check_user():
    """Check if user exists, create if they don't."""
    try:
        # Get netid from session or request
        netid = session.get('netid') or request.json.get('netid')
        if not netid:
            current_app.logger.error("No netid found in session or request")
            return jsonify({'error': 'No netid found'}), 401
            
        current_app.logger.info(f"Checking user with netid: {netid}")
        
        # Check if user exists
        user = User.query.filter_by(netid=netid).first()
        if not user:
            # Create new user if they don't exist
            current_app.logger.info(f"Creating new user with netid: {netid}")
            user = User(netid=netid)
            db.session.add(user)
            db.session.commit()
            current_app.logger.info(f"Created new user with id: {user.id}")
        else:
            current_app.logger.info(f"Found existing user with id: {user.id}")
        
        # Generate new JWT token
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                'netid': user.netid
            }
        )
        
        # Store token in session
        session['access_token'] = access_token
        
        current_app.logger.info(f"User check successful for netid: {netid}")
        return jsonify({
            'netid': user.netid,
            'user_id': user.id,
            'access_token': access_token
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error checking user: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to check user'}), 500

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
