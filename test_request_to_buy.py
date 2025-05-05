import urllib.request
import urllib.parse
import json
import sys

# URL of the request-to-buy endpoint (replace listing_id with an actual available listing ID)
LISTING_ID = 234  # Replace with a valid listing ID from your database
API_URL = f"http://localhost:8000/api/listing/{LISTING_ID}/request"

# Test data for request to buy
test_data = {
    "buyerId": "hc8499"  # Replace with a valid netid in your database
}

def test_request_to_buy_endpoint():
    """Test the request-to-buy endpoint by sending a request"""
    print(f"Testing request-to-buy endpoint: {API_URL}")
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
            print("🎉 Request-to-buy endpoint test successful!")
            return True
        else:
            print("❌ Request-to-buy endpoint test failed.")
            return False
            
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_request_to_buy_endpoint()
    sys.exit(0 if success else 1) 