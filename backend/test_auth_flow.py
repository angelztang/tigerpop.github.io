import requests
import json
import logging
from app import create_app
from app.models import User
from app.extensions import db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Server configuration
BASE_URL = 'https://tigerpop-marketplace-backend-76fa6fb8c8a2.herokuapp.com'

def test_auth_flow():
    """Test the complete authentication flow."""
    app = create_app()
    with app.app_context():
        try:
            # Test 1: Test database connection
            logger.info("Testing database connection...")
            response = requests.get(f'{BASE_URL}/api/auth/test-db')
            assert response.status_code == 200, f"Database connection test failed with status {response.status_code}: {response.text}"
            logger.info("Database connection test passed")

            # Test 2: Test user initialization for new user
            logger.info("Testing user initialization for new user...")
            test_netid = "testuser123"
            
            # First, ensure the user doesn't exist
            existing_user = User.query.filter_by(netid=test_netid).first()
            if existing_user:
                db.session.delete(existing_user)
                db.session.commit()
            
            # Try to initialize the user
            response = requests.post(f'{BASE_URL}/api/auth/users/initialize',
                                  json={'netid': test_netid})
            assert response.status_code == 200, f"User initialization failed with status {response.status_code}: {response.text}"
            data = response.json()
            assert data['netid'] == test_netid, "Returned netid doesn't match"
            logger.info("User initialization test passed")

            # Test 3: Test user initialization for existing user
            logger.info("Testing user initialization for existing user...")
            response = requests.post(f'{BASE_URL}/api/auth/users/initialize',
                                  json={'netid': test_netid})
            assert response.status_code == 200, f"User initialization failed for existing user with status {response.status_code}: {response.text}"
            data = response.json()
            assert data['netid'] == test_netid, "Returned netid doesn't match for existing user"
            logger.info("Existing user initialization test passed")

            # Test 4: Test CAS validation and user creation
            logger.info("Testing CAS validation and user creation...")
            new_netid = "newuser456"
            # Simulate CAS validation with a test ticket
            test_ticket = "ST-test-ticket"
            test_service = "https://tigerpop.io/auth/callback"
            response = requests.get(f'{BASE_URL}/api/auth/validate',
                                 params={'ticket': test_ticket, 'service': test_service})
            assert response.status_code == 200, f"CAS validation failed with status {response.status_code}: {response.text}"
            data = response.json()
            assert 'netid' in data, "No netid returned"
            netid = data['netid']
            logger.info("CAS validation test passed")

            # Test 5: Initialize user from CAS validation
            logger.info("Testing user initialization from CAS validation...")
            response = requests.post(f'{BASE_URL}/api/auth/users/initialize',
                                  json={'netid': netid})
            assert response.status_code == 200, f"User initialization failed with status {response.status_code}: {response.text}"
            data = response.json()
            assert data['netid'] == netid, "User netid doesn't match"
            logger.info("User initialization from CAS validation test passed")

            logger.info("All authentication tests passed successfully!")
            return True

        except Exception as e:
            logger.error(f"Test failed: {str(e)}")
            return False
        finally:
            # Clean up test users
            for netid in [test_netid, new_netid]:
                test_user = User.query.filter_by(netid=netid).first()
                if test_user:
                    db.session.delete(test_user)
                    db.session.commit()

if __name__ == '__main__':
    test_auth_flow() 