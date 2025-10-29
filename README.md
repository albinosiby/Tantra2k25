Tantra 2k25 — TechFest Website (Flask)
I'll create a beautifully designed README.md file for your TechFest website that showcases your project professionally.

markdown
# 🚀 Tantra 2k25 — TechFest Website

<div align="center">

![Tantra TechFest](https://img.shields.io/badge/Tantra-2k25-blue?style=for-the-badge&logo=starship)
![Flask](https://img.shields.io/badge/Flask-2.3.3-green?style=for-the-badge&logo=flask)
![Python](https://img.shields.io/badge/Python-3.9+-yellow?style=for-the-badge&logo=python)
![Render](https://img.shields.io/badge/Hosted-Render-blue?style=for-the-badge&logo=render)

**Live Site**: 🌐 [https://techfest.vjec.in](https://techfest.vjec.in)

*A dynamic Flask-powered website for Vimal Jyothi Engineering College's annual tech fest*

</div>

## ✨ Features

- 🎯 **Modern Flask Architecture** - Clean, scalable backend structure
- 🎨 **Responsive Design** - Beautiful UI that works on all devices
- ⚡ **Fast Performance** - Optimized static asset delivery
- 🔧 **Easy Configuration** - Simple environment setup
- 📱 **API Ready** - RESTful endpoints for dynamic content
- 🚀 **Production Ready** - Deployed and live on Render

## 🏗️ Project Structure
Tantra2k25/
├── app.py # Flask development server
├── entrypoint.py # Production entry point
├── start.py # Optional startup helpers
├── data_provider.py # Centralized data management
├── config.py # App configuration
├── templates/ # Jinja2 templates
│ ├── index.html
│ ├── events.html
│ └── [other templates]
├── static/ # Static assets
│ ├── css/
│ ├── js/
│ ├── images/
│ └── fonts/
├── requirements.txt # Python dependencies
├── Procfile # Render deployment config
├── runtime.txt # Python version specification
└── README.md

text

## 🚀 Quick Start

### Prerequisites
- Python 3.9 or higher
- Git

### Installation & Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/tantra2k25.git
   cd tantra2k25
Create virtual environment (Windows PowerShell)

powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
Install dependencies

powershell
pip install -r requirements.txt
Run development server

powershell
python app.py
Open your browser
Navigate to http://127.0.0.1:5000/

# 🔧 Configuration
Environment Variables
For Firebase integration (optional), set one of these:

Variable	Description
FIREBASE_SERVICE_ACCOUNT_JSON	Service account JSON text
GOOGLE_APPLICATION_CREDENTIALS	Path to credentials file
Supported JSON formats:

Raw JSON string

JSON with escaped newlines

Base64-encoded JSON

## 📡 API Endpoints
Endpoint	Method	Description
/api/data	GET	Returns structured site data
/api/register	POST	Registration endpoint (stub)
## 🚀 Deployment
Production on Render
The app is live at https://techfest.vjec.in

Render Configuration:

Environment: Python

Build Command: (empty - uses requirements.txt)

Start Command: (empty - uses Procfile)

Python Version: Specified in runtime.txt

Local Production Testing
powershell
pip install gunicorn
gunicorn entrypoint:app --bind 0.0.0.0:5000
## 🛠️ Development
Key Components
app.py - Main Flask application with routes

data_provider.py - Centralized data loading and management

templates/ - Jinja2 templates for dynamic content

static/ - All CSS, JavaScript, images, and fonts

Adding New Features
New Routes: Add to app.py

Templates: Create in templates/ directory

Static Assets: Place in static/ with organized subdirectories

Data: Update data_provider.py for new structured content

## 🐛 Troubleshooting
Issue	Solution
Static assets 404	Check paths in static/ directory
Firebase errors	Verify credentials format and environment variables
Render deployment fails	Ensure binding to 0.0.0.0:$PORT
Import errors	Verify virtual environment activation
## 🤝 Contributing
We welcome contributions! Please:

Fork the repository

Create a feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

## 👨‍💻 Developer
Albino Siby
Web/Mobile App Developer

📧 Email: albinosiby775@gmail.com

💼 LinkedIn: Albino Siby

🐙 GitHub: albinosiby

## 📄 License
This project is developed for Vimal Jyothi Engineering College. All rights reserved.

<div align="center">
Built with ❤️ for Vimal Jyothi Engineering College

Part of the Tantra 2k25 TechFest celebration

https://img.shields.io/badge/VJEC-Tantra%25202k25-red?style=for-the-badge
https://img.shields.io/badge/Made%2520with-Flask-lightgrey?style=for-the-badge

</div> ```
