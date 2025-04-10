@bp.route('/listings', methods=['GET'])
def get_listings():
    listings = Listing.query.all()
    return jsonify([{
        'id': listing.id,
        'title': listing.title,
        'description': listing.description,
        'price': listing.price,
        'status': listing.status,
        'seller_id': listing.seller_id,
        'buyer_id': listing.buyer_id,
        'created_at': listing.created_at.isoformat(),
        'updated_at': listing.updated_at.isoformat(),
        'images': listing.images,
        'condition': listing.condition
    } for listing in listings])

@bp.route('/listings', methods=['POST'])
@jwt_required()
def create_listing():
    data = request.get_json()
    listing = Listing(
        title=data['title'],
        description=data['description'],
        price=data['price'],
        seller_id=get_jwt_identity(),
        images=data.get('images', []),
        condition=data.get('condition', 'good')
    )
    db.session.add(listing)
    db.session.commit()
    return jsonify({
        'id': listing.id,
        'title': listing.title,
        'description': listing.description,
        'price': listing.price,
        'status': listing.status,
        'seller_id': listing.seller_id,
        'buyer_id': listing.buyer_id,
        'created_at': listing.created_at.isoformat(),
        'updated_at': listing.updated_at.isoformat(),
        'images': listing.images,
        'condition': listing.condition
    }), 201 