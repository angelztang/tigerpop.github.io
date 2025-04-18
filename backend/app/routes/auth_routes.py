from flask import Blueprint, render_template, redirect, url_for, request, session, current_app, jsonify
from ..cas.auth import login_required, validate_ticket, strip_ticket, get_or_create_user
import urllib.parse

# Create the auth blueprint
bp = Blueprint('auth', __name__)

# Route handler for the main landing page
@bp.route("/")
def landing():
    asset_path = get_asset_path("landing")
    return render_template(
        "index.html", app_name="landing", debug=current_app.debug, asset_path=asset_path
    )

# CAS Authentication routes
@bp.route("/api/auth/cas/login")
def cas_login():
    """Handle CAS login redirect and callback."""
    current_app.logger.info("Starting CAS login process")
    ticket = request.args.get('ticket')
    if not ticket:
        # Initial login - redirect to CAS
        current_app.logger.info("No ticket found, redirecting to CAS")
        service_url = url_for('auth.cas_login', _external=True)
        cas_login_url = f"https://fed.princeton.edu/cas/login?service={urllib.parse.quote(service_url)}"
        return redirect(cas_login_url)
    
    # Handle callback with ticket
    current_app.logger.info(f"Received CAS ticket: {ticket}")
    service_url = strip_ticket(request.url)
    user_info = validate_ticket(ticket, service_url)
    
    if not user_info:
        current_app.logger.error("Failed to validate CAS ticket")
        return redirect(url_for('auth.cas_login'))
    
    # Get or create user
    netid = user_info.get('user')
    if netid:
        current_app.logger.info(f"Processing CAS callback for netid: {netid}")
        try:
            user = get_or_create_user(netid)
            current_app.logger.info(f"User {netid} processed successfully")
            session['user_info'] = {
                **user_info,
                'db_user': user.to_dict()
            }
            current_app.logger.info(f"Session updated with user info for {netid}")
        except Exception as e:
            current_app.logger.error(f"Error processing user {netid}: {str(e)}")
            return redirect(url_for('auth.cas_login'))
    else:
        current_app.logger.error("No netid in CAS response")
        session['user_info'] = user_info
    
    # Redirect to frontend with user info
    frontend_url = current_app.config['FRONTEND_URL']
    current_app.logger.info(f"Redirecting to frontend: {frontend_url}")
    return redirect(f"{frontend_url}/auth/callback")

@bp.route("/api/auth/validate")
def validate():
    """Validate CAS ticket from frontend."""
    current_app.logger.info("Validating CAS ticket from frontend")
    ticket = request.args.get('ticket')
    service = request.args.get('service')
    
    if not ticket or not service:
        current_app.logger.error("Missing ticket or service")
        return jsonify({'error': 'Missing ticket or service'}), 400
    
    user_info = validate_ticket(ticket, service)
    if not user_info:
        current_app.logger.error("Invalid ticket")
        return jsonify({'error': 'Invalid ticket'}), 401
    
    netid = user_info.get('user')
    if not netid:
        current_app.logger.error("No netid in CAS response")
        return jsonify({'error': 'No netid in CAS response'}), 401
    
    # Get or create user
    current_app.logger.info(f"Processing user {netid}")
    try:
        user = get_or_create_user(netid)
        session['user_info'] = {
            **user_info,
            'db_user': user.to_dict()
        }
        current_app.logger.info(f"User {netid} processed successfully")
        return jsonify({'netid': netid})
    except Exception as e:
        current_app.logger.error(f"Error processing user {netid}: {str(e)}")
        return jsonify({'error': 'Failed to process user'}), 500

# Route handler for the protected page
@bp.route("/protected")
@login_required
def protected():
    asset_path = get_asset_path("protected")
    return render_template(
        "index.html", app_name="protected", debug=current_app.debug, asset_path=asset_path
    )

# Catch all for static assets
@bp.route("/<path:path>")
def static_proxy(path):
    """
    Serve static files from the build directory
    """
    return send_from_directory("build", path)