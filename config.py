import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

# Path to Firebase credentials and data.json
CRED_PATH = os.path.join(os.path.dirname(__file__), 'techfestadmin-a2e2c-firebase-adminsdk-fbsvc-8fc9d6e2e5.json')
DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'data.json')

# Initialize Firebase
if not firebase_admin._apps:
    cred = credentials.Certificate(CRED_PATH)
    firebase_admin.initialize_app(cred)
db = firestore.client()

def clear_firestore():
    collections = db.collections()
    for collection in collections:
        docs = collection.stream()
        for doc in docs:
            doc.reference.delete()
    print('All Firestore collections and documents deleted.')


def upload_data():
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    # Store each top-level key as its own collection
    print('[config] Uploading data to Firestore as per-key collections')
    for key, value in data.items():
        coll_name = key
        if isinstance(value, list):
            print(f"[config] Writing list to collection '{coll_name}' ({len(value)} items)")
            # Clear existing collection
            for doc in db.collection(coll_name).stream():
                doc.reference.delete()
            for item in value:
                # Determine document id
                doc_id = None
                if isinstance(item, dict):
                    if 'id' in item:
                        doc_id = str(item['id'])
                    elif 'name' in item:
                        doc_id = str(item['name'])
                if not doc_id:
                    import uuid
                    doc_id = str(uuid.uuid4())
                db.collection(coll_name).document(doc_id).set(item)
        elif isinstance(value, dict):
            print(f"[config] Writing dict to collection '{coll_name}' as single doc 'meta'")
            # Clear existing collection
            for doc in db.collection(coll_name).stream():
                doc.reference.delete()
            db.collection(coll_name).document('meta').set(value)
        else:
            # primitives: store as single doc
            print(f"[config] Writing primitive value for key '{coll_name}' as single doc 'value'")
            for doc in db.collection(coll_name).stream():
                doc.reference.delete()
            db.collection(coll_name).document('value').set({coll_name: value})

    print('All per-key collections uploaded to Firestore.')


def verify_firestore():
    # Try to fetch the uploaded document and print it
    doc = db.collection('config').document('site_data').get()
    if doc.exists:
        print('Fetched data from Firestore:')
        print(json.dumps(doc.to_dict(), indent=2, ensure_ascii=False))
    else:
        print('No data found at config/site_data in Firestore.')

if __name__ == '__main__':
    clear_firestore()
    upload_data()
    print('Firestore reset and updated with data.json.')
    verify_firestore()
