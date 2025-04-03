#!/usr/bin/env python

import urllib.request
import urllib.parse
import re
import json
import logging
from flask import current_app, request, redirect, url_for, session, jsonify
from flask_jwt_extended import create_access_token
from ..extensions import db
from ..models import User
import requests
from ..extensions import jwt
import xml.etree.ElementTree as ET
from flask import Blueprint
from datetime import datetime
import os

#-----------------------------------------------------------------------

# Get URLs from environment variables or use defaults
_CAS_URL = 'https://fed.princeton.edu/cas'  # Princeton CAS server
_BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:8000')
_FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

logger = logging.getLogger(__name__)

cas_bp = Blueprint('cas', __name__)

CAS_SERVER = _CAS_URL
CAS_SERVICE = _FRONTEND_URL  # Frontend URL

#-----------------------------------------------------------------------

def strip_ticket(url):
    """Strip the ticket parameter from a URL."""
    if url is None:
        return None
    url = re.sub(r'ticket=[^&]*&?', '', url)
    url = re.sub(r'\?&?$|&$', '', url)
    return url

#-----------------------------------------------------------------------

def get_service_url():
    """Get the service URL for CAS authentication."""
    # Get the base URL without any existing parameters
    base_url = f'{_BACKEND_URL}/api/auth/cas/login'
    redirect_uri = request.args.get('redirect_uri')
    if redirect_uri:
        base_url = f"{base_url}?redirect_uri={urllib.parse.quote(redirect_uri)}"
    return base_url

#-----------------------------------------------------------------------

def get_cas_ticket():
    """Extract the CAS ticket from the request."""
    return request.args.get('ticket')

def validate_cas_ticket(ticket):
    """Validate the CAS ticket with the CAS server."""
    validate_url = f'{CAS_SERVER}/serviceValidate'
    service_url = get_service_url()
    
    try:
        response = requests.get(validate_url, params={
            'ticket': ticket,
            'service': service_url
        })
        current_app.logger.info(f"CAS validation URL: {response.url}")
        current_app.logger.info(f"CAS validation response: {response.text}")
        
        if response.status_code == 200:
            # Check if the response contains a successful authentication
            if '<cas:authenticationSuccess>' in response.text:
                # Extract username from the response
                username_match = re.search(r'<cas:user>(.*?)</cas:user>', response.text)
                if username_match:
                    return username_match.group(1)
        return None
    except Exception as e:
        current_app.logger.error(f"CAS validation error: {str(e)}")
        return None

def create_or_update_user(username):
    """Create or update a user based on CAS username."""
    user = User.query.filter_by(username=username).first()
    if not user:
        user = User(
            username=username,
            email=f"{username}@princeton.edu",  # Default email format
            created_at=datetime.utcnow()
        )
        db.session.add(user)
    else:
        user.updated_at = datetime.utcnow()
    
    db.session.commit()
    return user

def generate_jwt_token(user):
    """Generate a JWT token for the user."""
    # Use create_access_token from flask_jwt_extended
    return create_access_token(
        identity=user.id,
        additional_claims={
            'username': user.username,
            'email': user.email,
            'netid': user.username  # Princeton netID is the username
        }
    )

@cas_bp.route('/login')
def cas_login():
    """Handle CAS login."""
    ticket = get_cas_ticket()
    
    if not ticket:
        # If no ticket, redirect to CAS login
        login_url = f'{CAS_SERVER}/login'
        service_url = get_service_url()
        return redirect(f'{login_url}?service={urllib.parse.quote(service_url)}')
    
    # Validate the ticket
    username = validate_cas_ticket(ticket)
    if not username:
        return redirect(f'{CAS_SERVICE}/login?error=invalid_ticket')
    
    # Create or update user
    user = create_or_update_user(username)
    
    # Generate JWT token
    token = generate_jwt_token(user)
    
    # Get the redirect URI from the original request or use default
    redirect_uri = request.args.get('redirect_uri')
    if not redirect_uri:
        redirect_uri = f'{CAS_SERVICE}/dashboard'
    
    # Add token to the redirect URL
    if '?' in redirect_uri:
        redirect_uri += f'&token={token}'
    else:
        redirect_uri += f'?token={token}'
    
    # Log the redirect URL for debugging
    current_app.logger.info(f"Redirecting to: {redirect_uri}")
    
    return redirect(redirect_uri)

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
    return 'user_info' in session 