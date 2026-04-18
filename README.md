# Autonomous Insurance Claims Processing Agent

> Drop a PDF. Get a routing decision in seconds.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-brightgreen)](https://pdfscraper-frontend.vercel.app/)
[![Demo Video](https://img.shields.io/badge/Demo-YouTube-red)](https://youtu.be/T9y0GnJjy9o)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-black)](https://github.com/rohitranvir/pdfscraper)
[![Portfolio](https://img.shields.io/badge/Portfolio-Rohit%20Ranvir-blue)](https://rohit-portfolio-8zoh.vercel.app/)

---

## The Problem

Insurance teams waste hours on work that shouldn't require humans at all — reading incoming PDFs, manually retyping claimant details into systems, and figuring out which department should handle each case.

A single claim can sit in someone's inbox for hours before it even gets looked at. Multiply that across hundreds of daily submissions and you've got a serious bottleneck — delayed payouts, frustrated customers, and skilled investigators spending their day on data entry.

This project eliminates that bottleneck. An AI agent reads the document, structures the data, validates it, and routes the claim — in seconds, not hours.

---

## Live Links

| Resource | URL |
|----------|-----|
| 🌐 Live App | https://pdfscraper-frontend.vercel.app/ |
| 🎥 Demo Video | https://youtu.be/T9y0GnJjy9o |
| 💻 GitHub Repo | https://github.com/rohitranvir/pdfscraper |
| 🗂 Portfolio | https://rohit-portfolio-8zoh.vercel.app/ |

---

## How It Works

```
PDF Upload → Text Extraction → AI Structuring → Validation → Routing → Audit Log
```

### Step-by-step

**1. Upload**
A worker drags and drops an incoming claim PDF onto the web interface. Works with any standard insurance claim document.

**2. Text Extraction**
`pdfplumber` opens the file and pulls all raw text out — no OCR required for digital PDFs.

**3. AI Structuring**
The extracted text goes to Groq's LLaMA 3.3 (70B) via a structured prompt. The model reads the unstructured content and returns clean, organized fields:
- Claim number
- Claimant name and contact
- Policy number
- Incident date and description
- Claim type (injury / property / auto)
- Estimated damage amount

**4. Validation**
The system checks two things:
- Are all mandatory fields present and extracted?
- Does the incident description contain any fraud keywords?

**5. Routing**
Based on the validated data, the claim is immediately assigned a route and priority (see routing table below).

**6. Audit Log**
Every processed claim — including the AI output, validation result, and routing decision — is saved to a SQLite database. Full audit trail, no guesswork.

---

## Routing Rules

Claims are routed based on a strict priority ladder. The first condition that matches wins.

| Priority | Condition | Route |
|----------|-----------|-------|
| 1 — Highest | `incident_description` contains a fraud keyword | 🚨 Investigation Flag |
| 2 | Any mandatory field is missing or not extracted | 📋 Manual Review |
| 3 | `claim_type` == `"injury"` | 🏥 Specialist Queue |
| 4 | `estimated_damage` < ₹25,000 | ⚡ Fast-track |
| 5 — Default | All fields present, damage ≥ ₹25,000, no injury | 📁 Standard Review |

**Fraud keywords:** `fraud`, `inconsistent`, `staged`, `fake`, `fabricated`

**Mandatory fields:** `claim_number`, `claimant_name`, `policy_number`, `incident_date`, `incident_description`, `claim_type`, `estimated_damage`

---

## Features

### Document Upload
Drag-and-drop interface built with React. Works with the same PDF files teams already receive — no reformatting needed.

### AI-Powered Extraction
LLaMA 3.3 70B via Groq reads unstructured claim text and returns structured JSON. Customers can write naturally in any format — the AI handles the parsing.

### Missing Field Detection
Before routing, the system checks every mandatory field. Incomplete claims are flagged immediately for manual review rather than silently passed through with missing data.

### Fraud Keyword Scanning
The incident description is scanned for a predefined list of fraud indicators. Any match automatically escalates the claim to investigation — no human required to catch it first.

### Automated Claim Routing
Rules-based routing engine assigns every claim to the right queue in milliseconds. Minor claims get fast-tracked. Complex or suspicious ones go to specialists or investigators.

### 4 Quick Test Scenarios
Built-in demo scenarios — Auto Accident, Medical Bill, Property Damage, Policy Fraud — let you test the full pipeline without uploading real documents. Useful for training new staff without touching live data.

### Audit Log
Every claim is persisted to SQLite with its full extracted data, validation outcome, and routing decision. Managers get a clear record of why each claim was handled the way it was.

---

## Tech Stack

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.10+ | Core language |
| FastAPI | 0.136 | REST API framework |
| Uvicorn | 0.44 | ASGI server |
| Groq API (LLaMA 3.3 70B) | — | AI extraction and structuring |
| pdfplumber | 0.11 | PDF text extraction |
| SQLAlchemy | 2.0 | ORM / database layer |
| aiosqlite | 0.22 | Async SQLite driver |
| Pydantic v2 | 2.x | Request/response validation |

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18 | UI framework |
| Vite | 8 | Build tool and dev server |
| Tailwind CSS | 3.x | Styling |
| Axios | latest | HTTP client |
| Lucide React | latest | Icons |
| React Router DOM | 6 | Client-side routing |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Render | Backend hosting (FastAPI) |
| Vercel | Frontend hosting (React) |
| SQLite | Persistent claim log |

---

## Project Structure

```
PDFscrapper/
├── backend/
│   ├── main.py               # FastAPI app, routes, CORS
│   ├── models/               # Pydantic schemas and DB models
│   ├── routers/              # API route handlers
│   ├── services/             # AI extraction, routing logic
│   ├── requirements.txt
│   ├── .env.example
│   └── Procfile
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Route pages
│   │   └── main.jsx
│   ├── .env.example
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher + npm
- Git
- A free Groq API key

### Getting a Groq API Key

1. Go to [console.groq.com/keys](https://console.groq.com/keys)
2. Sign in or create a free account
3. Click **Create API Key** and copy it

Groq offers free inference on LLaMA 3.3 — no credit card needed to get started.

---

## Local Setup

### Backend

```bash
# 1. Navigate to backend
cd backend

# 2. Create and activate virtual environment
python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
copy .env.example .env        # Windows
cp .env.example .env          # macOS / Linux

# 5. Open .env and add your key
# GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
# GROQ_MODEL=llama-3.3-70b-versatile
# DATABASE_URL=sqlite+aiosqlite:///./claims.db

# 6. Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API and interactive docs available at: **http://localhost:8000/docs**

### Frontend

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Set up environment variables
copy .env.example .env        # Windows
cp .env.example .env          # macOS / Linux

# 4. Set your backend URL in .env
# VITE_API_URL=http://localhost:8000

# 5. Start the dev server
npm run dev
```

App available at: **http://localhost:5173**

---

## Deployment

### Backend → Render

1. Go to [render.com](https://render.com) → New Web Service → connect GitHub repo
2. Set **Root Directory** to `backend`
3. Set **Build Command:** `pip install -r requirements.txt`
4. Set **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables:
   - `GROQ_API_KEY` = your key
   - `GROQ_MODEL` = `llama-3.3-70b-versatile`
   - `DATABASE_URL` = `sqlite+aiosqlite:///./claims.db`
6. Deploy

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → import repo
2. Set **Root Directory** to `frontend`
3. Framework: **Vite** | Build: `npm run build` | Output: `dist`
4. Add environment variable:
   - `VITE_API_URL` = your Render backend URL
5. Deploy

> **Note:** Render's free tier spins down after 15 minutes of inactivity. Use [UptimeRobot](https://uptimerobot.com) (free) to ping `/health` every 5 minutes and keep it alive.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/claims/upload` | Upload a PDF and process it |
| `POST` | `/claims/demo` | Run a quick demo scenario |
| `GET` | `/claims/history` | Fetch all processed claims |
| `GET` | `/health` | Health check endpoint |

Full interactive docs at: **https://pdfscraper-backend.onrender.com/docs**

---

## Environment Variables

### Backend (`.env`)

```env
# Groq API key — https://console.groq.com/keys
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

# LLM model
GROQ_MODEL=llama-3.3-70b-versatile

# SQLite database path
DATABASE_URL=sqlite+aiosqlite:///./claims.db
```

### Frontend (`.env`)

```env
# Backend API URL
VITE_API_URL=http://localhost:8000
```

---

## Author

**Rohit Ranvir**
Junior Developer — Python, FastAPI, React, LLM Integration

- 📧 rohitranveer358@gmail.com
- 📱 +91 9158000676
- 🌐 https://rohit-portfolio-8zoh.vercel.app/
- 💻 https://github.com/rohitranvir

---

## License

MIT License — free to use, modify, and distribute.