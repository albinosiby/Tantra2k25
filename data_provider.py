import json
import os
from typing import Any, Dict
import base64
import re

# Path to the local fallback JSON file
DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'data.json')


def _ensure_list(v):
    return v if isinstance(v, list) else []


def _ensure_dict(v):
    return v if isinstance(v, dict) else {}


def _normalize(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize raw dict into the small object the frontend expects."""
    departments = _ensure_list(raw.get('departments') or raw.get('department') or [])
    events = _ensure_list(raw.get('events') or [])
    # NOTE: per request, we DO NOT fetch or return festival metadata here.
    # Only departments and events are returned so the frontend consumes a
    # consistent shape: { departments: [...], events: [...] }
    return {
        'departments': departments,
        'events': events
    }


def _load_local() -> Dict[str, Any]:
    """Load data from the local JSON fallback file."""
    try:
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            raw = json.load(f)
            return _normalize(raw)
    except Exception:
        return {'departments': [], 'events': []}


def _load_firestore() -> Dict[str, Any]:
    """
    Attempt to load data from Google Firestore.

    Requirements:
    - Install: pip install google-cloud-firestore
    - Place your service account JSON at the repository root named `techfestadmin-a2e2c-firebase-adminsdk-fbsvc-8fc9d6e2e5`
      or set the environment variable GOOGLE_APPLICATION_CREDENTIALS to its path.

    This function attempts a simple pattern: look for a document named
    `site_data` in collection `config` (common pattern). If not found, it
    will attempt to read a document named `data` in collection `app`.

    The Firestore document should contain a JSON-like object with keys
    `departments`, `events`, `festivalInfo` (or compatible keys).
    """
    try:
        # Import lazily so the package is optional for users who only want local fallback
        print('[data_provider] Attempting to import google-cloud-firestore...')
        from google.cloud import firestore
        from google.oauth2 import service_account
        print('[data_provider] Successfully imported Firestore libraries')
    except Exception as e:
        # google-cloud-firestore not installed
        print('[data_provider] google-cloud-firestore import failed:', str(e))
        raise

    def _parse_service_account_env(text: str):
        """Parse common encodings for a service account JSON stored in an env var.

        Accepts raw JSON, escaped-newline JSON ("\\n" sequences) or base64-encoded JSON.
        Returns a dict on success or None on failure.
        """
        if not text:
            return None
        # Try raw JSON
        try:
            return json.loads(text)
        except Exception:
            pass
        # Try escaped-newlines
        try:
            maybe = text.replace('\\n', '\n')
            return json.loads(maybe)
        except Exception:
            pass
        # Try base64
        try:
            s = ''.join(text.split())
            if len(s) >= 100 and re.fullmatch(r'[A-Za-z0-9+/=]+', s):
                decoded = base64.b64decode(s).decode('utf-8')
                return json.loads(decoded)
        except Exception:
            pass
        return None

    # First, check for a service account provided directly in an environment variable
    sa_env = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON')
    client = None
    if sa_env:
        sa_info = _parse_service_account_env(sa_env)
        if sa_info:
            try:
                print('[data_provider] Using FIREBASE_SERVICE_ACCOUNT_JSON from environment')
                creds = service_account.Credentials.from_service_account_info(sa_info)
                client = firestore.Client(credentials=creds, project=sa_info.get('project_id'))
            except Exception as e:
                print('[data_provider] Failed to initialize Firestore from FIREBASE_SERVICE_ACCOUNT_JSON:', str(e))
                client = None

    # Prefer explicit env var for a credentials file if set (GOOGLE_APPLICATION_CREDENTIALS)
    cred_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    search_candidates = []
    if cred_path:
        search_candidates.append(cred_path)

    # Common filenames to look for in project root and data folder
    common_names = [
        'techfestadmin-a2e2c-firebase-adminsdk-fbsvc-8fc9d6e2e5.json',
        'techfestadmin-a2e2c-firebase-adminsdk-fbsvc-8fc9d6e2e5',
        'serviceAccountKey.json',
        'service-account.json'
    ]

    for name in common_names:
        search_candidates.append(os.path.join(os.path.dirname(__file__), name))
        search_candidates.append(os.path.join(os.getcwd(), name))
        search_candidates.append(os.path.join(os.path.dirname(__file__), 'data', name))

    # If we already created a client from the env var, skip file search
    if client is None:
        # pick the first existing candidate
        found = None
        for c in search_candidates:
            try:
                if c and os.path.exists(c):
                    found = c
                    break
            except Exception:
                continue

        if found:
            cred_path = found
            print(f"[data_provider] Using credentials file: {cred_path}")
            creds = service_account.Credentials.from_service_account_file(cred_path)
            client = firestore.Client(credentials=creds, project=creds.project_id)
        else:
            print('[data_provider] No credentials file found in candidates; will raise')
            raise FileNotFoundError('Firestore credentials not found. Searched candidates: ' + ','.join(search_candidates))
    # First: try reading per-key collections (events, departments, festivalInfo)
    try:
        print('[data_provider] Attempting to read per-key collections from Firestore')
        raw = {}

        # Events
        events_coll = client.collection('events')
        events_docs = list(events_coll.stream())
        if events_docs:
            events_list = [d.to_dict() for d in events_docs]
            raw['events'] = events_list
            print(f"[data_provider] Loaded {len(events_list)} events from 'events' collection")

        # Departments
        depts_coll = client.collection('departments')
        depts_docs = list(depts_coll.stream())
        if depts_docs:
            depts_list = [d.to_dict() for d in depts_docs]
            raw['departments'] = depts_list
            print(f"[data_provider] Loaded {len(depts_list)} departments from 'departments' collection")

        # festivalInfo or similar metadata
        fi_coll = client.collection('festivalInfo')
        fi_docs = list(fi_coll.stream())
        if fi_docs:
            # if metadata stored as single doc 'meta' or similar, merge keys
            if len(fi_docs) == 1:
                raw['festivalInfo'] = fi_docs[0].to_dict()
            else:
                # combine multiple docs into a dict
                merged = {}
                for d in fi_docs:
                    merged.update(d.to_dict())
                raw['festivalInfo'] = merged
            print('[data_provider] Loaded festivalInfo from collection')

        # If we found at least events or departments, return normalized
        if 'events' in raw or 'departments' in raw:
            print('[data_provider] Using per-key collections as data source')
            return _normalize(raw)
        else:
            print('[data_provider] No per-key collections found, falling back to document paths')
    except Exception as e:
        print('[data_provider] Error while reading per-key collections:', str(e))

    # Try common document locations (expanded) as a fallback
    doc_paths = [
        ('config', 'site_data'),
        ('config', 'data'),
        ('app', 'data'),
        ('app', 'site_data'),
        ('', 'data'),  # maybe a root document
        ('', 'site_data')
    ]

    for col, doc in doc_paths:
        try:
            print(f"[data_provider] Trying Firestore path: collection='{col}' doc='{doc}'")
            if col:
                ref = client.collection(col).document(doc)
            else:
                ref = client.document(doc)
            snapshot = ref.get()
            if snapshot.exists:
                raw = snapshot.to_dict()
                print(f"[data_provider] Found document at {col}/{doc}; raw keys: {list(raw.keys())}")
                return _normalize(raw)
            else:
                print(f"[data_provider] Document {col}/{doc} does not exist")
        except Exception as e:
            print(f"[data_provider] Error reading {col}/{doc}:", str(e))
            # ignore and try next path
            continue

    # If nothing found, raise to let caller fallback
    raise RuntimeError('No Firestore document found in expected locations.')


def get_data() -> Dict[str, Any]:
    """Try Firestore first, fallback to local JSON file.

    Returns normalized data dict with keys: departments, events, festivalInfo.
    """
    # First attempt Firestore. If anything goes wrong, fall back to local file.
    try:
        data = _load_firestore()
        return data
    except Exception:
        # Optional: log exception in real app
        return _load_local()
