import requests
import json

# Replace these with your actual values
BASE_URL = 'http://localhost:5000'  # or your Heroku URL
JWT_TOKEN = 'your-jwt-token'  # Replace with actual token
LISTING_ID = 1  # Replace with actual listing ID you want to update

headers = {
    'Authorization': f'Bearer {JWT_TOKEN}',
    'Content-Type': 'application/json'
}

# Test data
data = {
    'pricing_mode': 'auction'
}

try:
    # Make the PUT request
    response = requests.put(
        f'{BASE_URL}/listings/{LISTING_ID}',
        headers=headers,
        json=data
    )

    # Print the response
    print(f'Status Code: {response.status_code}')
    print('Response:')
    print(json.dumps(response.json(), indent=2))

except requests.exceptions.RequestException as e:
    print(f'Error making request: {e}') 