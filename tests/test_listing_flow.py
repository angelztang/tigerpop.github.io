import requests
import os
import json
from datetime import datetime

# Configuration
BACKEND_URL = "https://tigerpop-marketplace-backend-76fa6fb8c8a2.herokuapp.com"
TEST_USER_ID = 1  # Replace with a valid test user ID
TEST_NETID = "testuser"  # Replace with a valid test netid

def test_create_listing():
    print("Testing listing creation flow...")
    
    # Step 1: Create a test listing
    listing_data = {
        "title": f"Test Listing {datetime.now().strftime('%Y%m%d%H%M%S')}",
        "description": "This is a test listing",
        "price": 10.99,
        "category": "other",
        "user_id": TEST_USER_ID,
        "condition": "good",
        "netid": TEST_NETID
    }
    
    print("\n1. Creating listing...")
    response = requests.post(
        f"{BACKEND_URL}/api/listing",
        json=listing_data,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code != 201:
        print(f"Failed to create listing. Status: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    listing = response.json()
    print(f"Listing created successfully! ID: {listing['id']}")
    
    # Step 2: Upload an image
    print("\n2. Uploading test image...")
    test_image_path = "test_image.png"
    
    # Create a small test image
    with open(test_image_path, "wb") as f:
        f.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82')
    
    try:
        with open(test_image_path, "rb") as f:
            files = {"images": ("test.png", f, "image/png")}
            response = requests.post(
                f"{BACKEND_URL}/api/listing/upload",
                files=files
            )
        
        if response.status_code != 200:
            print(f"Failed to upload image. Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        image_urls = response.json()["urls"]
        print(f"Image uploaded successfully! URL: {image_urls[0]}")
        
        # Step 3: Update listing with image
        print("\n3. Updating listing with image...")
        update_data = {
            "images": image_urls
        }
        
        response = requests.put(
            f"{BACKEND_URL}/api/listing/{listing['id']}",
            json=update_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            print(f"Failed to update listing. Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        print("Listing updated successfully with image!")
        
        # Step 4: Verify listing
        print("\n4. Verifying listing...")
        response = requests.get(f"{BACKEND_URL}/api/listing/{listing['id']}")
        
        if response.status_code != 200:
            print(f"Failed to get listing. Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        updated_listing = response.json()
        print("Listing verification successful!")
        print(f"Title: {updated_listing['title']}")
        print(f"Price: ${updated_listing['price']}")
        print(f"Category: {updated_listing['category']}")
        print(f"Condition: {updated_listing['condition']}")
        print(f"Images: {updated_listing.get('images', [])}")
        
        return True
        
    finally:
        # Cleanup
        if os.path.exists(test_image_path):
            os.remove(test_image_path)

if __name__ == "__main__":
    success = test_create_listing()
    print("\nTest completed successfully!" if success else "\nTest failed!") 