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
curr_link = os.environ.get('CURR_LINK', "http://127.0.0.1:5000")


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
_sa_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON')
_sa_file = os.environ.get('FIREBASE_CREDENTIALS_FILE', 'techfestadmin-a2e2c-firebase-adminsdk-fbsvc-8fc9d6e2e5.json')

cred = None
if _sa_json:
    try:
        sa_info = json.loads(_sa_json) if isinstance(_sa_json, str) else _sa_json
        cred = credentials.Certificate(sa_info)
    except Exception as e:
        raise RuntimeError('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: ' + str(e))
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

    parts = list(db.collection('participants').stream())
    total_registrations = len(parts)
    unique_participants = set()
    for pdoc in parts:
        p = pdoc.to_dict()
        ident = (p.get('email') or p.get('phone') or pdoc.id)
        if ident:
            unique_participants.add(str(ident).strip().lower())
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

    dept_list = [(d.id, d.to_dict().get('name', ''), d.to_dict().get('logo_url', '')) for d in depts]

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
        from data_provider import get_data
        data = get_data()
        return jsonify(data)
    except Exception as e:
        # As a fallback, attempt to read local data file directly
        try:
            import json as _json, os as _os
            data_path = _os.path.join(_os.path.dirname(__file__), 'data', 'data.json')
            with open(data_path, 'r', encoding='utf-8') as f:
                raw = _json.load(f)
            # normalize minimally
            return jsonify({'departments': raw.get('departments', []), 'events': raw.get('events', [])})
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

        status = int(request.form.get('status', '1'))
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
    current = ev.get('status', 1)
    new_status = 0 if current == 1 else 1
    db.collection('events').document(event_id).update({'status': new_status})
    return redirect(url_for('index'))


def _resolve_participant_from_registration(reg_data: dict) -> Dict:
    if not reg_data or not isinstance(reg_data, dict):
        return None

    inline = reg_data.get('participant')
    if inline and isinstance(inline, dict):
        return inline

    pid = reg_data.get('participant_id') or reg_data.get('user_id') or reg_data.get('uid')
    if pid:
        ref = db.collection('participants').document(pid).get()
        if ref.exists:
            return ref.to_dict()
        ref2 = db.collection('users').document(pid).get()
        if ref2.exists:
            return ref2.to_dict()

    email = reg_data.get('participant_email') or reg_data.get('email') or reg_data.get('user_email')
    if email:
        q = db.collection('participants').where('email', '==', email).limit(1).stream()
        for doc in q:
            return doc.to_dict()
        q2 = db.collection('users').where('email', '==', email).limit(1).stream()
        for doc in q2:
            return doc.to_dict()
    return None


@app.route('/view_participants', methods=['GET'])
def view_participants():
    departments = db.collection('departments').stream()
    dept_list = [(dept.id, dept.to_dict()['name']) for dept in departments]
    dept_map = {d[0]: d[1] for d in dept_list}

    selected_dept_id = request.args.get('dept_id')
    selected_event_id = request.args.get('event_id')
    sort_by_event = bool(selected_event_id)
    participants_info: List[Dict] = []

    parts = db.collection('participants').stream()

    selected_dept_name = None
    if selected_dept_id:
        ddoc = db.collection('departments').document(selected_dept_id).get()
        if ddoc.exists:
            selected_dept_name = ddoc.to_dict().get('name')

    for pdoc in parts:
        p = pdoc.to_dict()
        p_dept = p.get('department') or ''
        p_event = p.get('event') or ''
        if selected_dept_name and p_dept != selected_dept_name:
            continue
        if selected_event_id and p_event != selected_event_id:
            continue

        participants_info.append({
            'name': p.get('name'),
            'email': p.get('email'),
            'phone': p.get('phone'),
            'college': p.get('college'),
            'branch': p.get('branch'),
            'year': p.get('year'),
            'event_name': p_event,
            'dept_name': p_dept,
            'event_id': '',
            'transaction_id': p.get('transactionId') or p.get('transaction_id')
        })

    if sort_by_event:
        participants_info = sorted(participants_info, key=lambda r: (r.get('dept_name', ''), r.get('event_name', ''), r.get('name', '')))
    else:
        participants_info = sorted(participants_info, key=lambda r: (r.get('dept_name', ''), r.get('name', '')))

    if selected_dept_id:
        ev_q = db.collection('events').where('department', '==', selected_dept_id).stream()
    else:
        ev_q = db.collection('events').stream()
    events_for_select = [(e.to_dict().get('name'), e.to_dict().get('name')) for e in ev_q]

    return render_template('view_participants.html',
                           departments=dept_list,
                           participants=participants_info,
                           selected_dept_id=selected_dept_id,
                           selected_event_id=selected_event_id,
                           events_for_select=events_for_select)


def _gather_participants(dept_id: str, event_id: str = None) -> List[Dict]:
    rows: List[Dict] = []
    if not dept_id:
        return rows

    event_ids = []
    event_map = {}
    if event_id:
        ev_doc = db.collection('events').document(event_id).get()
        if ev_doc.exists:
            event_ids = [ev_doc.id]
            event_map[ev_doc.id] = ev_doc.to_dict()
    else:
        events = db.collection('events').where('department', '==', dept_id).stream()
        for e in events:
            event_ids.append(e.id)
            event_map[e.id] = e.to_dict()

    if not event_ids:
        return rows

    BATCH = 10
    for i in range(0, len(event_ids), BATCH):
        batch_ids = event_ids[i:i+BATCH]
        regs_query = db.collection('registrations').where('event_id', 'in', batch_ids).stream()
        for reg in regs_query:
            reg_data = reg.to_dict()
            p = _resolve_participant_from_registration(reg_data)
            if not p:
                continue
            ev_id = reg_data.get('event_id')
            ev_data = event_map.get(ev_id, {})
            rows.append({
                'name': p.get('name'),
                'email': p.get('email'),
                'phone': p.get('phone'),
                'college': p.get('college'),
                'branch': p.get('branch'),
                'year': p.get('year'),
                'event_name': ev_data.get('name'),
                'dept_name': ev_data.get('department') or ev_data.get('dept_id') or '',
                'event_id': ev_id,
                'transaction_id': reg_data.get('transaction_id')
            })

    return rows


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

    q = db.collection('participants')
    if dept_name:
        q = q.where('department', '==', dept_name)
    if event_name:
        q = q.where('event', '==', event_name)
    rows = []
    for doc in q.stream():
        p = doc.to_dict()
        rows.append({
            'name': p.get('name', ''),
            'email': p.get('email', ''),
            'phone': p.get('phone', ''),
            'college': p.get('college', ''),
            'branch': p.get('branch', ''),
            'year': p.get('year', ''),
            'event_name': p.get('event', ''),
            'dept_name': p.get('department', ''),
            'transaction_id': p.get('transactionId') or p.get('transaction_id', '')
        })

    rows = sorted(rows, key=lambda r: (r.get('dept_name', ''), r.get('event_name', ''), r.get('name', '')))

    headers = ['name', 'email', 'phone', 'college', 'branch', 'year', 'event_name', 'dept_name', 'transaction_id']

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


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
