from flask import Blueprint, request, jsonify
from app.services.listing_service import create_listing

bp = Blueprint('listings', __name__)

@bp.route('/', methods=['POST'])
def add_listing():
    data = request.get_json()

    # Ensure the required fields are present
    required_fields = ['title', 'category', 'price', 'size', 'images']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing {field}'}), 400

    return create_listing(data)
