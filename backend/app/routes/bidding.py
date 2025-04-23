from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from ..models.bid import Bid
from ..models.listing import Listing
from ..models.user import User
from ..extensions import db
from ..services.notification_service import send_notification
from datetime import datetime

bidding_bp = Blueprint('bidding', __name__)

@bidding_bp.route('/listings/<int:listing_id>/bids', methods=['GET'])
def get_bids(listing_id):
    listing = Listing.query.get_or_404(listing_id)
    bids = Bid.query.filter_by(listing_id=listing_id).order_by(Bid.amount.desc()).all()
    return jsonify([bid.to_dict() for bid in bids])

@bidding_bp.route('/listings/<int:listing_id>/bids', methods=['POST'])
@login_required
def place_bid(listing_id):
    listing = Listing.query.get_or_404(listing_id)
    
    if listing.pricing_mode != 'auction':
        return jsonify({'error': 'This listing is not open for bidding'}), 400
    
    if listing.status != 'available':
        return jsonify({'error': 'This listing is no longer available for bidding'}), 400
    
    data = request.get_json()
    amount = data.get('amount')
    
    if not amount or amount <= 0:
        return jsonify({'error': 'Invalid bid amount'}), 400
    
    # Check if bid is higher than current highest bid or starting price
    highest_bid = Bid.query.filter_by(listing_id=listing_id).order_by(Bid.amount.desc()).first()
    if highest_bid and amount <= highest_bid.amount:
        return jsonify({'error': 'Bid must be higher than current highest bid'}), 400
    if not highest_bid and amount <= listing.starting_price:
        return jsonify({'error': 'Bid must be higher than starting price'}), 400
    
    # Create new bid
    bid = Bid(
        listing_id=listing_id,
        bidder_id=current_user.id,
        amount=amount
    )
    
    db.session.add(bid)
    db.session.commit()
    
    # Notify seller
    seller = User.query.get(listing.user_id)
    send_notification(
        seller.id,
        'new_bid',
        f'New bid of ${amount} placed on your listing "{listing.title}"'
    )
    
    # Notify other bidders
    other_bidders = {b.bidder_id for b in Bid.query.filter_by(listing_id=listing_id).all() if b.bidder_id != current_user.id}
    for bidder_id in other_bidders:
        send_notification(
            bidder_id,
            'outbid',
            f'You have been outbid on "{listing.title}"'
        )
    
    return jsonify(bid.to_dict()), 201

@bidding_bp.route('/listings/<int:listing_id>/close-bidding', methods=['POST'])
@login_required
def close_bidding(listing_id):
    listing = Listing.query.get_or_404(listing_id)
    
    if listing.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    if listing.pricing_mode != 'auction':
        return jsonify({'error': 'This listing is not an auction'}), 400
    
    if listing.status != 'available':
        return jsonify({'error': 'This listing is already closed'}), 400
    
    # Get highest bid
    highest_bid = Bid.query.filter_by(listing_id=listing_id).order_by(Bid.amount.desc()).first()
    
    if highest_bid:
        # Update listing status and buyer
        listing.status = 'pending'
        listing.buyer_id = highest_bid.bidder_id
        db.session.commit()
        
        # Notify highest bidder
        send_notification(
            highest_bid.bidder_id,
            'auction_won',
            f'You won the auction for "{listing.title}"! Please check your email for next steps.'
        )
    else:
        # No bids, just close the auction
        listing.status = 'closed'
        db.session.commit()
    
    return jsonify(listing.to_dict()) 