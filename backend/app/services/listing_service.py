from app.models import Listing
from app.database import db
from app.utils.cloudinary_helper import upload_images
from app.utils.validators import validate_price
from flask import jsonify

def create_listing(data, user_id):
    # Validate price (must be a valid dollar amount)
    if not validate_price(data['price']):
        return jsonify({'message': 'Invalid price. Must be a valid dollar amount'}), 400

    # Upload images to Cloudinary
    image_urls = upload_images(data['images'])  # Upload all images to Cloudinary

    # Create the listing entry
    new_listing = Listing(
        title=data['title'],
        category=data['category'],
        price=float(data['price']),  # Ensure price is a float
        size=data['size'],
        images=','.join(image_urls),  # Store image URLs as comma-separated values
        user_id=user_id  # Assign the seller (user_id) who posted the item
    )

    db.session.add(new_listing)
    db.session.commit()

    return jsonify({'message': 'Listing created successfully', 'listing': new_listing.id}), 201

