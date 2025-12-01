import os
import json
import base64
from pathlib import Path

# If a FIREBASE_SERVICE_ACCOUNT env var is set (containing JSON), write it to disk
# and set GOOGLE_APPLICATION_CREDENTIALS so existing code can pick it up.
svc_env = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
svc_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')


def _try_load_json(text: str):
    try:
        return json.loads(text)
    except Exception:
        return None


def _decode_possible_base64(text: str):
    try:
        # base64.b64decode will raise if invalid padding/content
        b = base64.b64decode(text, validate=True)
        s = b.decode('utf-8')
        return s
    except Exception:
        return None


if svc_env and not svc_path:
    try:
        # Normalize common escaped-newline sequences (e.g. coming from some CI/env inputs)
        candidate = svc_env
        # If the env var contains literal '\\n' sequences, convert them to real newlines
        if '\\n' in candidate and '\n' not in candidate:
            candidate = candidate.replace('\\n', '\n')

        # Try raw JSON
        if _try_load_json(candidate) is not None:
            data_to_write = candidate
        else:
            # Try base64 decode
            decoded = _decode_possible_base64(candidate)
            if decoded and _try_load_json(decoded) is not None:
                data_to_write = decoded
            else:
                # Fallback: write original env content as-is
                data_to_write = svc_env

        # Write to a file in the app directory
        target = Path(__file__).parent / 'firebase_service_account.json'
        with open(target, 'w', encoding='utf-8') as f:
            f.write(data_to_write)

        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = str(target)
        print(f'[entrypoint] Wrote FIREBASE_SERVICE_ACCOUNT to {target}')
    except Exception as e:
        print('[entrypoint] Failed to write FIREBASE_SERVICE_ACCOUNT:', e)

# Import the Flask app so Gunicorn can serve it (app must be named `app`).
try:
    from app import app
except Exception as e:
    print('[entrypoint] Failed to import app:', e)
    raise

# Expose WSGI callable
__all__ = ['app']
