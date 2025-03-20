from flask import Blueprint, request, jsonify
from app.services.auth_service import login, register

bp = Blueprint('auth', __name__)

@bp.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    return login(data)

@bp.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    return register(data)
