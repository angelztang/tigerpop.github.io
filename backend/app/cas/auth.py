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

_CAS_URL = 'https://fed.princeton.edu/cas/'  # Princeton CAS server
_BACKEND_URL = 'https://tigerpop-marketplace-backend-76fa6fb8c8a2.herokuapp.com'  # Backend URL

logger = logging.getLogger(__name__)

cas_bp = Blueprint('cas', __name__)

CAS_SERVER = 'https://fed.princeton.edu/cas'
# Support both local and production frontend
CAS_SERVICE = 'http://localhost:3000'  # Default to local frontend for testing

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

def validate_cas_ticket(ticket):
    """Validate the CAS ticket with the CAS server."""
    validate_url = f'{CAS_SERVER}/serviceValidate'
    redirect_uri = request.args.get('redirect_uri', 'http://localhost:3000')
    service_url = f'{_BACKEND_URL}/api/auth/cas/login?redirect_uri={urllib.parse.quote(redirect_uri)}'
    
    try:
        response = requests.get(validate_url, params={
            'ticket': ticket,
            'service': service_url
        })
        current_app.logger.info(f"CAS validation URL: {response.url}")
        current_app.logger.info(f"CAS validation response: {response.text}")
        
        if response.status_code == 200:
            if '<cas:authenticationSuccess>' in response.text:
                netid_match = re.search(r'<cas:user>(.*?)</cas:user>', response.text)
                if netid_match:
                    return netid_match.group(1)
        return None
    except Exception as e:
        current_app.logger.error(f"CAS validation error: {str(e)}")
        return None

def create_or_update_user(netid):
    """Create or update a user based on CAS netid."""
    user = User.query.filter_by(netid=netid).first()
    if not user:
        user = User(netid=netid)
        db.session.add(user)
    
    db.session.commit()
    return user

def generate_jwt_token(user):
    """Generate a JWT token for the user."""
    # Use create_access_token from flask_jwt_extended
    return create_access_token(
        identity=user.id,
        additional_claims={
            'netid': user.netid
        }
    )

@cas_bp.route('/login')
def cas_login():
    """Handle CAS login."""
    ticket = get_cas_ticket()
    redirect_uri = request.args.get('redirect_uri', 'http://localhost:3000')
    
    if not ticket:
        # If no ticket, redirect to CAS login
        service_url = f'{_BACKEND_URL}/api/auth/cas/login?redirect_uri={urllib.parse.quote(redirect_uri)}'
        return redirect(f'{CAS_SERVER}/login?service={urllib.parse.quote(service_url)}')
    
    # Validate the ticket
    netid = validate_cas_ticket(ticket)
    if not netid:
        return redirect(f'{redirect_uri}/login?error=invalid_ticket')
    
    # Create or update user
    user = create_or_update_user(netid)
    
    # Generate JWT token
    token = generate_jwt_token(user)
    
    # Redirect back to frontend with token
    return redirect(f'{redirect_uri}?token={token}')

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