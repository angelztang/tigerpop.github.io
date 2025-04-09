from app import create_app
from app.extensions import db
from app.models import User

app = create_app()

with app.app_context():
    # Check if user already exists
    user = User.query.filter_by(netid='abc123').first()
    if user:
        print("User abc123 already exists")
    else:
        # Create new user with id 123456 and netid abc123
        user = User(netid='abc123')
        user.id = 123456  # Set specific ID to match JWT token
        db.session.add(user)
        try:
            db.session.commit()
            print("Successfully added user abc123 with id 123456")
        except Exception as e:
            db.session.rollback()
            print(f"Error adding user: {str(e)}") 