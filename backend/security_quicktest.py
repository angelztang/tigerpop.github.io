import requests

API_URL = 'https://tigerpop-marketplace-backend-76fa6fb8c8a2.herokuapp.com'
FAKE_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkZha2UgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
HEADERS = {
    'Authorization': FAKE_TOKEN,
    'Content-Type': 'application/json'
}

# Test data
listing_id = 2245

print('Testing Non-NetID Access with FAKE token:')

# 1. POST /listing
resp1 = requests.post(f'{API_URL}/api/listing', headers=HEADERS, json={
    'title': 'Test',
    'description': 'Test',
    'price': 10,
    'category': 'other',
    'condition': 'good',
    'pricing_mode': 'fixed',
    'user_id': 1
})
print(f'POST /listing with fake token: {resp1.status_code} {resp1.reason}')
print(resp1.text)

# 2. POST /listing/<id>/bids
resp2 = requests.post(f'{API_URL}/api/listings/{listing_id}/bids', headers=HEADERS, json={
    'amount': 100
})
print(f'POST /listing/{listing_id}/bids with fake token: {resp2.status_code} {resp2.reason}')
print(resp2.text)

# 3. POST /listing/<id>/request
resp3 = requests.post(f'{API_URL}/api/listing/{listing_id}/request', headers=HEADERS, json={})
print(f'POST /listing/{listing_id}/request with fake token: {resp3.status_code} {resp3.reason}')
print(resp3.text) 