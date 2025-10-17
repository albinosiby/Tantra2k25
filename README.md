Flask conversion of the TANTRA static site

What changed
- Added a minimal Flask app (`app.py`) that serves the existing HTML as templates and exposes `/api/data` to return the existing `data/data.json`.
- Added `data_provider.py` which centralizes reading `data/data.json` so future updates can move data source to a DB without changing frontend code.
- Updated frontend JS (`js/script.js` and `js/events.js`) to fetch from `/api/data` instead of the static JSON file.
- Kept all original design, CSS, images and JS logic intact. Templates are exact copies of the HTML files and live under `templates/`.

Quick start (PowerShell)

1. Create a virtual environment (recommended):

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
```

2. Install requirements:

```powershell
pip install -r requirements.txt
```

3. Run the app:

```powershell
python app.py
```

4. Open http://127.0.0.1:5000/ in your browser.

Notes
- Static files are served from the repository root (Flask static_folder set to '.') so paths like `css/style.css`, `js/script.js`, `images/...` continue to work unchanged.
- Registration endpoint `/api/register` is a stub that returns the submitted payload and HTTP 201. Implement server-side validation and persistence when you're ready.

Deploying to Render
-------------------

This project is ready to deploy to Render as a Python web service. The repository includes a `Procfile` which tells Render to start the app with Gunicorn. The repository also contains an `entrypoint.py` that will accept a Firebase service account JSON via an environment variable and write it to disk before the app imports Firebase.

- `Procfile`: `web: gunicorn entrypoint:app --bind 0.0.0.0:$PORT`
- `runtime.txt`: pins the Python runtime to `python-3.11.4` (adjust if you prefer a different version).

Environment variables
- If you want Firestore integration, you can supply credentials in two ways:
	- Upload the JSON file to Render as a secret file and set `GOOGLE_APPLICATION_CREDENTIALS` to its path on the instance.
	- Or, paste the entire service account JSON into the `FIREBASE_SERVICE_ACCOUNT_JSON` secret environment variable. The app (or `start.py` / `entrypoint.py`) will accept the JSON and either use it directly (no temp file required) or write it to disk for the Firebase SDK.

The repository accepts these formats for `FIREBASE_SERVICE_ACCOUNT_JSON`:
- Raw JSON (the normal service account JSON string).
- JSON that contains escaped newlines (it will convert `\\n` to real newlines).
- Base64-encoded JSON (it will attempt to base64-decode the value and parse the result as JSON).

Render-specific notes
- Ensure `requirements.txt` is present (this repo contains one). Render will install these packages during build.
- The app exposes a top-level Flask `app` object in `app.py`, which Gunicorn uses via `entrypoint:app`.

Quick Render steps (outline)
1. Create a new Web Service on Render, connect your repository.
2. For Environment, choose Python and the branch to deploy.
3. Build Command: leave blank (Render will use pip install -r requirements.txt). If you need a custom build step, set it here.
4. Start Command: leave blank (Render will use the `Procfile`).
5. Add Environment Variables: Render provides `PORT`. Add `FIREBASE_SERVICE_ACCOUNT` (paste JSON) or set `GOOGLE_APPLICATION_CREDENTIALS` if you uploaded the JSON as a secret file.

If you'd like, I can also add a small convenience script or `.env.example` to make local testing with `FIREBASE_SERVICE_ACCOUNT` easier.
