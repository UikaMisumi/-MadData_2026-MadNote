from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
import json
from pathlib import Path

# Security configuration
SECRET_KEY = "madnote_secret_key_2026"  # Keep this private
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7
USERS_FILE = "users.json"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
USERS_PATH = PROJECT_ROOT / USERS_FILE


def load_users():
    if USERS_PATH.exists():
        with USERS_PATH.open("r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_users(users):
    with USERS_PATH.open("w", encoding="utf-8") as f:
        json.dump(users, f, indent=4, ensure_ascii=False)


def get_password_hash(password):
    pwd = (password[:72] if len(password) > 72 else password).encode("utf-8")
    return bcrypt.hashpw(pwd, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password, hashed_password):
    if not hashed_password:
        return False
    pwd = (plain_password[:72] if len(plain_password) > 72 else plain_password).encode("utf-8")
    try:
        return bcrypt.checkpw(pwd, hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
