from flask import Blueprint, redirect, url_for, session, jsonify
from flask_cas import login_required, CAS
from app.models import User
from app.database import db

bp = Blueprint('auth', __name__)
cas = CAS()

# CAS Login Route
@bp.route('/login')
def login():
    return cas.login()

# CAS Callback Route (after CAS authentication)
@bp.route('/cas/callback')
def cas_callback():
    # Get user info from CAS
    netid = cas.username  # CAS will provide the NetID after successful login

    # Check if the user already exists in the database
    user = User.query.filter_by(netid=netid).first()

    if not user:
        # If the user doesn't exist, create a new account
        user = User(netid=netid)
        db.session.add(user)
        db.session.commit()

    # Store user in session to track the logged-in user
    session['user_id'] = user.id

    # Redirect to user profile or home page
    return redirect(url_for('user.profile'))

# Logout Route
@bp.route('/logout')
def logout():
    cas.logout()
    session.pop('user_id', None)
    return redirect(url_for('auth.login'))
