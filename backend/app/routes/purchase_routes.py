from flask import Blueprint, request, jsonify
from app.services.purchase_service import buy_item

bp = Blueprint('purchases', __name__)

@bp.route('/buy', methods=['POST'])
def buy():
    data = request.get_json()
    
    listing_id = data.get('listing_id')
    buyer_id = data.get('buyer_id')

    if not listing_id or not buyer_id:
        return jsonify({'message': 'Missing listing_id or buyer_id'}), 400

    return buy_item(listing_id, buyer_id)
