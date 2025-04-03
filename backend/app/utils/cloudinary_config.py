import cloudinary
import cloudinary.uploader
import cloudinary.api
from flask import current_app
import os
import logging

def init_cloudinary():
    """Initialize Cloudinary with credentials from environment variables."""
    try:
        # Get credentials directly from environment variables
        cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
        api_key = os.environ.get('CLOUDINARY_API_KEY')
        api_secret = os.environ.get('CLOUDINARY_API_SECRET')

        current_app.logger.info(f"Cloudinary environment variables:")
        current_app.logger.info(f"CLOUDINARY_CLOUD_NAME: {'set' if cloud_name else 'not set'}")
        current_app.logger.info(f"CLOUDINARY_API_KEY: {'set' if api_key else 'not set'}")
        current_app.logger.info(f"CLOUDINARY_API_SECRET: {'set' if api_secret else 'not set'}")

        if not all([cloud_name, api_key, api_secret]):
            missing = []
            if not cloud_name: missing.append('CLOUDINARY_CLOUD_NAME')
            if not api_key: missing.append('CLOUDINARY_API_KEY')
            if not api_secret: missing.append('CLOUDINARY_API_SECRET')
            raise ValueError(f"Missing Cloudinary credentials: {', '.join(missing)}")

        # Configure Cloudinary
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret
        )
        current_app.logger.info(f"Cloudinary initialized successfully with cloud name: {cloud_name}")

        # Test the configuration
        test_result = cloudinary.api.ping()
        current_app.logger.info(f"Cloudinary test ping result: {test_result}")

    except Exception as e:
        current_app.logger.error(f"Failed to initialize Cloudinary: {str(e)}")
        current_app.logger.exception("Full traceback:")
        raise

def upload_image(file):
    """Upload a single image to Cloudinary.
    
    Args:
        file: File object from request.files
        
    Returns:
        dict: Cloudinary upload response containing 'secure_url' and other metadata
    """
    try:
        if not file:
            raise ValueError("No file provided")
            
        # Log the file details for debugging
        current_app.logger.info(f"Attempting to upload file: {file.filename if hasattr(file, 'filename') else 'BytesIO object'}")
        current_app.logger.info(f"File content type: {file.content_type if hasattr(file, 'content_type') else 'unknown'}")
            
        # Upload the file to Cloudinary
        upload_result = cloudinary.uploader.upload(file)
        current_app.logger.info(f"Successfully uploaded image to Cloudinary: {upload_result['secure_url']}")
        return upload_result
        
    except Exception as e:
        current_app.logger.error(f"Failed to upload image to Cloudinary: {str(e)}")
        current_app.logger.exception("Full traceback:")
        raise

def delete_image(public_id):
    """Delete an image from Cloudinary by its public ID.
    
    Args:
        public_id: The public ID of the image to delete
        
    Returns:
        dict: Cloudinary deletion response
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        current_app.logger.info(f"Successfully deleted image from Cloudinary: {public_id}")
        return result
    except Exception as e:
        current_app.logger.error(f"Failed to delete image from Cloudinary: {str(e)}")
        raise 