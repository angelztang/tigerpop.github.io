from ..extensions import db
from datetime import datetime
import uuid

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    netid = db.Column(db.String(80), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __init__(self, netid):
        self.netid = netid
    
    @property
    def email(self):
        """Generate email from netid by appending @princeton.edu"""
        return f"{self.netid}@princeton.edu"
    
    def to_dict(self):
        return {
            'id': self.id,
            'netid': self.netid,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<User {self.netid}>' 