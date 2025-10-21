"""Data provider for Tantra25 admin interface.

This module provides a unified interface to fetch data from either:
1. Firebase Firestore (primary), or
2. Local data.json file (fallback)
"""

import json
import os
from typing import Dict, List, Any

try:
    import firebase_admin
    from firebase_admin import firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False


def get_data() -> Dict[str, Any]:
    """Get departments and events data from Firebase or local fallback."""
    
    # Try Firebase first
    if FIREBASE_AVAILABLE and firebase_admin._apps:
        try:
            db = firestore.client()
            return _get_data_from_firestore(db)
        except Exception as e:
            print(f"[data_provider] Firebase error: {e}")
    
    # Fallback to local file
    return _get_data_from_local_file()


def _get_data_from_firestore(db) -> Dict[str, Any]:
    """Fetch data from Firebase Firestore."""
    data = {
        'departments': [],
        'events': []
    }
    
    try:
        # Get departments
        depts = db.collection('departments').stream()
        for dept in depts:
            dept_data = dept.to_dict()
            dept_data['id'] = dept.id
            data['departments'].append(dept_data)
        
        # Get events
        events = db.collection('events').stream()
        for event in events:
            event_data = event.to_dict()
            event_data['id'] = event.id
            data['events'].append(event_data)
            
    except Exception as e:
        print(f"[data_provider] Error fetching from Firestore: {e}")
    
    return data


def _get_data_from_local_file() -> Dict[str, Any]:
    """Fetch data from local data.json file."""
    try:
        data_path = os.path.join(os.path.dirname(__file__), 'data', 'data.json')
        with open(data_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[data_provider] Error reading local file: {e}")
        return {'departments': [], 'events': []}


# For backward compatibility
if __name__ == '__main__':
    print("Data provider module for Tantra25 admin")