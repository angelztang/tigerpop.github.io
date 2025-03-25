from app import create_app
from app import db
from flask_migrate import MigrateContext

# This is how Alembic should know about your app instance
app = create_app()

# Ensure the migrations use the correct app context
with app.app_context():
    # Alembic setup
    ...
