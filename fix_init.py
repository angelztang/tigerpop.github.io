#!/usr/bin/env python3

# Direct fix for __init__.py

with open("app/__init__.py", "r") as f:
    content = f.read()

# Replace the problematic before_request with after_request
fixed_content = content.replace("@app.before_request", "@app.after_request")

with open("app/__init__.py", "w") as f:
    f.write(fixed_content)

print("Fixed @app.before_request -> @app.after_request in app/__init__.py") 