import jwt
import datetime
from flask import current_app

# Function to create JWT
def create_jwt(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)  # JWT expires in 1 hour
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

# Function to verify JWT
def verify_jwt(token):
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None  # JWT is expired
    except jwt.InvalidTokenError:
        return None  # Invalid JWT
