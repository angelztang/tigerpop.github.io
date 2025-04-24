import requests
import json

# Replace with your actual backend URL
BASE_URL = 'https://tigerpop-marketplace-backend-76fa6fb8c8a2.herokuapp.com'

def test_fetch_listings():
    try:
        # Make the GET request to fetch listings
        response = requests.get(
            f'{BASE_URL}/api/listing',
            headers={
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        )
        
        # Print the response details
        print(f'Status Code: {response.status_code}')
        print('Response Headers:')
        print(json.dumps(dict(response.headers), indent=2))
        
        try:
            data = response.json()
            print('\nResponse Data:')
            print(json.dumps(data, indent=2))
        except json.JSONDecodeError:
            print('\nResponse Text:')
            print(response.text)
            
    except requests.exceptions.RequestException as e:
        print(f'Error making request: {e}')

if __name__ == '__main__':
    test_fetch_listings() 