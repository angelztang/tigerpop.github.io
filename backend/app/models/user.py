from ..extensions import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    netid = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(128))
    
    def __init__(self, netid, password=None):
        self.netid = netid
        if password:
            self.set_password(password)
    
    def set_password(self, password):
        self.password = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password, password)
    
    def __repr__(self):
        return f'<User {self.netid}>' 