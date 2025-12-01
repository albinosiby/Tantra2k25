"""Admin Flask application for Tantra25.

This file provides the admin UI and API endpoints. It expects Firebase
credentials to be available via one of:

- FIREBASE_SERVICE_ACCOUNT_JSON environment variable containing the raw JSON
  service account (set by start.py), or
- FIREBASE_CREDENTIALS_FILE environment variable pointing to a JSON file path.

The repository also contains a `start.py` helper which writes the env var to a
temporary file and sets GOOGLE_APPLICATION_CREDENTIALS before exec'ing gunicorn.
"""

from flask import Flask, render_template, request, redirect, url_for, send_file, Response, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import json
import re
import io
import os
import uuid
from werkzeug.utils import secure_filename
from typing import List, Dict

try:
    import openpyxl
    _ = getattr(openpyxl, '__version__', None)
except Exception:
    # openpyxl is optional for static analysis; exporting xlsx uses pandas/openpyxl
    pass

# Use Flask's default static folder (`static/`) so assets placed in `static/` are
# served under the `/static/` URL path. Templates already use
# `url_for('static', filename=...)`, which will resolve to `/static/...`.
app = Flask(__name__)

# Base link to use when constructing absolute URLs for saved DB links.
curr_link = os.environ.get('CURR_LINK', "https://tantra2k25.onrender.com")


def make_static_url(filename: str) -> str:
    """Return an absolute URL for a file in the static folder using curr_link as base."""
    from flask import url_for

    path = url_for('static', filename=filename, _external=False)
    return curr_link.rstrip('/') + path


# -------------------- Upload folders --------------------
UPLOAD_QR_FOLDER = 'static/qr'
UPLOAD_EVENT_FOLDER = 'static/event_images'
UPLOAD_LOGO_FOLDER = 'static/logos'

os.makedirs(UPLOAD_QR_FOLDER, exist_ok=True)
os.makedirs(UPLOAD_EVENT_FOLDER, exist_ok=True)
os.makedirs(UPLOAD_LOGO_FOLDER, exist_ok=True)

app.config['UPLOAD_QR_FOLDER'] = UPLOAD_QR_FOLDER
app.config['UPLOAD_EVENT_FOLDER'] = UPLOAD_EVENT_FOLDER
app.config['UPLOAD_LOGO_FOLDER'] = UPLOAD_LOGO_FOLDER


# -------------------- Firebase initialization --------------------
# The app supports three ways to provide Firebase credentials:
# 1. FIREBASE_SERVICE_ACCOUNT_JSON environment variable containing the raw JSON object
#    (the recommended approach on Render). The var may be a JSON string, a string
#    with escaped-newlines ("\n"), or a base64-encoded JSON blob.
# 2. FIREBASE_CREDENTIALS_FILE pointing to a JSON file on disk (legacy / local).
# If FIREBASE_SERVICE_ACCOUNT_JSON is set we try to parse it robustly and use
# credentials.Certificate with the parsed dict so no temporary file is required.
_sa_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON')
_sa_file = os.environ.get('FIREBASE_CREDENTIALS_FILE', 'fconfig.json')


def _parse_service_account_env(text: str):
    """Try to parse common encodings of the service account JSON.

    Accepts:
    - raw JSON string (direct json.loads)
    - escaped-newlines (replace "\\n" with real newlines then json.loads)
    - base64-encoded JSON (heuristic length + charset check)
    Returns a dict on success or None on failure.
    """
    if not text:
        return None
    # 1) raw JSON
    try:
        return json.loads(text)
    except Exception:
        pass

    # 2) escaped newlines (common when environment panels escape newlines)
    try:
        maybe = text.replace('\\n', '\n')
        return json.loads(maybe)
    except Exception:
        pass

    # 3) base64-encoded blob (heuristic)
    try:
        import base64, re
        s = ''.join(text.split())
        if len(s) >= 100 and re.fullmatch(r'[A-Za-z0-9+/=]+', s):
            decoded = base64.b64decode(s).decode('utf-8')
            return json.loads(decoded)
    except Exception:
        pass

    return None


cred = None
if _sa_json:
    sa_info = _parse_service_account_env(_sa_json) if isinstance(_sa_json, str) else _sa_json
    if sa_info:
        cred = credentials.Certificate(sa_info)
    else:
        raise RuntimeError('FIREBASE_SERVICE_ACCOUNT_JSON provided but could not be parsed. Provide raw JSON, escaped-newlines, or base64.')
elif os.path.exists(_sa_file):
    cred = credentials.Certificate(_sa_file)
else:
    raise RuntimeError('Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_CREDENTIALS_FILE.')

firebase_admin.initialize_app(cred)
db = firestore.client()


# -------------------- Routes --------------------
@app.route('/')
def index():
    depts = list(db.collection('departments').stream())
    total_departments = len(depts)
    dept_map = {d.id: d.to_dict().get('name', '') for d in depts}

    events = list(db.collection('events').stream())
    total_events = len(events)

    # Count registrations (not participants)
    registrations = list(db.collection('regists').stream())
    total_registrations = len(registrations)
    
    # Count unique participants (by email)
    unique_participants = set()
    for reg in registrations:
        reg_data = reg.to_dict()
        email = reg_data.get('email', '').strip().lower()
        if email:
            unique_participants.add(email)
    total_unique_participants = len(unique_participants)

    recent_events = []
    for e in events:
        ed = e.to_dict()
        did = ed.get('department')
        recent_events.append({
            'id': e.id,
            'name': ed.get('name'),
            'dept_id': did,
            'dept_name': dept_map.get(did, (did or '')),
            'date': ed.get('date'),
            'status': ed.get('status', 1)
        })

    dept_list = [
        {
            'id': d.id,
            'name': d.to_dict().get('name', ''),
            'logo_url': d.to_dict().get('logo_url', ''),
            # Use the filename stored as 'qr_code' in Firestore (we serve files from static/Qr code/)
            'qr_code': d.to_dict().get('qr_code', '')
        }
        for d in depts
    ]

    # Ensure Computer Science Engineering appears first on the page if present
    preferred_id = 'computer-science-engineering'
    for i, dept in enumerate(dept_list):
        if dept.get('id') == preferred_id:
            # move to front
            dept_list.insert(0, dept_list.pop(i))
            break

    return render_template('index.html',
                           total_departments=total_departments,
                           total_events=total_events,
                           total_registrations=total_registrations,
                           total_unique_participants=total_unique_participants,
                           recent_events=recent_events,
                           departments=dept_list)


@app.route('/dept_events/<dept_id>', methods=['GET'])
def dept_events(dept_id):
    if not dept_id:
        return jsonify({'events': []})
    try:
        ev_q = db.collection('events').where('department', '==', dept_id).stream()
    except Exception:
        return jsonify({'events': []})
    evs = []
    for e in ev_q:
        ed = e.to_dict()
        evs.append({
            'id': e.id,
            'name': ed.get('name'),
            'date': ed.get('date'),
            'status': ed.get('status', 1),
            'image_url': ed.get('image_url', ''),
            'venue': ed.get('venue', ''),
            'department': ed.get('department', '')
        })
    return jsonify({'events': evs, 'dept_id': dept_id})


@app.route('/developers.html')
def developers_page():
    # Render the developers page template
    return render_template('developers.html')


@app.route('/events.html')
def events_page():
    # Render the events listing page
    return render_template('events.html')


@app.route('/event/<event_id>', methods=['GET'])
def get_event(event_id):
    if not event_id:
        return jsonify({'error': 'missing id'}), 400
    ev_doc = db.collection('events').document(event_id).get()
    if not ev_doc.exists:
        return jsonify({'error': 'not found'}), 404
    ed = ev_doc.to_dict()
    result = {
        'id': ev_doc.id,
        'name': ed.get('name'),
        'description': ed.get('description', ''),
        'date': ed.get('date', ''),
        'time': ed.get('time', ''),
        'venue': ed.get('venue', ''),
        'image_url': ed.get('image_url', ''),
        'status': ed.get('status', 1),
        'department': ed.get('department', ''),
        'price': ed.get('price', ''),
        'prize': ed.get('prize', '')
    }
    return jsonify({'event': result})


@app.route('/api/data')
def api_data():
    """Return normalized data for frontend (departments, events)."""
    try:
        # Direct Firestore query without data_provider
        departments = []
        depts = db.collection('departments').stream()
        for dept in depts:
            dept_data = dept.to_dict()
            dept_data['id'] = dept.id
            departments.append(dept_data)
        
        events = []
        evs = db.collection('events').stream()
        for event in evs:
            event_data = event.to_dict()
            event_data['id'] = event.id
            events.append(event_data)
        
        # Ensure preferred department ordering
        preferred_id = 'computer-science-engineering'
        for i, d in enumerate(departments):
            if d.get('id') == preferred_id:
                departments.insert(0, departments.pop(i))
                break
                
        return jsonify({
            'departments': departments,
            'events': events
        })
        
    except Exception as e:
        print(f"API data error: {e}")
        # Fallback to local file
        try:
            data_path = os.path.join(os.path.dirname(__file__), 'data', 'data.json')
            with open(data_path, 'r', encoding='utf-8') as f:
                raw = json.load(f)
            return jsonify({
                'departments': raw.get('departments', []),
                'events': raw.get('events', [])
            })
        except Exception:
            return jsonify({'departments': [], 'events': []})


@app.route('/add_department', methods=['GET', 'POST'])
def add_department():
    if request.method == 'POST':
        name = request.form['name']
        description = request.form['description']

        logo_file = request.files.get('logo_file')
        logo_url = ""
        if logo_file and logo_file.filename != "":
            filename = secure_filename(logo_file.filename)
            path = os.path.join(app.config['UPLOAD_LOGO_FOLDER'], filename)
            logo_file.save(path)
            logo_url = make_static_url(f'logos/{filename}')

        qr_file = request.files.get('qr_file')
        qr_url = ""
        if qr_file and qr_file.filename != "":
            filename = secure_filename(qr_file.filename)
            path = os.path.join(app.config['UPLOAD_QR_FOLDER'], filename)
            qr_file.save(path)
            qr_url = make_static_url(f'qr/{filename}')

        db.collection('departments').document().set({
            'name': name,
            'description': description,
            'logo_url': logo_url,
            'qr_url': qr_url,
            'created_at': datetime.utcnow()
        })
        return redirect(url_for('index'))
    departments = list(db.collection('departments').stream())
    dept_list = [(d.id, d.to_dict().get('name', ''), d.to_dict().get('description', '')) for d in departments]
    return render_template('add_department.html', departments=dept_list)


@app.route('/add_event', methods=['GET', 'POST'])
def add_event():
    departments = db.collection('departments').stream()
    dept_list = [(dept.id, dept.to_dict()['name']) for dept in departments]

    if request.method == 'POST':
        dept_id = request.form['dept_id']
        name = request.form['name']
        description = request.form['description']
        date = request.form['date']
        time = request.form['time']
        venue = request.form['venue']

        event_file = request.files.get('event_image')
        image_url = ""
        if event_file and event_file.filename != "":
            filename = secure_filename(event_file.filename)
            path = os.path.join(app.config['UPLOAD_EVENT_FOLDER'], filename)
            event_file.save(path)
            image_url = make_static_url(f'event_images/{filename}')

        dept_doc = db.collection('departments').document(dept_id).get()
        payment_qr_url = ''
        if dept_doc.exists:
            payment_qr_url = dept_doc.to_dict().get('qr_url', '')

        status = request.form.get('status', 'open')
        price = request.form.get('price', '')
        prize = request.form.get('prize', '')

        all_events = db.collection('events').stream()
        max_id = 0
        for ev in all_events:
            try:
                eid = int(ev.id)
                if eid > max_id:
                    max_id = eid
            except Exception:
                continue
        new_id = max_id + 1
        event_ref = db.collection('events').document(str(new_id))
        event_ref.set({
            'id': new_id,
            'department': dept_id,
            'name': name,
            'description': description,
            'date': date,
            'time': time,
            'venue': venue,
            'image_url': image_url,
            'payment_qr_url': payment_qr_url,
            'price': price,
            'prize': prize,
            'status': status,
            'created_at': datetime.utcnow()
        })
        return redirect(url_for('index'))
    return render_template('add_event.html', departments=dept_list)


@app.route('/toggle_event_status', methods=['POST'])
def toggle_event_status():
    event_id = request.form.get('event_id')
    if not event_id:
        return redirect(url_for('index'))
    ev_doc = db.collection('events').document(event_id).get()
    if not ev_doc.exists:
        return redirect(url_for('index'))
    ev = ev_doc.to_dict()
    current = ev.get('status', 'open')
    new_status = 'close' if current == 'open' else 'open'
    db.collection('events').document(event_id).update({'status': new_status})
    return redirect(url_for('index'))


@app.route('/view_participants', methods=['GET'])
def view_participants():
    departments = db.collection('departments').stream()
    dept_list = [(dept.id, dept.to_dict()['name']) for dept in departments]
    dept_map = {d[0]: d[1] for d in dept_list}

    selected_dept_id = request.args.get('dept_id')
    selected_event_id = request.args.get('event_id')
    
    participants_info = []

    # Build query for registrations (collection renamed to 'regists')
    reg_query = db.collection('regists')
    
    if selected_dept_id:
        # Get department name from ID
        dept_doc = db.collection('departments').document(selected_dept_id).get()
        if dept_doc.exists:
            dept_name = dept_doc.to_dict().get('name')
            reg_query = reg_query.where('department', '==', dept_name)
    
    if selected_event_id:
        reg_query = reg_query.where('event_id', '==', selected_event_id)

    # Fetch registrations
    registrations = reg_query.stream()
    
    for reg_doc in registrations:
        reg = reg_doc.to_dict()
        
        participants_info.append({
            'name': reg.get('name'),
            'email': reg.get('email'),
            'phone': reg.get('phone'),
            'college': reg.get('college'),
            'branch': reg.get('branch'),
            'year': reg.get('year'),
            'event_name': reg.get('event_name'),
            'dept_name': reg.get('department'),
            'event_id': reg.get('event_id'),
            'transaction_id': reg.get('transaction_id'),
            'registration_date': reg.get('registration_date')
        })

    # Sort results
    if selected_event_id:
        participants_info = sorted(participants_info, key=lambda r: (r.get('dept_name', ''), r.get('name', '')))
    else:
        participants_info = sorted(participants_info, key=lambda r: (r.get('dept_name', ''), r.get('event_name', ''), r.get('name', '')))

    # Get events for filter dropdown
    if selected_dept_id:
        ev_q = db.collection('events').where('department', '==', selected_dept_id).stream()
    else:
        ev_q = db.collection('events').stream()
    
    events_for_select = [(e.id, e.to_dict().get('name')) for e in ev_q]

    return render_template('view_participants.html',
                           departments=dept_list,
                           participants=participants_info,
                           selected_dept_id=selected_dept_id,
                           selected_event_id=selected_event_id,
                           events_for_select=events_for_select)


@app.route('/export_participants')
def export_participants():
    dept_id = request.args.get('dept_id')
    event_id = request.args.get('event_id')
    fmt = request.args.get('format', 'xlsx').lower()

    def _sanitize(s: str) -> str:
        if not s:
            return ''
        s = s.lower()
        s = re.sub(r'[^a-z0-9]+', '_', s)
        s = s.strip('_')
        return s or 'value'

    dept_name = None
    if dept_id:
        d = db.collection('departments').document(dept_id).get()
        if d.exists:
            dept_name = d.to_dict().get('name')

    event_name = None
    if event_id:
        evdoc = db.collection('events').document(event_id).get()
        if evdoc.exists:
            event_name = evdoc.to_dict().get('name')
        else:
            event_name = event_id

    # Query registrations collection instead of participants (collection 'regists')
    q = db.collection('regists')
    if dept_name:
        q = q.where('department', '==', dept_name)
    if event_id:
        q = q.where('event_id', '==', event_id)
    
    rows = []
    for doc in q.stream():
        reg = doc.to_dict()
        rows.append({
            'name': reg.get('name', ''),
            'email': reg.get('email', ''),
            'phone': reg.get('phone', ''),
            'college': reg.get('college', ''),
            'branch': reg.get('branch', ''),
            'year': reg.get('year', ''),
            'event_name': reg.get('event_name', ''),
            'dept_name': reg.get('department', ''),
            'transaction_id': reg.get('transaction_id', ''),
            'registration_date': reg.get('registration_date', '')
        })

    rows = sorted(rows, key=lambda r: (r.get('dept_name', ''), r.get('event_name', ''), r.get('name', '')))

    headers = ['name', 'email', 'phone', 'college', 'branch', 'year', 'event_name', 'dept_name', 'transaction_id', 'registration_date']

    part_dept = _sanitize(dept_name) if dept_name else 'all_departments'
    part_event = _sanitize(event_name) if event_name else 'all_events'
    base_filename = f'tantra_{part_dept}_{part_event}'

    if fmt == 'xlsx':
        try:
            import pandas as pd
        except Exception:
            return Response('pandas is required to export XLSX. Install with `pip install pandas openpyxl`', status=500)
        df = pd.DataFrame(rows)
        for h in headers:
            if h not in df.columns:
                df[h] = ''
        buf = io.BytesIO()
        df.to_excel(buf, index=False)
        buf.seek(0)
        filename = f'{base_filename}.xlsx'
        return send_file(buf, as_attachment=True, download_name=filename, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    if fmt == 'pdf':
        try:
            from reportlab.lib.pagesizes import A4, landscape
            from reportlab.lib import colors
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
        except Exception:
            return Response('reportlab is required to export PDF. Install with `pip install reportlab`', status=500)
        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=landscape(A4))
        data = [headers]
        for r in rows:
            data.append([r.get(h, '') for h in headers])
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7c4dff')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        doc.build([table])
        buf.seek(0)
        filename = f'{base_filename}.pdf'
        return send_file(buf, as_attachment=True, download_name=filename, mimetype='application/pdf')

    return Response('Unsupported format. Allowed: xlsx, pdf', status=400)


@app.route('/db_content')
def db_content():
    departments = db.collection('departments').stream()
    all_data = []
    for dept in departments:
        dept_data = dept.to_dict()
        events = db.collection('events').where('dept_id', '==', dept.id).stream()
        event_list = []
        for e in events:
            ev = e.to_dict()
            ev['_id'] = e.id
            event_list.append(ev)
        all_data.append({
            'dept_id': dept.id,
            'dept_name': dept_data.get('name'),
            'description': dept_data.get('description'),
            'logo_url': dept_data.get('logo_url'),
            'qr_url': dept_data.get('qr_url'),
            'events': event_list
        })
    return render_template('db_content.html', data=all_data)


@app.route('/fix_events', methods=['GET', 'POST'])
def fix_events():
    departments = list(db.collection('departments').stream())
    dept_list = [(d.id, d.to_dict().get('name')) for d in departments]

    message = ''
    if request.method == 'POST':
        event_id = request.form.get('event_id')
        new_dept = request.form.get('dept_id')
        if event_id and new_dept:
            db.collection('events').document(event_id).update({'dept_id': new_dept})
            message = 'Updated event department.'

    events = list(db.collection('events').stream())
    dept_ids = {d.id for d in departments}
    problematic = []
    for e in events:
        ed = e.to_dict()
        did = ed.get('dept_id')
        if not did or did not in dept_ids:
            problematic.append({'id': e.id, 'name': ed.get('name'), 'date': ed.get('date'), 'dept_id': did})

    return render_template('fix_events.html', events=problematic, departments=dept_list, message=message)


# -------------------- Registration API --------------------
@app.route('/api/register', methods=['POST'])
def api_register():
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({'status': 'fail', 'error': 'No data provided'}), 400

        # Extract participant info with flexible keys
        participant_data = {
            'name': (data.get('name') or data.get('participant-name') or '').strip(),
            'email': (data.get('email') or data.get('participant-email') or '').strip().lower(),
            'phone': (data.get('phone') or data.get('participant-phone') or '').strip(),
            'college': (data.get('college') or data.get('participant-college') or '').strip(),
            'branch': (data.get('branch') or data.get('branch/Class') or data.get('participant-branch') or '').strip(),
            'year': (data.get('year') or data.get('participant-year') or '').strip(),
            'created_at': datetime.utcnow()
        }

        # Get event information
        event_id = str(data.get('event_id') or data.get('eventId') or '').strip()
        if not event_id:
            return jsonify({'status': 'fail', 'error': 'Event ID is required'}), 400

        # Validate event exists and get event details
        try:
            ev_doc = db.collection('events').document(event_id).get()
            if not ev_doc.exists:
                return jsonify({'status': 'fail', 'error': 'Event not found'}), 404
            ev = ev_doc.to_dict()
        except Exception as e:
            return jsonify({'status': 'fail', 'error': 'Error fetching event details'}), 500

        # Get department name
        dept_id = ev.get('department') or ev.get('dept_id') or ''
        dept_name = ''
        if dept_id:
            try:
                dept_doc = db.collection('departments').document(str(dept_id)).get()
                if dept_doc.exists:
                    dept_name = dept_doc.to_dict().get('name', '')
                else:
                    dept_name = str(dept_id)
            except Exception:
                dept_name = str(dept_id)

        # Validate transaction ID (optional)
        tx = (data.get('transaction_id') or data.get('transactionId') or '').strip()
        if tx:
            if not re.fullmatch(r'^[A-Za-z0-9]{12,16}$', tx):
                return jsonify({'status': 'fail', 'error': 'Invalid transaction_id format'}), 400

        # Create registration document (NO duplicate checking)
        registration = {
            **participant_data,
            'event_id': event_id,
            'event_name': ev.get('name', ''),
            'department': dept_name,
            'transaction_id': tx,
            'registration_date': datetime.utcnow(),
            'status': 'confirmed'
        }

        # Generate a unique ID for the registration
        reg_id = str(uuid.uuid4())
        
        # Save registration (allow multiple registrations with same email+event)
        db.collection('regists').document(reg_id).set(registration)

        return jsonify({
            'status': 'ok', 
            'saved': True,
            'registration_id': reg_id,
            'message': 'Successfully registered for the event'
        })
        
    except Exception as e:
        return jsonify({'status': 'fail', 'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))

    app.run(host='0.0.0.0', port=port, debug=True)
