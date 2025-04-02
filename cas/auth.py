from flask import Flask, request, redirect, render_template, make_response, jsonify
from flask_cors import CORS
import uuid
import urllib.parse

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://localhost:8000"], "supports_credentials": True, "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})

# In-memory storage for tickets and users
tickets = {}
users = {}

def generate_ticket():
    """Generate a unique ticket."""
    return f"ST-{uuid.uuid4()}"

@app.route('/login', methods=['GET', 'OPTIONS'])
def login():
    """Show login page."""
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        return response

    service = request.args.get('service')
    if not service:
        return "No service URL provided", 400
    
    # URL decode the service URL
    service = urllib.parse.unquote(service)
    
    response = make_response(render_template('login.html', service=service))
    response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

@app.route('/authenticate', methods=['POST', 'OPTIONS'])
def authenticate():
    """Handle login form submission."""
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        return response
        
    username = request.form.get('username')
    password = request.form.get('password')
    service = request.form.get('service')
    
    if not username or not password or not service:
        return "Missing parameters", 400
    
    # In production, validate against actual credentials
    if username and password:
        # Generate ticket
        ticket = generate_ticket()
        tickets[ticket] = username
        users[username] = {'email': f"{username}@princeton.edu"}
        
        # URL encode the service URL
        service = urllib.parse.quote(service)
        
        # Redirect back to service with ticket
        response = redirect(f"{service}?ticket={ticket}")
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        return response
    
    return "Invalid credentials", 401

@app.route('/serviceValidate', methods=['GET', 'OPTIONS'])
def service_validate():
    """Validate a service ticket."""
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        return response

    ticket = request.args.get('ticket')
    service = request.args.get('service')
    
    if not ticket or not service:
        return "Missing parameters", 400
    
    if ticket not in tickets:
        return "Invalid ticket", 400
    
    username = tickets[ticket]
    user = users.get(username)
    
    if not user:
        return "User not found", 400
    
    # Generate CAS response
    response = f"""<?xml version="1.0" encoding="UTF-8"?>
<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas">
    <cas:authenticationSuccess>
        <cas:user>{username}</cas:user>
        <cas:attributes>
            <cas:email>{user['email']}</cas:email>
        </cas:attributes>
    </cas:authenticationSuccess>
</cas:serviceResponse>"""
    
    # Clean up used ticket
    del tickets[ticket]
    
    response = make_response(response)
    response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    response.headers.add('Content-Type', 'application/xml')
    return response

if __name__ == '__main__':
    app.run(port=5000, debug=True) 