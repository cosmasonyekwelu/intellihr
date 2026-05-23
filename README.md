# IntelliHR: AI-Powered HR & Payroll Automation Platform

IntelliHR is a SaaS platform designed to automate HR administrative duties, attendance logging, monthly payroll computations, and employee leave requests. Integrated with **OpenAI GPT-4o-mini** and **n8n Orchestration**, the platform features a highly conversational AI Agent (RAG) that lets managers and employees query logs using natural language.

---

## 🚀 Key Features

1. **User Authentication & Roles**: JWT-secured login dashboards for Admins, HR Managers, and standard Employees.
2. **Employee CRUD Directory**: Manage active/terminated/on-leave profiles with integrated Slack hiring alerts.
3. **Clock-In / Out Station**: Geolocation-aware clocking nodes that auto-compute lateness status based on a 9:00 AM standard threshold.
4. **Absence Approvals Queue**: Submit leave requests with automatic Employee status modifications upon approval.
5. **Deductions & Payroll Automation**: Runs monthly aggregates (gross pay, tax, pension, bonuses) through local engines or n8n hooks, outputting dynamic PDF payslips.
6. **Intercom-style AI Agent Widget**: Answers natural language questions, queries database parameters via OpenAI Function calling, and charts variance data.

---

## 🛠️ Tech Stack

* **Frontend**: React (TypeScript), Tailwind CSS, Vite, Axios, React Router, Lucide Icons
* **Backend**: Node.js (TypeScript), Express, Mongoose, PDFKit, OpenAI SDK
* **Database**: MongoDB (Mongoose)
* **Automation**: n8n Workflow Orchestrator
* **AI Model**: GPT-4o-mini (Function Calling / Tool calls)

---

## 📦 Getting Started

### 1. Initialize Infrastructure (Docker)
Ensure Docker is running, then boot up the self-hosted n8n and MongoDB containers from the root project directory:
```bash
docker-compose up -d
```
* **MongoDB** runs on: `mongodb://localhost:27017`
* **n8n Engine** runs on: `http://localhost:5678`

---

### 2. Configure Environment Variables
Inside `backend/` create a `.env` file based on `.env.example`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/intellihr
JWT_SECRET=intellihr_default_jwt_secret_key_12345
OPENAI_API_KEY=your_openai_api_key_here

# n8n webhook integration endpoints
N8N_API_KEY=intellihr_static_n8n_api_key_secure_123
N8N_PAYROLL_WEBHOOK_URL=http://localhost:5678/webhook/payroll
N8N_SLACK_WEBHOOK_URL=http://localhost:5678/webhook/slack-alerts
N8N_EMAIL_DIGEST_WEBHOOK_URL=http://localhost:5678/webhook/email-digest
```
*(If `OPENAI_API_KEY` is omitted, the AI Assistant will dynamically fall back to a rich Local Sandbox Mock Engine so you can still test conversational flows).*

---

### 3. Install & Seed Backend
From the `backend/` directory:
```bash
# Install dependencies
npm install

# Seed demo directory (Users, Attendance logs, Leaves)
npm run seed

# Boot up Node Development Server
npm run dev
```

---

### 4. Install & Run Frontend
From the `frontend/` directory:
```bash
# Install dependencies
npm install

# Start Vite server
npm run dev
```
Open **`http://localhost:3000`** in your browser to view the console.

---

## 🔑 Demo Seed Accounts

| Role | Username | Password | Purpose |
|------|----------|----------|---------|
| **HR Manager** | `hr@intellihr.com` | `password123` | Approves leave, executes payroll, full CRUD |
| **Employee** | `employee@intellihr.com` | `password123` | Clocks in/out, requests leave, chats with AI |
| **Admin** | `admin@intellihr.com` | `password123` | Full backend management permissions |

---

## 🤖 AI Conversation Queries to Try

Open the floating bubble on the bottom right and test these:
* *“Why was payroll higher this month?”* (Compares monthly variances, bonuses, and tax deductions)
* *“Summarize attendance issues for this month”* (Queries Attendance collection for late check-ins and absences)
* *“Which employees are underperforming?”* (Extracts database profiles with rating <= 2)
* *“Generate HR report for management”* (Compiles a digest on active employees, total historical spend, and present-to-absent percentages)

---

## 🔄 n8n Integration & Webhook Imports

We have provided complete JSON templates inside `n8n/` to configure n8n in seconds:
1. Navigate to **`http://localhost:5678`** in your browser.
2. Create a new workflow, click the top right settings wheel -> **Import from File**.
3. Choose a template:
   * **`payroll-workflow.json`**: Scheduled calculations, PDF compilation, and emails.
   * **`whatsapp-agent-workflow.json`**: Connects Twilio SMS sandboxes to OpenAI agents.
   * **`slack-alerts-workflow.json`**: Posts instant hiring notifications to a Slack channel.
   * **`email-digest-workflow.json`**: Sends pending HR leave summaries to email leads.
4. **Secure Webhooks**: To protect endpoints from external queries, all HTTP headers are configured with:
   * Header Key: `X-API-Key`
   * Header Value: `intellihr_static_n8n_api_key_secure_123` (Set in `.env`)
