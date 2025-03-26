import bcrypt
import os
from dotenv import load_dotenv
import psycopg2

# Load environment variables
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv('DATABASE_URL')

# Replace 'postgres://' with 'postgresql://' if necessary
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

# Create test user credentials
username = 'testuser'
email = 'test@example.com'
password = 'test123'

# Hash the password
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
hashed_password = hashed.decode('utf-8')

print(f"Generated hash: {hashed_password}")

# Connect to the database
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Insert the user
try:
    cur.execute(
        'INSERT INTO "user" (username, email, password) VALUES (%s, %s, %s) RETURNING id',
        (username, email, hashed_password)
    )
    user_id = cur.fetchone()[0]
    conn.commit()
    print(f"Created user with ID: {user_id}")
    print(f"Username: {username}")
    print(f"Password: {password}")
except Exception as e:
    print(f"Error creating user: {e}")
    conn.rollback()
finally:
    cur.close()
    conn.close() 