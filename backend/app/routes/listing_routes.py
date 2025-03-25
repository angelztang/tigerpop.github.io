from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models import Listing

bp = Blueprint('listings', __name__, url_prefix='/api/listings')

@bp.route('', methods=['GET'])
def get_listings():
    listings = Listing.query.all()
    return jsonify([{
        'id': listing.id,
        'title': listing.title,
        'description': listing.description,
        'price': listing.price,
        'image_url': listing.image_url,
        'status': listing.status,
        'user_id': listing.user_id
    } for listing in listings])

@bp.route('', methods=['POST'])
@jwt_required()
def create_listing():
    data = request.get_json()
    user_id = get_jwt_identity()
    
    new_listing = Listing(
        title=data['title'],
        description=data['description'],
        price=data['price'],
        image_url=data.get('image_url'),
        user_id=user_id
    )
    
    db.session.add(new_listing)
    db.session.commit()
    
    return jsonify({
        'message': 'Listing created successfully',
        'id': new_listing.id
    }), 201

@bp.route('/user', methods=['GET'])
@jwt_required()
def get_user_listings():
    user_id = get_jwt_identity()
    listings = Listing.query.filter_by(user_id=user_id).all()
    
    return jsonify([{
        'id': listing.id,
        'title': listing.title,
        'description': listing.description,
        'price': listing.price,
        'image_url': listing.image_url,
        'status': listing.status,
        'user_id': listing.user_id
    } for listing in listings])

@bp.route('/<int:id>/status', methods=['PATCH'])
@jwt_required()
def update_listing_status(id):
    user_id = get_jwt_identity()
    listing = Listing.query.get_or_404(id)
    
    if listing.user_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    listing.status = data['status']
    db.session.commit()
    
    return jsonify({'message': 'Status updated successfully'})

@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_listing(id):
    user_id = get_jwt_identity()
    listing = Listing.query.get_or_404(id)
    
    if listing.user_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    db.session.delete(listing)
    db.session.commit()
    
    return jsonify({'message': 'Listing deleted successfully'})
