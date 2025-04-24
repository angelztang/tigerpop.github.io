@bp.route('/listings', methods=['GET'])
def get_listings():
    search_query = request.args.get('search', '')
    max_price = request.args.get('max_price', type=float)
    category = request.args.get('category')
    status = request.args.get('status', 'available')

    query = Listing.query

    # Apply search filter if search query is provided
    if search_query:
        query = query.filter(
            db.or_(
                Listing.title.ilike(f'%{search_query}%'),
                Listing.description.ilike(f'%{search_query}%')
            )
        )

    # Apply other filters
    if max_price is not None:
        query = query.filter(Listing.price <= max_price)
    if category:
        query = query.filter(Listing.category == category)
    if status:
        query = query.filter(Listing.status == status)

    listings = query.all()
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
        'condition': listing.condition,
        'pricing_mode': listing.pricing_mode
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
        condition=data.get('condition', 'good'),
        pricing_mode=data.get('pricing_mode', 'fixed')
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
        'condition': listing.condition,
        'pricing_mode': listing.pricing_mode
    }), 201

@bp.route('/listings/<int:listing_id>', methods=['PUT'])
@jwt_required()
def update_listing(listing_id):
    listing = Listing.query.get_or_404(listing_id)
    
    # Check if the current user is the seller
    if listing.seller_id != get_jwt_identity():
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    # Update allowed fields
    allowed_fields = ['title', 'description', 'price', 'category', 'condition', 'status', 'pricing_mode']
    for field in allowed_fields:
        if field in data:
            setattr(listing, field, data[field])
    
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
        'condition': listing.condition,
        'pricing_mode': listing.pricing_mode
    })

@bp.route('/listings/<int:listing_id>', methods=['GET'])
def get_listing(listing_id):
    listing = Listing.query.get_or_404(listing_id)
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
        'condition': listing.condition,
        'pricing_mode': listing.pricing_mode
    }) 