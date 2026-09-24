# SecureAudit: Website Security Audit & Vulnerability Scanner

A web application that runs automated, non-intrusive security audits of websites, scores them from 0 to 100, and produces reports with remediation guidance (Apache and Nginx snippets included).

It is built for developers, system administrators and teams that need periodic website security checks. It performs **defensive checks only**: no exploitation, no brute-forcing, no denial-of-service testing.

---

## Features

- **Security scanner** (Python) with independent check modules:
  HTTP security headers, SSL/TLS, cookies, information disclosure, directory listing, sensitive file exposure, HTTP methods, redirects, server info, DNS and email security (SPF, DKIM, DMARC), performance, CMS detection, WordPress, CodeIgniter, PHP, Apache/Nginx audits, Linux hardening tips, Cloudflare.
- **Security score** (0 to 100) after every scan, with bands: Excellent, Good, Needs Improvement, High Risk, Critical.
- **Dashboard** with totals, severity counts, SSL expiry alerts and charts (risk distribution, score trend, categories, SSL timeline, monthly scans).
- **Scan history** and **comparison** between two scans (resolved, recurring, new issues).
- **Reports** in PDF, Excel and CSV: Executive, Technical, Compliance, Vulnerability, Remediation and Trend.
- **Remediation knowledge base** with step-by-step fixes and copy-ready Apache / Nginx configuration.
- **Scheduler**: manual, daily, weekly and monthly scans.
- **Notifications** (in-app and email): scan completed, scan failed, critical findings, new high-risk issues, SSL certificate expiry.
- **Role-based access control** and user management.
- **Settings page** for scan timeout, retries, scheduler interval, SSL check hour and notification toggles.

---

## Tech stack

| Part | Technology |
|---|---|
| Backend API | Node.js, Express 5 |
| Database | MySQL with Sequelize ORM |
| Scanner engine | Python 3 (requests, BeautifulSoup, dnspython) |
| Frontend | React 19, Vite, Tailwind CSS, React Query, Recharts |
| Auth | JWT in an httpOnly cookie, bcrypt password hashing |
| Reports | PDFKit, ExcelJS |
| Scheduling | node-cron |
| Email | Nodemailer |

---

## Project structure

```
website-security-audit/
├── server.js                 # Entry point: DB connection, scheduler, HTTP server
├── package.json
├── .env                      # Your local configuration (not committed)
├── src/
│   ├── app.js                # Express app and route mounting
│   ├── config/db.js          # Sequelize / MySQL connection
│   ├── controllers/          # Request handlers
│   ├── routes/               # API routes
│   ├── middleware/           # Authentication and role checks
│   ├── models/               # User, Website, Scan, ScanResult, Notification
│   ├── services/             # Scanner runner, scheduler, notifications, email,
│   │                         # report data, remediation knowledge base, settings
│   ├── reports/              # PDF / Excel / CSV generators
│   └── utils/scoring.js      # Score calculation
├── scanner/                  # Python scanner
│   ├── scanner.py            # Runs all checks and prints JSON
│   ├── requirements.txt
│   └── checks/               # One file per check module
└── frontend/                 # React application
```

---

## Prerequisites

Install these first:

- **Node.js** 20 or newer
- **Python** 3.10 or newer (make sure it is added to PATH)
- **MySQL** 8 (Workbench is handy for managing it)

---

## Installation

### 1. Get the code

```bash
git clone https://github.com/Laxmisatanhalli/website-security-audit.git
cd website-security-audit
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Install the Python scanner dependencies

```bash
pip install -r scanner/requirements.txt
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 5. Create the database

In MySQL (Workbench or the command line):

```sql
CREATE DATABASE website_security_scanner;
```

You do not need to create tables. They are created automatically the first time the server starts.

### 6. Create the `.env` file

Create a file named `.env` in the project root (next to `server.js`):

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=website_security_scanner
DB_USER=root
DB_PASSWORD=your_mysql_password

# Authentication: use a long random string (at least 32 characters)
JWT_SECRET=replace-this-with-a-long-random-string

# Python command used to run the scanner.
# On Windows this is usually "python"; on Linux/macOS "python3".
PYTHON_BIN=python

# Frontend URL allowed to call the API (recommended)
CORS_ORIGIN=http://localhost:5173

# Email (optional). If left out, emails are skipped and only in-app
# notifications are created.
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
SMTP_FROM=security-scanner@example.com

# Development only: allow scanning localhost / private addresses
# ALLOW_PRIVATE_TARGETS=true
```

Never commit `.env`. It is already listed in `.gitignore`.

---

## Running the application

Use two terminals.

**Terminal 1: backend** (from the project root):

```bash
npm run dev
```

You should see: `mysql connected`, `Tables synced`, the scheduler message, and `Server is running on port 3000`.

**Terminal 2: frontend:**

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

### Production build (single server)

```bash
cd frontend
npm run build      # outputs to ../public
cd ..
npm start          # Express serves the built frontend and the API on port 3000
```

Then open **http://localhost:3000**.

---

## First login: creating an administrator

New accounts are created with the **Viewer** role, so the first administrator must be promoted once in the database.

1. Open `http://localhost:5173/register` and create an account.
2. Promote it in MySQL:

```sql
USE website_security_scanner;
UPDATE users SET role = 'Administrator' WHERE email = 'your@email.com';
```

3. Log out and log in again.

After that, administrators can create users and change roles from the **Users** page, with no more SQL needed.

---

## User roles

| Role | What they can do |
|---|---|
| **Administrator** | Everything: manage users, settings, all websites, scans and reports |
| **Security Analyst** | Add and edit their own websites, run scans, view and download reports, compare scans |
| **Viewer** | Read-only: view all websites, scans, dashboard and reports; cannot add websites or start scans |

---

## How to use it

1. **Add a website:** Websites, then Add website. Enter a name, URL, environment and scan frequency.
2. **Run a scan:** click **Scan now**. A full scan can take up to a minute or two.
3. **Review results:** open the scan to see findings grouped by module, with severity and recommendations.
4. **Download a report:** choose a report type and format (PDF, Excel, CSV) on the website or scan page. The **Remediation** report contains step-by-step fixes and configuration snippets.
5. **Compare scans:** on a website's page, tick two scans in the history to see resolved and new findings.
6. **Automate:** set the scan frequency to Daily, Weekly or Monthly. The scheduler runs while the backend is running.

### Scan frequency

- **Manual:** scans only run when you click Scan now.
- **Daily / Weekly / Monthly:** the scheduler scans the website automatically.

### Security scoring

Each finding subtracts points from 100: Critical 20, High 10, Medium 5, Low 2, Info 0.

| Score | Category |
|---|---|
| 90 to 100 | Excellent |
| 75 to 89 | Good |
| 50 to 74 | Needs Improvement |
| 25 to 49 | High Risk |
| 0 to 24 | Critical |

### Settings (Administrator)

| Setting | Meaning |
|---|---|
| Scan timeout | Maximum seconds a whole scan may run (30 to 900, default 300) |
| Scan retries | Extra attempts if a scan fails (0 to 5) |
| Scheduler interval | Minutes between checks for due scans (1 to 59) |
| SSL expiry check hour | Hour of day for the daily SSL expiry check (server time) |
| Email / In-app notifications | Turn each delivery channel on or off |

Settings are stored in `src/config/settings.json`.

---

## Responsible use

Only scan websites you own or have written permission to test. Scanning other people's sites without permission may be illegal. For practice, use sites intended for testing.

The application refuses to add `localhost` and private network addresses as targets, to prevent the scanner being used against internal systems. Set `ALLOW_PRIVATE_TARGETS=true` in `.env` for local development only.

---

## API overview

All routes are under `/api` and require login (cookie), except register and login.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Websites | `GET/POST /websites`, `GET/PUT/DELETE /websites/:id`, `PATCH /websites/:id/status` |
| Scans | `POST /scans`, `GET /scans`, `GET /scans/:id`, `GET /scans/compare` |
| Dashboard | `GET /dashboard/overview`, `/dashboard/upcoming-scans`, `/dashboard/charts/*` |
| Reports | `GET /reports/:scanId?type=&format=`, `GET /reports/trend/:websiteId` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |
| Users (admin) | `GET/POST /users`, `PUT/DELETE /users/:id`, `PATCH /users/:id/reset-password` |
| Settings | `GET /settings`, `PUT /settings` (admin) |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot find module ...` on start | Run `npm install` in the project root. Check the file name in the error exactly matches the file on disk. |
| Scans fail with "Failed to start scanner process" | Set `PYTHON_BIN` in `.env` (`python` on Windows) and run `pip install -r scanner/requirements.txt`. |
| Scan fails with "Scan timed out" | Raise **Scan timeout** in Settings. |
| Scan says the website is unreachable | The site may be down or blocking requests. Try another site, for example `https://example.com`. |
| `ER_TOO_MANY_KEYS` when the server starts | Duplicate indexes were created by an earlier `sync({ alter: true })`. Drop the numbered duplicate indexes (`email_2`, `username_2`, ...) from the `Users` table. |
| Login works but pages show "Forbidden" | Your role is Viewer. Promote the account to `Administrator` (see First login). |
| Changed role has no effect | Log out and log in again. |
| `mysql connected` never appears | Check `DB_*` values in `.env` and that MySQL is running. |
| Port 3000 already in use | Stop the other program, or change the port in `server.js`. |

---

## Scope note

This project focuses on defensive security auditing. The scanner performs non-intrusive checks for misconfigurations, exposed resources and best-practice compliance. It does not include exploitation, injection testing, brute-forcing or denial-of-service testing.