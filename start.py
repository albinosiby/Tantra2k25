"""Startup helper for Render.

This script looks for FIREBASE_SERVICE_ACCOUNT_JSON (raw JSON, escaped newlines, or base64)
and writes it to a temp file, sets GOOGLE_APPLICATION_CREDENTIALS, then execs gunicorn
to start the Flask app. This ensures Firebase credentials are in place before the
application module imports firebase_admin at import time.
"""
import os
import sys
import json
import base64
import tempfile

_ENV_VAR = 'FIREBASE_SERVICE_ACCOUNT_JSON'


def _try_load_json(text: str):
    try:
        return json.loads(text)
    except Exception:
        return None


def _decode_possible_base64(text: str) -> str:
    try:
        # Heuristic: if it looks like base64 (only A-Za-z0-9+/= and long), try to decode
        if len(text) < 100:
            return None
        # ignore whitespace/newlines
        s = ''.join(text.split())
        # Validate base64 chars
        import re
        if re.fullmatch(r'[A-Za-z0-9+/=]+', s):
            decoded = base64.b64decode(s).decode('utf-8')
            return decoded
    except Exception:
        return None
    return None


def prepare_service_account() -> str:
    val = os.environ.get(_ENV_VAR)
    if not val:
        # Nothing to do
        return None

    # Try raw JSON
    obj = _try_load_json(val)
    if obj:
        # write to temp file
        fd, path = tempfile.mkstemp(prefix='firebase_sa_', suffix='.json')
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            json.dump(obj, f)
        return path

    # Try escaped-newlines
    maybe = val.replace('\\n', '\n')
    obj = _try_load_json(maybe)
    if obj:
        fd, path = tempfile.mkstemp(prefix='firebase_sa_', suffix='.json')
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            json.dump(obj, f)
        return path

    # Try base64
    decoded = _decode_possible_base64(val)
    if decoded:
        obj = _try_load_json(decoded)
        if obj:
            fd, path = tempfile.mkstemp(prefix='firebase_sa_', suffix='.json')
            with os.fdopen(fd, 'w', encoding='utf-8') as f:
                json.dump(obj, f)
            return path

    # Last resort: write raw text as-is
    fd, path = tempfile.mkstemp(prefix='firebase_sa_', suffix='.json')
    with os.fdopen(fd, 'w', encoding='utf-8') as f:
        f.write(val)
    return path


def main():
    path = prepare_service_account()
    if path:
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = path
        print(f'[start] Wrote service account to {path} and set GOOGLE_APPLICATION_CREDENTIALS')
    else:
        print('[start] No FIREBASE_SERVICE_ACCOUNT_JSON provided; proceeding without writing credentials')

    # Exec gunicorn to run the app. Use app:app (the Flask app object in app.py)
    # Respect Render's PORT env var
    port = os.environ.get('PORT', '8000')
    bind = f'0.0.0.0:{port}'

    # Build arguments for exec
    args = ['gunicorn', 'app:app', '--bind', bind, '--workers', '1']

    print('[start] Execing:', ' '.join(args))
    os.execvp(args[0], args)


if __name__ == '__main__':
    main()
