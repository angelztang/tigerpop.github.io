from ..extensions import db
from datetime import datetime
import uuid

class User(db.Model):
    __tablename__ = 'users'
    
    netid = db.Column(db.String(80), primary_key=True)
    
    def __init__(self, netid):
        self.netid = netid
    
    def to_dict(self):
        return {
            'netid': self.netid
        }
    
    def __repr__(self):
        return f'<User {self.netid}>' 