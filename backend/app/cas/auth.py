# -----------------------------------------------------------------------
# auth.py
# Authors: Alex Halderman, Scott Karlin, Brian Kernighan, Bob Dondero,
#          and Joshua Lau '26
# -----------------------------------------------------------------------

import urllib.request
import urllib.parse
import re
import json
import flask
import ssl
from functools import wraps
from flask import session, redirect, url_for, current_app
from ..models.user import User
from ..extensions import db

# -----------------------------------------------------------------------

# CAS Configuration
CAS_URL = "https://fed.princeton.edu/cas/"
CAS_VALIDATE_URL = f"{CAS_URL}serviceValidate"
CAS_LOGIN_URL = f"{CAS_URL}login"
CAS_LOGOUT_URL = f"{CAS_URL}logout"

# -----------------------------------------------------------------------

# Return url after stripping out the "ticket" parameter that was
# added by the CAS server.
def strip_ticket(url):
    """Remove the ticket parameter from a URL."""
    if not url:
        return None
    url = re.sub(r"ticket=[^&]*&?", "", url)
    url = re.sub(r"\?&?$|&$", "", url)
    return url

# -----------------------------------------------------------------------

# Validate a login ticket by contacting the CAS server. If
# valid, return the user's user_info; otherwise, return None.
def validate_ticket(ticket, service_url):
    """Validate a CAS ticket with the CAS server."""
    validate_url = (
        f"{CAS_VALIDATE_URL}?service={urllib.parse.quote(service_url)}"
        f"&ticket={urllib.parse.quote(ticket)}"
    )

    try:
        # During development, don't verify SSL certificate
        if current_app.debug:
            context = ssl._create_unverified_context()
            with urllib.request.urlopen(validate_url, context=context) as response:
                raw_response = response.read().decode('utf-8')
                current_app.logger.info(f"Raw CAS response: {raw_response}")
                
                # Parse XML response
                import xml.etree.ElementTree as ET
                root = ET.fromstring(raw_response)
                
                # Check for authentication success
                success = root.find('.//{http://www.yale.edu/tp/cas}authenticationSuccess')
                if success is not None:
                    user = success.find('{http://www.yale.edu/tp/cas}user')
                    if user is not None:
                        return {'user': user.text}
                
                # Check for authentication failure
                failure = root.find('.//{http://www.yale.edu/tp/cas}authenticationFailure')
                if failure is not None:
                    current_app.logger.error(f"CAS authentication failure: {failure.text}")
                    return None
                
                return None
        else:
            with urllib.request.urlopen(validate_url) as response:
                raw_response = response.read().decode('utf-8')
                current_app.logger.info(f"Raw CAS response: {raw_response}")
                
                # Parse XML response
                import xml.etree.ElementTree as ET
                root = ET.fromstring(raw_response)
                
                # Check for authentication success
                success = root.find('.//{http://www.yale.edu/tp/cas}authenticationSuccess')
                if success is not None:
                    user = success.find('{http://www.yale.edu/tp/cas}user')
                    if user is not None:
                        return {'user': user.text}
                
                # Check for authentication failure
                failure = root.find('.//{http://www.yale.edu/tp/cas}authenticationFailure')
                if failure is not None:
                    current_app.logger.error(f"CAS authentication failure: {failure.text}")
                    return None
                
                return None

    except Exception as e:
        current_app.logger.error(f"Error validating CAS ticket: {str(e)}")
        return None

# -----------------------------------------------------------------------

def login_required(f):
    """Decorator to ensure user is authenticated before accessing route."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            return redirect(url_for('cas_login'))
        return f(*args, **kwargs)
    return decorated_function

# -----------------------------------------------------------------------

def is_authenticated():
    """Check if the user is authenticated."""
    return 'user_info' in session

# -----------------------------------------------------------------------

def get_user_info():
    """Get the current user's information."""
    return session.get('user_info')

# -----------------------------------------------------------------------

def get_or_create_user(netid):
    """Get user from database or create if doesn't exist."""
    current_app.logger.info(f"Attempting to get or create user with netid: {netid}")
    try:
        user = User.query.filter_by(netid=netid).first()
        if not user:
            current_app.logger.info(f"User {netid} not found, creating new user")
            user = User(netid=netid)
            db.session.add(user)
            db.session.commit()
            current_app.logger.info(f"Successfully created user {netid}")
        else:
            current_app.logger.info(f"Found existing user {netid}")
        return user
    except Exception as e:
        current_app.logger.error(f"Database error for user {netid}: {str(e)}")
        db.session.rollback()
        raise

# -----------------------------------------------------------------------

def init_auth(app):
    """Initialize authentication routes."""
    
    @app.route('/login')
    def login():
        """Redirect to CAS login page."""
        service_url = url_for('auth.callback', _external=True)
        login_url = f"{CAS_LOGIN_URL}?service={urllib.parse.quote(service_url)}"
        return redirect(login_url)

    @app.route('/auth/callback')
    def callback():
        """Handle CAS callback after successful authentication."""
        ticket = flask.request.args.get('ticket')
        if not ticket:
            current_app.logger.error("No ticket provided in callback")
            return redirect(url_for('auth.login'))

        service_url = strip_ticket(flask.request.url)
        user_info = validate_ticket(ticket, service_url)

        if not user_info:
            current_app.logger.error("Failed to validate CAS ticket")
            return redirect(url_for('auth.login'))

        # Get or create user in database
        netid = user_info.get('user')
        if netid:
            current_app.logger.info(f"Processing CAS callback for netid: {netid}")
            try:
                user = get_or_create_user(netid)
                current_app.logger.info(f"User {netid} processed successfully")
                # Store both CAS user info and database user info in session
                session['user_info'] = {
                    **user_info,
                    'db_user': user.to_dict()
                }
                current_app.logger.info(f"Session updated with user info for {netid}")
            except Exception as e:
                current_app.logger.error(f"Error processing user {netid}: {str(e)}")
                return redirect(url_for('auth.login'))
        else:
            current_app.logger.error("No netid in CAS response")
            session['user_info'] = user_info

        return redirect(url_for('index'))

    @app.route('/logout')
    def logout():
        """Handle user logout."""
        session.clear()
        service_url = url_for('index', _external=True)
        logout_url = f"{CAS_LOGOUT_URL}?service={urllib.parse.quote(service_url)}"
        return redirect(logout_url)