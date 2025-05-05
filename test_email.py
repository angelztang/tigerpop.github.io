import urllib.request
import urllib.parse
import json
import sys

# URL of the email endpoint
API_URL = "http://localhost:8000/api/listing/email/send"

# Test data for email
test_data = {
    "to_email": "hc8499@princeton.edu",  # Replace with your email for testing
    "listing_title": "Test Listing",
    "listing_price": "$99.99",
    "listing_category": "Test Category",
    "buyer_netid": "hc8499"
}

def test_email_endpoint():
    """Test the email endpoint by sending a request"""
    print(f"Testing email endpoint: {API_URL}")
    print(f"Sending data: {json.dumps(test_data, indent=2)}")
    
    try:
        # Convert data to JSON format
        data = json.dumps(test_data).encode('utf-8')
        
        # Create request
        req = urllib.request.Request(
            API_URL,
            data=data,
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            method='POST'
        )
        
        # Send request and get response
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            response_data = response.read().decode('utf-8')
        
        # Print response
        print(f"Status code: {status_code}")
        print(f"Response: {response_data}")
        
        if status_code == 200:
            print("🎉 Email endpoint test successful!")
            return True
        else:
            print("❌ Email endpoint test failed.")
            return False
            
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_email_endpoint()
    sys.exit(0 if success else 1) 