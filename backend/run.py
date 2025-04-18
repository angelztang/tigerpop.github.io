from app import create_app
from app.routes.auth_routes import bp as auth_bp

app = create_app()

# Register the auth blueprint
app.register_blueprint(auth_bp)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8000, debug=True) 