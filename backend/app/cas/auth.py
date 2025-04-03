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
_CAS_URL = 'https://fed.princeton.edu/cas/'  # Princeton CAS server
_BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:8000')
_FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

logger = logging.getLogger(__name__)

cas_bp = Blueprint('cas', __name__)

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
    
    # Log the incoming request details
    current_app.logger.info(f"CAS service URL request - Base URL: {base_url}")
    current_app.logger.info(f"CAS service URL request - Redirect URI: {redirect_uri}")
    
    if redirect_uri:
        # Ensure the redirect_uri is properly encoded
        encoded_redirect = urllib.parse.quote(redirect_uri)
        service_url = f"{base_url}?redirect_uri={encoded_redirect}"
    else:
        service_url = base_url
    
    current_app.logger.info(f"Final CAS service URL: {service_url}")
    return service_url

#-----------------------------------------------------------------------

def get_cas_ticket():
    """Extract the CAS ticket from the request."""
    ticket = request.args.get('ticket')
    current_app.logger.info(f"Received CAS ticket: {ticket}")
    return ticket

def validate_cas_ticket(ticket):
    """Validate the CAS ticket with the CAS server."""
    validate_url = f'{_CAS_URL}serviceValidate'
    service_url = get_service_url()
    
    current_app.logger.info(f"Validating CAS ticket with URL: {validate_url}")
    current_app.logger.info(f"Service URL for validation: {service_url}")
    
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
                    username = username_match.group(1)
                    current_app.logger.info(f"Successfully validated CAS ticket for user: {username}")
                    return username
        current_app.logger.error("CAS validation failed")
        return None
    except Exception as e:
        current_app.logger.error(f"CAS validation error: {str(e)}")
        return None

def create_or_update_user(username):
    """Create or update a user based on CAS username."""
    current_app.logger.info(f"Creating/updating user for CAS username: {username}")
    user = User.query.filter_by(username=username).first()
    if not user:
        user = User(
            username=username,
            email=f"{username}@princeton.edu",  # Default email format
            created_at=datetime.utcnow()
        )
        db.session.add(user)
        current_app.logger.info(f"Created new user: {username}")
    else:
        user.updated_at = datetime.utcnow()
        current_app.logger.info(f"Updated existing user: {username}")
    
    db.session.commit()
    return user

def generate_jwt_token(user):
    """Generate a JWT token for the user."""
    current_app.logger.info(f"Generating JWT token for user: {user.username}")
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
    current_app.logger.info("Received CAS login request")
    ticket = get_cas_ticket()
    
    if not ticket:
        # If no ticket, redirect to CAS login
        current_app.logger.info("No ticket found, redirecting to CAS login")
        login_url = f'{_CAS_URL}login'
        service_url = get_service_url()
        redirect_url = f'{login_url}?service={urllib.parse.quote(service_url)}'
        current_app.logger.info(f"Redirecting to CAS login: {redirect_url}")
        return redirect(redirect_url)
    
    # Validate the ticket
    username = validate_cas_ticket(ticket)
    if not username:
        current_app.logger.error("Invalid CAS ticket")
        return redirect(f'{_FRONTEND_URL}/login?error=invalid_ticket')
    
    # Create or update user
    user = create_or_update_user(username)
    
    # Generate JWT token
    token = generate_jwt_token(user)
    
    # Get the redirect URI from the original request or use default
    redirect_uri = request.args.get('redirect_uri')
    if not redirect_uri:
        redirect_uri = f'{_FRONTEND_URL}/dashboard'
    
    # Add token to the redirect URL
    if '?' in redirect_uri:
        redirect_uri += f'&token={token}'
    else:
        redirect_uri += f'?token={token}'
    
    # Log the redirect URL for debugging
    current_app.logger.info(f"Redirecting to frontend: {redirect_uri}")
    
    return redirect(redirect_uri)

@cas_bp.route('/logout')
def cas_logout():
    """Handle CAS logout."""
    current_app.logger.info("Received CAS logout request")
    # Clear session
    session.clear()
    
    # Redirect to CAS logout
    logout_url = f'{_CAS_URL}logout'
    service_url = request.args.get('redirect_uri', _FRONTEND_URL)
    redirect_url = f'{logout_url}?service={service_url}'
    current_app.logger.info(f"Redirecting to CAS logout: {redirect_url}")
    return redirect(redirect_url)

#-----------------------------------------------------------------------

def is_authenticated():
    return 'user_info' in session 