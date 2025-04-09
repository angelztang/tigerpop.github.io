from dotenv import load_dotenv
import os
from flask_cors import CORS

# Load environment variables from .env file
load_dotenv()

from app import create_app

app = create_app()

# Configure CORS
CORS(app, 
     resources={r"/*": {
         "origins": ["https://tigerpop-marketplace-frontend-df8f1fbc1309.herokuapp.com"],
         "supports_credentials": True,
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
         "expose_headers": ["Content-Type", "Authorization"],
         "max_age": 3600
     }})

if __name__ == '__main__':
    app.run(debug=True) 