from app import create_app
from app.extensions import db
from app.models import User
from flask_jwt_extended import create_access_token

app = create_app()

with app.app_context():
    try:
        # Create a test user with netid 'test_user'
        netid = 'test_user'
        user = User.query.filter_by(netid=netid).first()
        
        if not user:
            user = User(netid=netid)
            db.session.add(user)
            db.session.commit()
            print(f"Created new user: {user.to_dict()}")
        else:
            print(f"Found existing user: {user.to_dict()}")
        
        # Generate JWT token
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                'netid': user.netid
            }
        )
        
        print("\nUse this token for API requests:")
        print(f"Bearer {access_token}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        db.session.rollback() 