import requests
import base64
from PIL import Image
import io

def test_image_upload():
    try:
        # Read the image file
        with open('test_tshirt.jpg', 'rb') as image_file:
            # Convert to base64
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')
            
            # Send to our test endpoint
            url = 'https://tigerpop-marketplace-backend-76fa6fb8c8a2.herokuapp.com/api/listings/test-upload'
            response = requests.post(url, json={'image': base64_image})
            
            print('Response status:', response.status_code)
            print('Response body:', response.json())
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == '__main__':
    test_image_upload() 