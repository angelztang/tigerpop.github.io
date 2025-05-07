from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.bid import Bid
from ..extensions import db, mail
from ..models import Listing, User
from flask_mail import Message
from datetime import datetime, timedelta

bp = Blueprint('bids', __name__)

@bp.route('/listings/<int:listing_id>/bids', methods=['POST'])
def place_bid(listing_id):
    try:
        data = request.get_json()
        bidder_id = data.get('bidder_id')
        amount = data.get('amount')

        if not all([bidder_id, amount]):
            return jsonify({'error': 'Missing required fields'}), 400

        listing = Listing.query.get_or_404(listing_id)

        # Check if listing is available for bidding
        if listing.pricing_mode != 'auction':
            return jsonify({'error': 'This listing is not available for bidding'}), 400

        if listing.status != 'available':
            return jsonify({'error': 'This listing is no longer available'}), 400

        if listing.bidding_end_date and datetime.utcnow() > listing.bidding_end_date:
            return jsonify({'error': 'Bidding has ended for this listing'}), 400

        # Check if bid amount is valid
        current_bid = listing.get_current_bid()
        if current_bid and amount <= current_bid:
            return jsonify({'error': 'Bid amount must be higher than current bid'}), 400

        if listing.starting_price and amount < listing.starting_price:
            return jsonify({'error': 'Bid amount must be at least the starting price'}), 400

        # Create new bid
        new_bid = Bid(
            listing_id=listing_id,
            bidder_id=bidder_id,
            amount=amount
        )

        db.session.add(new_bid)
        db.session.commit()

        # Send notifications
        send_bid_notifications(listing, new_bid)

        return jsonify(new_bid.to_dict()), 201

    except Exception as e:
        current_app.logger.error(f"Error placing bid: {str(e)}")
        return jsonify({'error': 'Failed to place bid'}), 500

@bp.route('/listings/<int:listing_id>/bids', methods=['GET'])
def get_bids(listing_id):
    try:
        listing = Listing.query.get_or_404(listing_id)
        bids = Bid.query.filter_by(listing_id=listing_id).order_by(Bid.amount.desc()).all()
        return jsonify([bid.to_dict() for bid in bids])
    except Exception as e:
        current_app.logger.error(f"Error fetching bids: {str(e)}")
        return jsonify({'error': 'Failed to fetch bids'}), 500

@bp.route('/listings/<int:listing_id>/close-bidding', methods=['POST'])
def close_bidding(listing_id):
    try:
        listing = Listing.query.get_or_404(listing_id)
        
        if listing.pricing_mode != 'auction':
            return jsonify({'error': 'This listing is not an auction'}), 400

        if listing.status != 'available':
            return jsonify({'error': 'This listing is no longer available'}), 400

        # Update listing status
        listing.status = 'pending'
        db.session.commit()

        # Get highest bid
        highest_bid = Bid.query.filter_by(listing_id=listing_id).order_by(Bid.amount.desc()).first()
        
        if highest_bid:
            # Send notification to highest bidder
            send_winning_bid_notification(listing, highest_bid)

        return jsonify({'message': 'Bidding closed successfully'}), 200

    except Exception as e:
        current_app.logger.error(f"Error closing bidding: {str(e)}")
        return jsonify({'error': 'Failed to close bidding'}), 500

def send_bid_notifications(listing, bid):
    try:
        # Notify seller
        seller = User.query.get(listing.user_id)
        if seller:
            seller_email = seller.email
            current_app.logger.info(f"Sending bid notification to seller at {seller_email}")
            msg = Message(
                'New Bid on Your Listing',
                recipients=[seller_email],
                body=f'A new bid of ${bid.amount} has been placed on your listing: {listing.title}'
            )
            mail.send(msg)

        # Notify previous highest bidder
        previous_bid = Bid.query.filter(
            Bid.listing_id == listing.id,
            Bid.id != bid.id
        ).order_by(Bid.amount.desc()).first()

        if previous_bid:
            previous_bidder = User.query.get(previous_bid.bidder_id)
            if previous_bidder:
                bidder_email = previous_bidder.email
                current_app.logger.info(f"Sending outbid notification to previous bidder at {bidder_email}")
                msg = Message(
                    'You Have Been Outbid',
                    recipients=[bidder_email],
                    body=f'Your bid on {listing.title} has been outbid. The new highest bid is ${bid.amount}'
                )
                mail.send(msg)

    except Exception as e:
        current_app.logger.error(f"Error sending bid notifications: {str(e)}")

def send_winning_bid_notification(listing, bid):
    try:
        bidder = User.query.get(bid.bidder_id)
        if bidder:
            bidder_email = bidder.email
            current_app.logger.info(f"Sending winning bid notification to bidder at {bidder_email}")
            msg = Message(
                'You Won the Auction!',
                recipients=[bidder_email],
                body=f'Congratulations! You won the auction for {listing.title} with your bid of ${bid.amount}. Please contact the seller to complete the transaction.'
            )
            mail.send(msg)
    except Exception as e:
        current_app.logger.error(f"Error sending winning bid notification: {str(e)}")
