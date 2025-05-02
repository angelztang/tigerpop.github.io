from app import create_app
import os

def test_listings_endpoint():
    # Create test app
    app = create_app()
    
    # Print database URL
    print("\nDatabase URL:", app.config['SQLALCHEMY_DATABASE_URI'])
    
    # Test the endpoint using the test client
    client = app.test_client()
    response = client.get('/api/listing/?status=available')
    
    print("\nResponse Status:", response.status_code)
    print("\nResponse Headers:", dict(response.headers))
    print("\nResponse Data:", response.get_json())

if __name__ == '__main__':
    test_listings_endpoint() 