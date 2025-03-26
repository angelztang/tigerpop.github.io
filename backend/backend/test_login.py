import bcrypt
from app import db
from app.models import User

def test_password():
    # The stored hash in the database
    stored_hash = '$2b$12$9GpBX9hGwE2TmQhXh1rKxuoVoQxTt0KKEf8rGU7OWZvzKQWL0GbGi'
    
    # The password we're testing
    test_password = 'test123'
    
    # Print the stored hash
    print(f"Stored hash: {stored_hash}")
    
    # Generate a new hash with the test password
    new_hash = bcrypt.hashpw(test_password.encode('utf-8'), bcrypt.gensalt())
    print(f"New hash: {new_hash.decode('utf-8')}")
    
    # Test if the password matches the stored hash
    result = bcrypt.checkpw(test_password.encode('utf-8'), stored_hash.encode('utf-8'))
    print(f"Password match: {result}")

if __name__ == '__main__':
    test_password() 