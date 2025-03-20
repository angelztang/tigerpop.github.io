import re

def validate_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)

def validate_password(password):
    return len(password) >= 6

def validate_price(price):
    try:
        price = float(price)
        return price > 0  # Price must be greater than 0
    except ValueError:
        return False