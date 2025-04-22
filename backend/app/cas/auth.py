#!/usr/bin/env python

import urllib.request
import urllib.parse
import re
import json
import logging
from flask import current_app, request, redirect, url_for, session, jsonify, abort
import ssl
from flask_jwt_extended import create_access_token
from ..extensions import db
from ..models import User
import requests
from ..extensions import jwt
import xml.etree.ElementTree as ET
from flask import Blueprint
from datetime import datetime, timedelta
import os
from functools import wraps

#-----------------------------------------------------------------------

_CAS_URL = 'https://fed.princeton.edu/cas/'  # Princeton CAS server
_BACKEND_URL = 'https://tigerpop-marketplace-backend-76fa6fb8c8a2.herokuapp.com'  # Backend URL
_FRONTEND_URL = 'https://tigerpop-marketplace-frontend-df8f1fbc1309.herokuapp.com'  # Frontend URL

logger = logging.getLogger(__name__)

cas_bp = Blueprint('cas', __name__)

CAS_SERVER = 'https://fed.princeton.edu/cas'
CAS_SERVICE = f'{_FRONTEND_URL}/auth/callback'

#-----------------------------------------------------------------------

def strip_ticket(url):
    """Strip the ticket parameter from a URL."""
    if url is None:
        return "something is badly wrong"
    url = re.sub(r'ticket=[^&]*&?', '', url)
    url = re.sub(r'\?&?$|&$', '', url)
    return url

#-----------------------------------------------------------------------

def get_service_url():
    """Get the service URL for CAS authentication."""
    # Get the base URL without any existing parameters
    base_url = request.base_url
    redirect_uri = request.args.get('redirect_uri')
    if redirect_uri:
        # Only add redirect_uri if it's not already in the URL
        if 'redirect_uri=' not in base_url:
            base_url = f"{base_url}?redirect_uri={redirect_uri}"
    return base_url

#-----------------------------------------------------------------------

def get_cas_ticket():
    """Extract the CAS ticket from the request."""
    ticket = request.args.get('ticket')
    if not ticket:
        # Check if we're being redirected from Duo
        duo_redirect = request.args.get('redirect_uri')
        if duo_redirect and 'ticket=' in duo_redirect:
            ticket = re.search(r'ticket=([^&]+)', duo_redirect).group(1)
    return ticket

def extract_netid_from_cas_response(response_text):
    """Extract the netid directly from the CAS response."""
    try:
        # Parse the XML response
        root = ET.fromstring(response_text)
        # Find the authentication success element
        success = root.find('.//{http://www.yale.edu/tp/cas}authenticationSuccess')
        if success is not None:
            # Extract the netid from the user element
            user = success.find('{http://www.yale.edu/tp/cas}user')
            if user is not None:
                netid = user.text
                current_app.logger.info(f"Extracted netid from CAS response: {netid}")
                return netid
            else:
                current_app.logger.error("No user element found in CAS response")
        else:
            current_app.logger.error("No authentication success found in CAS response")
        return None
    except Exception as e:
        current_app.logger.error(f"Error extracting netid from CAS response: {str(e)}")
        return None

def validate(ticket, service_url=None):
    """Validate a login ticket by contacting the CAS server."""
    if not ticket:
        logger.error("No ticket provided for validation")
        return None

    # Use the frontend callback URL as the service URL
    service_url = service_url or f'{_FRONTEND_URL}/api/auth/cas/login'
    logger.info(f"Validating ticket: {ticket}")
    logger.info(f"Service URL: {service_url}")

    # Construct the validation URL
    val_url = f'{CAS_SERVER}/serviceValidate?service={urllib.parse.quote(service_url)}&ticket={urllib.parse.quote(ticket)}'
    logger.info(f"Validation URL: {val_url}")

    try:
        # Make request to CAS server
        response = requests.get(val_url, verify=True)  # Always verify SSL in production
        logger.info(f"CAS Response Status: {response.status_code}")
        logger.info(f"CAS Response Headers: {response.headers}")
        logger.info(f"CAS Response Text: {response.text}")
        
        response.raise_for_status()
        
        # Parse XML response
        root = ET.fromstring(response.text)
        success = root.find('.//{http://www.yale.edu/tp/cas}authenticationSuccess')
        
        if success is not None:
            # Get netid from response
            user = success.find('{http://www.yale.edu/tp/cas}user')
            if user is not None:
                netid = user.text
                logger.info(f"Found netid: {netid}")
                return {'user': netid}
            else:
                logger.error("No user element found in authentication success")
        else:
            failure = root.find('.//{http://www.yale.edu/tp/cas}authenticationFailure')
            if failure is not None:
                logger.error(f"CAS authentication failure: {failure.text}")
            else:
                logger.error("No authentication success or failure element found in CAS response")
        
        return None
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error validating CAS ticket: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response status: {e.response.status_code}")
            logger.error(f"Response text: {e.response.text}")
        return None
    except Exception as e:
        logger.error(f"Error validating CAS ticket: {str(e)}")
        return None

def create_or_update_user(netid):
    """Create or update a user based on CAS netid."""
    try:
        current_app.logger.info(f"Creating/updating user with netid: {netid}")
        
        # Validate netid format (Princeton netids are typically 3-8 characters)
        if not re.match(r'^[a-zA-Z0-9]{3,8}$', netid):
            current_app.logger.error(f"Invalid netid format: {netid}")
            return None
            
        user = User.query.filter_by(netid=netid).first()
        if not user:
            current_app.logger.info(f"Creating new user for netid: {netid}")
            user = User(netid=netid)
            db.session.add(user)
            db.session.commit()
            current_app.logger.info(f"Created new user with id: {user.id}")
        else:
            current_app.logger.info(f"Found existing user with id: {user.id}")
        return user
    except Exception as e:
        current_app.logger.error(f"Error creating/updating user: {str(e)}")
        db.session.rollback()
        return None

def generate_jwt_token(user):
    """Generate a JWT token for the user."""
    # Use create_access_token from flask_jwt_extended
    return create_access_token(
        identity=user.id,
        additional_claims={
            'netid': user.netid
        },
        expires_delta=timedelta(days=1)  # Token expires in 1 day
    )

@cas_bp.route('/login')
def cas_login():
    """Handle CAS login."""
    current_app.logger.info("Starting CAS login process")
    ticket = get_cas_ticket()
    
    if not ticket:
        # If no ticket, redirect to CAS login
        login_url = f'{CAS_SERVER}/login'
        service_url = request.base_url
        current_app.logger.info(f"No ticket found, redirecting to CAS: {login_url}")
        return redirect(f'{login_url}?service={urllib.parse.quote(service_url)}')
    
    current_app.logger.info(f"Got ticket: {ticket}")
    
    # Validate the ticket
    netid = validate(ticket)
    if not netid:
        current_app.logger.error("Failed to validate CAS ticket")
        return redirect(f'{CAS_SERVICE}/login?error=invalid_ticket')
    
    current_app.logger.info(f"Validated ticket for netid: {netid}")
    
    try:
        # Create or update user
        user = create_or_update_user(netid)
        if not user:
            current_app.logger.error("Failed to create/update user")
            return redirect(f'{CAS_SERVICE}/login?error=user_creation_failed')
        
        current_app.logger.info(f"Created/updated user with netid: {netid}")
        
        # Store netid in session
        session['netid'] = netid
        current_app.logger.info(f"Stored netid {netid} in session")
        
        # Generate JWT token
        token = generate_jwt_token(user)
        current_app.logger.info(f"Generated token for user {netid}")
        
        # Redirect to the frontend with the token
        redirect_url = f'{CAS_SERVICE}/auth/callback?token={token}'
        current_app.logger.info(f"Redirecting to: {redirect_url}")
        return redirect(redirect_url)
        
    except Exception as e:
        current_app.logger.error(f"Error in CAS login: {str(e)}")
        db.session.rollback()
        return redirect(f'{CAS_SERVICE}/login?error=server_error')

@cas_bp.route('/logout')
def cas_logout():
    """Handle CAS logout."""
    # Clear session
    session.clear()
    
    # Redirect to CAS logout
    logout_url = f'{CAS_SERVER}/logout'
    service_url = request.args.get('redirect_uri', CAS_SERVICE)
    return redirect(f'{logout_url}?service={service_url}')

#-----------------------------------------------------------------------

def is_authenticated():
    """Check if the request has a valid JWT token."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return False
    
    token = auth_header.split(' ')[1]
    try:
        # Verify the token is valid
        payload = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        return True
    except Exception as e:
        current_app.logger.error(f"Token validation error: {str(e)}")
        return False

def login_required(f):
    """Decorator to require JWT authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def get_user_info():
    """Get user info from JWT token."""
    if not is_authenticated():
        return None
    token = request.cookies.get('token')
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def init_auth(app):
    """Initialize CAS authentication."""
    app.config.setdefault('CAS_SERVER', 'https://fed.princeton.edu/cas')
    app.config.setdefault('CAS_SERVICE', 'http://localhost:5001/api/auth/cas/callback')
    app.config.setdefault('CAS_AFTER_LOGIN', '/')
    app.config.setdefault('CAS_AFTER_LOGOUT', '/')
    app.config.setdefault('CAS_LOGIN_ROUTE', '/login')
    app.config.setdefault('CAS_LOGOUT_ROUTE', '/logout')
    app.config.setdefault('CAS_VALIDATE_ROUTE', '/serviceValidate')
    app.config.setdefault('CAS_TOKEN_SESSION_KEY', '_CAS_TOKEN')

    @app.route('/api/logoutcas', methods=['GET'])
    def logoutcas():
        logout_url = (_CAS_URL + 'logout?service=' +
                    urllib.parse.quote(re.sub('logoutcas', 'logoutapp', request.url)))
        abort(redirect(logout_url))

    @app.route('/api/logoutapp', methods=['GET'])
    def logoutapp():
        session.clear()
        return redirect('/') 