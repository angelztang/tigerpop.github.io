from flask import Blueprint, request, jsonify, session
from app.models import User, Listing
from app.database import db
from app.utils.cloudinary_helper import upload_image

bp = Blueprint('user', __name__)

# User Profile Route
@bp.route('/profile', methods=['GET'])
def profile():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'message': 'Not authenticated'}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    # Return user profile data
    return jsonify({
        'netid': user.netid,
        'profile_picture': user.profile_picture,
        'selling_list': [listing.id for listing in user.selling_list],
        'sold_list': [listing.id for listing in user.sold_list],
        'bought_list': [listing.id for listing in user.bought_list],
        'liked_list': user.liked_list.split(',') if user.liked_list else []
    })

# Update Profile Picture
@bp.route('/profile/picture', methods=['POST'])
def update_profile_picture():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'message': 'Not authenticated'}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    # Upload the new image to Cloudinary
    new_picture_url = upload_image(request.files['file'])
    user.profile_picture = new_picture_url
    db.session.commit()

    return jsonify({'message': 'Profile picture updated successfully', 'new_picture_url': new_picture_url})
