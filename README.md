# Autonomous Insurance Claims Processing Agent

> An intelligent, tireless digital mailroom that instantly extracts, organizes, and routes incoming insurance claims using AI.

## The Problem
Insurance companies are constantly drowning in messy paperwork and unorganized emails. Human workers currently waste countless hours just reading incoming documents, copying that data into other software, and guessing which department should handle it next. 

This program solves that bottleneck by doing the reading, organizing, and sorting in a matter of seconds, meaning customers get their money faster while human agents can focus on complex investigations instead of basic data entry.

## Features

* **Document Upload:** Users can quickly drag and drop incoming insurance claim files directly into the web interface.
* **Smart Text Reading:** The system instantly looks inside digital documents to grab the raw text without any human typing.
* **AI-Powered Understanding:** An artificial intelligence acts like a human reader to pluck out crucial details like the claimant's name, phone number, and estimated damage.
* **Missing Information Check:** It automatically scans the captured data to see if any mandatory details were forgotten by the customer.
* **Automated Claim Sorting:** The system uses a strict set of rules to instantly categorize the severity of the claim and decide where it should go next.
* **Quick Test Scenarios:** Users can click a button to test out four different fake claims immediately, without needing to upload real files.
* **Digital Record Keeping:** Every processed claim is automatically saved into a secure log so managers can see past activity.

## How It Works Step-by-Step

1. **Upload:** A worker drops an insurance claim document onto the web page.
2. **Read:** The software peels open the document and extracts all the messy, unorganized text hidden inside.
3. **Understand:** The artificial intelligence reads the story and neatly organizes the details (like dates, names, and money) into a clean digital form.
4. **Double-Check:** The core rules check the organized data to see if anything is missing or if the description contains suspicious words.
5. **Decide:** The system immediately displays an action plan for the claim alongside all the freshly organized customer details.

## Why Each Feature Matters in the Real World

* **Document Upload** makes it incredibly simple for employees to start working using the typical files they already receive.
* **Smart Text Reading** eliminates the daily drudgery of employees manually retyping long incident reports.
* **AI-Powered Understanding** allows customers to explain their accident naturally in an email or letter, rather than forcing them to fill out confusing web forms.
* **Missing Information Check** stops incomplete claims in their tracks immediately, preventing weeks of frustrating back-and-forth emails.
* **Automated Claim Sorting** ensures minor bumper scratches are approved fast, while suspicious or high-dollar claims go straight to veteran investigators.
* **Quick Test Scenarios** allow managers to safely train new agents on the software without accidentally processing live data.
* **Digital Record Keeping** provides an unquestionable audit trail, proving exactly why the company made its initial routing decision.

## Screenshots

*(Insert screenshots of the UI, DropZone, and Results Table here)*

## Tech Stack

| Layer        | Technology                          | Version  |
|--------------|-------------------------------------|----------|
| Frontend     | React + Vite                        | 18 / 8   |
| Styling      | Tailwind CSS                        | 3.x      |
| HTTP Client  | Axios                               | latest   |
| Icons        | Lucide React                        | latest   |
| Routing (FE) | React Router DOM                    | 6        |
| Backend      | FastAPI + Uvicorn                   | 0.136 / 0.44 |
| LLM          | Groq API — llama-3.3-70b-versatile  | —        |
| PDF Parsing  | pdfplumber                          | 0.11     |
| Database     | SQLite via SQLAlchemy + aiosqlite   | 2.0 / 0.22 |
| Validation   | Pydantic v2                         | 2.x      |
| Language     | Python 3.10+, Node 18+              | —        |

## Routing Rules

| Priority | Condition                                              | Route               |
|----------|--------------------------------------------------------|---------------------|
| 1 (highest) | `incident_description` contains a fraud keyword    | Investigation Flag  |
| 2           | Any mandatory field is missing or not extracted    | Manual Review       |
| 3           | `claim_type` == `"injury"`                         | Specialist Queue    |
| 4           | `estimated_damage` < 25,000                        | Fast-track          |
| 5 (default) | All fields present, damage ≥ 25,000, no injury     | Standard Review     |

**Fraud keywords:** `fraud`, `inconsistent`, `staged`, `fake`, `fabricated`  
**Mandatory fields:** `claim_number`, `claimant_name`, `policy_number`, `incident_date`, `incident_description`, `claim_type`, `estimated_damage`

## Prerequisites

- **Python** 3.10 or higher
- **Node.js** 18 or higher + npm
- **Git**

## How to Get Your Groq API Key

This project relies on Groq's insanely fast LLM inference (using LLaMA 3.3). You will need a free API key to run it:
1. Go to [console.groq.com/keys](https://console.groq.com/keys).
2. Sign in or create an account.
3. Click "Create API Key" and copy the generated key.

## Setup Instructions

### Backend Setup

```bash
# 1. Navigate to the backend folder
cd backend

# 2. Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1       # Windows PowerShell
# source .venv/bin/activate      # macOS / Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
copy .env.example .env           # Windows
# cp .env.example .env           # macOS / Linux

# 5. Open .env and paste your Groq API key:
# GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

# 6. Start the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*API available at http://localhost:8000/docs*

### Frontend Setup

```bash
# 1. Navigate to the frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Configure environment variables
copy .env.example .env           # Windows
# cp .env.example .env           # macOS / Linux

# 4. Start the frontend dev server
npm run dev
```
*App available at http://localhost:5173*
