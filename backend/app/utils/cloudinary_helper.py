import cloudinary
import cloudinary.uploader
import os

cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET')
)

def upload_images(images):
    image_urls = []
    for image in images:
        result = cloudinary.uploader.upload(image)
        image_urls.append(result['url'])
    return image_urls
