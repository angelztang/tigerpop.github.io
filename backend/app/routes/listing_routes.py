from flask import Blueprint, request, jsonify
from app import db
from app.models import Listing

bp = Blueprint('listings', __name__)

@bp.route('/create', methods=['POST'])
def create_listing():
    data = request.get_json()
    title = data['title']
    description = data['description']
    price = data['price']
    image_url = data.get('image_url')

    new_listing = Listing(
        title=title,
        description=description,
        price=price,
        image_url=image_url,
        user_id=1  # Example: You should get user_id from authenticated user
    )

    db.session.add(new_listing)
    db.session.commit()

    return jsonify({'message': 'Listing created successfully!'}), 201

@bp.route('/<int:listing_id>', methods=['GET'])
def get_listing(listing_id):
    listing = Listing.query.get(listing_id)
    if listing:
        return jsonify({'title': listing.title, 'description': listing.description, 'price': listing.price, 'image_url': listing.image_url})
    return jsonify({'message': 'Listing not found'}), 404
