from app.models import Listing, User
from app.database import db
from flask import jsonify

def buy_item(listing_id, buyer_id):
    # Find the listing by ID
    listing = Listing.query.get(listing_id)
    if not listing:
        return jsonify({'message': 'Item not found'}), 404

    # Check if the item is already bought
    if listing.buyer_id is not None:
        return jsonify({'message': 'Item already bought'}), 400

    # Find the buyer by ID
    buyer = User.query.get(buyer_id)
    if not buyer:
        return jsonify({'message': 'Buyer not found'}), 404

    # Mark the listing as sold by adding the buyer_id
    listing.buyer_id = buyer.id

    # Add the listing to the buyer's bought_items list
    buyer.bought_items.append(listing)

    # Optionally, you can also remove it from available items if you have a "sold" flag
    # listing.is_sold = True

    # Commit the transaction
    db.session.commit()

    return jsonify({'message': 'Item purchased successfully', 'listing_id': listing.id}), 200
