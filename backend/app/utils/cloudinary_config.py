import os
import cloudinary
import cloudinary.uploader

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

def upload_image(image_file):
    """
    Upload an image to Cloudinary and return the URL
    """
    try:
        # Upload the image
        result = cloudinary.uploader.upload(image_file)
        # Return the secure URL of the uploaded image
        return result['secure_url']
    except Exception as e:
        print(f"Error uploading image to Cloudinary: {str(e)}")
        return None 