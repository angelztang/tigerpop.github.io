from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.bid import Bid
from ..extensions import db

bp = Blueprint('bid', __name__)

# (Stub) Add more bid-specific endpoints as needed.
