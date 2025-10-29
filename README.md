## Tantra 2k25 — TechFest Website (Flask)

**Live site**: `https://techfest.vjec.in` (hosted on Render, production is live)

This repository contains a Flask-powered version of the TANTRA TechFest site. It serves the existing static assets with Flask templates and exposes minimal API endpoints to power dynamic content.

### Highlights
- **Flask app**: `app.py` provides the web server and routes.
- **Templates**: existing HTML migrated into `templates/` with no design changes.
- **Static assets**: served from `static/` preserving original paths.
- **Data access**: `data_provider.py` centralizes reading structured data.
- **Production-ready**: includes `Procfile`, `runtime.txt`, and `entrypoint.py` for Render + Gunicorn.

## Getting Started (Windows PowerShell)

1) Create and activate a virtual environment

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
```

2) Install dependencies

```powershell
pip install -r requirements.txt
```

3) Run the development server

```powershell
python app.py
```

4) Open the app in your browser: `http://127.0.0.1:5000/`

### Environment Variables
If you enable Firestore/Firebase features, set one of the following on your machine or in your hosting provider:

- `FIREBASE_SERVICE_ACCOUNT_JSON`: the service account JSON text.
- `GOOGLE_APPLICATION_CREDENTIALS`: absolute path to a JSON credentials file on disk.

The code accepts any of these formats in `FIREBASE_SERVICE_ACCOUNT_JSON`:
- Raw JSON string
- JSON with escaped newlines (converts `\\n` to newlines)
- Base64-encoded JSON (auto-decoded)

## API Endpoints
- `GET /api/data` — returns structured site data (sourced by `data_provider.py`).
- `POST /api/register` — stub endpoint that echoes payload and returns 201. Replace with validation + persistence for real registrations.

## Project Structure

```
Tantra2k25/
├─ app.py               # Flask app entry (local dev)
├─ entrypoint.py        # Production entry (used by Gunicorn on Render)
├─ start.py             # Optional startup helpers
├─ data_provider.py     # Centralized data loading
├─ templates/           # Jinja2 templates (migrated HTML)
├─ static/              # CSS, JS, images, fonts
├─ requirements.txt     # Python dependencies
├─ Procfile             # Render/Gunicorn start command
├─ runtime.txt          # Python runtime pin
├─ config.py            # App config (if used)
└─ README.md
```

## Deployment

### Production (Render)
The app is deployed on Render and live at `https://techfest.vjec.in`.

- `Procfile` specifies:
  - `web: gunicorn entrypoint:app --bind 0.0.0.0:$PORT`
- `runtime.txt` pins the Python version (adjust as needed).

Typical Render setup:
1) Create a new Web Service and connect this repository.
2) Environment: Python; leave Build Command empty (Render runs `pip install -r requirements.txt`).
3) Start Command: leave empty (Render will use `Procfile`).
4) Environment variables: Render provides `PORT`. Add Firebase credentials if required (see Environment Variables above).
5) Custom domain: point `techfest.vjec.in` to Render per their DNS instructions. Once verified, enforce HTTPS.

### Local Production Run (optional)
You can simulate production locally with Gunicorn:

```powershell
pip install gunicorn
gunicorn entrypoint:app --bind 0.0.0.0:5000
```

## Troubleshooting
- If static assets 404, ensure paths resolve under `static/` and Flask static config matches.
- If Firebase is enabled, double-check credentials formatting and environment variables.
- On Render, verify `PORT` is not hard-coded; the app must bind to `0.0.0.0:$PORT`.

## Contributing
Open issues and PRs are welcome. Please keep code readable and consistent with the current structure.

## License
If you need a specific license, add it here (e.g., MIT). Otherwise, all rights reserved by the project owners.
