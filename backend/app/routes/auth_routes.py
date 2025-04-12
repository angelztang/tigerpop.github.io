from flask import Blueprint, request, jsonify, redirect, session, Response
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import db
from ..models import User
from ..cas.auth import cas_bp, is_authenticated, get_cas_ticket, validate_cas_ticket, create_or_update_user, generate_jwt_token
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
            logger.error(f"User not found for user_id: {current_user_id}")
            return jsonify({'error': 'User not found'}), 404
            
        logger.info(f"Token verified successfully for user: {user.netid}")
        return jsonify({
            'netid': user.netid,
            'user_id': user.id
        }), 200
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        return jsonify({'error': 'Invalid token'}), 401
