import requests
import sys
import json

# The base URL of your backend
BASE_URL = "https://tigerpop-marketplace-backend-76fa6fb8c8a2.herokuapp.com"

def test_endpoint(description, method, url, data=None):
    """
    Test if an endpoint exists and is accessible
    """
    print(f"\n==== Testing {method} {url} ====")
    print(f"Description: {description}")
    
    try:
        if method.upper() == "GET":
            response = requests.get(url)
        elif method.upper() == "POST":
            headers = {'Content-Type': 'application/json'}
            response = requests.post(url, json=data, headers=headers)
        else:
            print(f"Unsupported method: {method}")
            return False
        
        print(f"Status: {response.status_code}")
        
        if response.status_code < 400:
            print("Success!")
            try:
                print(f"Response: {json.dumps(response.json(), indent=2)}")
            except:
                print(f"Response: {response.text[:100]}...")
            return True
        else:
            print(f"ERROR: {response.text}")
            return False
            
    except Exception as e:
        print(f"Exception occurred: {str(e)}")
        return False

def main():
    """
    Test all the relevant endpoints
    """
    # Test the email endpoint
    email_endpoint = f"{BASE_URL}/api/listing/email/send"
    email_data = {
        "to_email": "test@example.com",
        "listing_title": "Test Listing",
        "listing_price": "$99.99",
        "listing_category": "Other",
        "buyer_netid": "test123"
    }
    email_success = test_endpoint(
        "Email sending endpoint - should be at /api/listing/email/send", 
        "POST", 
        email_endpoint, 
        email_data
    )
    
    # Test an incorrect email endpoint
    incorrect_email_endpoint = f"{BASE_URL}/api/email/send"
    incorrect_email_success = test_endpoint(
        "Incorrect email endpoint - should return 404", 
        "POST", 
        incorrect_email_endpoint, 
        email_data
    )
    
    # Test the request-to-buy endpoint
    request_endpoint = f"{BASE_URL}/api/listing/123/request"
    request_data = {
        "buyerId": "test123"
    }
    request_success = test_endpoint(
        "Request-to-buy endpoint - should be at /api/listing/{id}/request", 
        "POST", 
        request_endpoint, 
        request_data
    )
    
    # Summary
    print("\n==== Summary ====")
    print(f"Email endpoint working: {email_success}")
    print(f"Incorrect email endpoint returns 404 as expected: {not incorrect_email_success}")
    print(f"Request-to-buy endpoint working: {request_success}")
    
    if email_success and not incorrect_email_success and request_success:
        print("\nAll endpoints are working correctly!")
        print("The issue is in the frontend, where it's using incorrect paths:")
        print("1. Email path: should be /api/listing/email/send (not /api/email/send)")
        print("2. Request path: no issues found if using /api/listing/{id}/request")
    else:
        print("\nThere are issues with the endpoints. Check the backend configuration.")

if __name__ == "__main__":
    main() 