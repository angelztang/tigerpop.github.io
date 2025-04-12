from flask import Blueprint, request, jsonify, redirect, session, Response
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import db
from ..models import User
from ..cas.auth import cas_bp, is_authenticated, get_cas_ticket, validate_cas_ticket, create_or_update_user, generate_jwt_token
import bcrypt
import logging

bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

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
        # If no ticket, redirect to CAS login with the correct frontend service URL
        login_url = 'https://fed.princeton.edu/cas/login'
        service_url = 'https://tigerpop-marketplace-frontend-df8f1fbc1309.herokuapp.com/api/auth/cas/login'
        return redirect(f'{login_url}?service={service_url}')
    
    # Validate the ticket
    netid = validate_cas_ticket(ticket)
    if not netid:
        return redirect(f'https://tigerpop-marketplace-frontend-df8f1fbc1309.herokuapp.com/login?error=invalid_ticket')
    
    # Create or update user
    user = create_or_update_user(netid)
    
    # Generate JWT token
    token = generate_jwt_token(user)
    
    # Redirect back to frontend with token and netid
    return redirect(f'https://tigerpop-marketplace-frontend-df8f1fbc1309.herokuapp.com/login?token={token}&netid={netid}')

@bp.route('/cas/logout')
def cas_logout():
    """Handle CAS logout."""
    # Clear session
    session.clear()
    
    # Redirect to CAS logout
    logout_url = 'https://fed.princeton.edu/cas/logout'
    service_url = request.args.get('redirect_uri', 'https://tigerpop-marketplace-frontend-df8f1fbc1309.herokuapp.com')
    return redirect(f'{logout_url}?service={service_url}')
