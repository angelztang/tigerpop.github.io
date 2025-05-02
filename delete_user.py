from app import create_app
from app.extensions import db
from app.models import User

app = create_app()

with app.app_context():
    try:
        # Find the user with ID 65
        user = User.query.get(65)
        if user:
            print(f"Found user: {user.netid}")
            # Delete the user
            db.session.delete(user)
            db.session.commit()
            print("User deleted successfully")
        else:
            print("User not found")
    except Exception as e:
        print(f"Error: {str(e)}")
        db.session.rollback() 