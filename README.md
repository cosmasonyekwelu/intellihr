# IntelliHR

IntelliHR is a multi-tenant HR and payroll SaaS platform built with React, TypeScript, Tailwind CSS, Node.js, Express, MongoDB, Mongoose, n8n, and OpenAI.

Each company is created by an HR Manager during signup. All business data is scoped by `companyId`, which is issued in the JWT and applied to backend queries for employees, attendance, leave, payroll, profiles, and AI conversations.

## Tenant Rules

- Only two roles exist: `hr` and `employee`.
- There is no admin role.
- There is no seed data and no default user.
- Employees cannot sign up directly.
- HR Managers create companies through `/signup`.
- Employees join only from HR-generated invitation links.
- Every tenant-owned query must include `companyId` from the authenticated user.
- Employees can only access their own attendance, leave, payroll, and profile data.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React
- Backend: Node.js, TypeScript, Express
- Database: MongoDB and Mongoose
- Automation: n8n workflow templates
- AI: OpenAI API

## Project Structure

```text
backend/   Express API, models, controllers, routes, services
frontend/  React app, pages, layout, reusable UI components
n8n/       Importable workflow JSON templates
```

## Environment

Create `backend/.env` from `backend/.env.example`.

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/intellihr
JWT_SECRET=replace_with_a_strong_jwt_secret
OPENAI_API_KEY=your_openai_api_key_here
FRONTEND_URL=http://localhost:3000

N8N_API_KEY=replace_with_your_n8n_api_key
N8N_WEBHOOK_BASE_URL=http://localhost:5678/webhook
N8N_PAYROLL_WEBHOOK_URL=http://localhost:5678/webhook/payroll
N8N_EMPLOYEE_INVITE_WEBHOOK_URL=http://localhost:5678/webhook/employee-invitation
N8N_PASSWORD_RESET_WEBHOOK_URL=http://localhost:5678/webhook/password-reset
N8N_ATTENDANCE_REMINDER_WEBHOOK_URL=http://localhost:5678/webhook/attendance-reminder
N8N_EMAIL_DIGEST_WEBHOOK_URL=http://localhost:5678/webhook/email-digest

GMAIL_USER=
GMAIL_PASS=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
SLACK_INCOMING_WEBHOOK_URL=
```

## Run Locally

Start MongoDB and n8n:

```bash
docker-compose up -d
```

Install and run the backend:

```bash
cd backend
npm install
npm run dev
```

Install and run the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Fresh Database

This project intentionally ships without seed scripts. To start from an empty local database, drop the `intellihr` database directly in MongoDB before signing up the first HR Manager.

Example:

```bash
mongosh mongodb://127.0.0.1:27017/intellihr --eval "db.dropDatabase()"
```

After that, create the first company through `/signup`.

## First Use Flow

1. Visit `/signup`.
2. Create an HR Manager account with a company name.
3. The backend creates a `Company` and an HR `User` with the same `companyId`.
4. The HR Manager is logged in automatically.
5. Go to Employees and invite employees by email.
6. Employees register through `/register/employee?token=...`.
7. Employee accounts are created with role `employee` and the same `companyId`.

## Authentication Routes

- `POST /api/auth/signup` creates a company and HR user.
- `POST /api/auth/login` returns a JWT containing `userId`, `companyId`, and `role`.
- `POST /api/auth/forgot-password` creates a reset token and triggers n8n email delivery.
- `POST /api/auth/reset-password` updates the password from a reset token.
- `POST /api/auth/change-password` changes the current user's password.
- `GET /api/auth/me` returns the authenticated user.

## Employee Routes

- `GET /api/employees` returns all company employees for HR, or the employee's own record.
- `POST /api/employees/invite` invites an employee. HR only.
- `GET /api/employees/invite/verify?token=...` validates an invitation token.
- `POST /api/employees/register` activates an invited employee.
- `PUT /api/employees/:id` updates a company employee. HR only.
- `DELETE /api/employees/:id` soft-deletes a company employee. HR only.
- `POST /api/employees/:id/promote` records a promotion. HR only.
- `POST /api/employees/:id/transfer` records a department transfer. HR only.
- `POST /api/employees/:id/warning` records a warning. HR only.
- `POST /api/employees/:id/suspend` records a suspension. HR only.
- `POST /api/employees/:id/terminate` terminates employment. HR only.
- `POST /api/employees/resign` submits a resignation request. Employee only.

## Leave, Attendance, Payroll, Profile

- Leave types: `GET`, `POST`, `PUT`, `DELETE /api/leave-types`. HR only.
- Leave requests: `/api/leave/request`, `/api/leave/my-requests`, `/api/leave/pending`, `/api/leave/:id/approve`, `/api/leave/:id/reject`.
- Attendance: `/api/attendance/checkin`, `/api/attendance/checkout`, `/api/attendance/report`.
- Payroll: `GET /api/payroll`, `POST /api/payroll/run`.
- Profile: `GET /api/profile`, `PUT /api/profile`, `POST /api/profile/change-password`.

## Frontend Routes

Public:

- `/`
- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/register/employee`

Protected:

- `/dashboard`
- `/employees` HR only
- `/attendance`
- `/leaves`
- `/leave-types` HR only
- `/payroll`
- `/profile`

## n8n Workflows

Import workflow templates from `n8n/`:

- `employee-invitation-workflow.json`
- `password-reset-workflow.json`
- `payroll-workflow.json`
- `attendance-reminder-workflow.json`
- `email-digest-workflow.json`
- `slack-alerts-workflow.json`
- `whatsapp-agent-workflow.json`

The payroll and digest workflows expect tenant-scoped payloads from the backend. Do not configure n8n workflows to fetch global employee or leave data.

## Build

Backend:

```bash
cd backend
npm run build
```

Frontend:

```bash
cd frontend
npm run build
```

## Testing Notes

The TypeScript builds are the primary verification path currently. The backend test script expects Jest from `backend/node_modules`; run `npm install` in `backend/` before `npm test`.

## Security Notes

- Use a strong `JWT_SECRET` in every environment.
- Keep `OPENAI_API_KEY` and n8n credentials out of source control.
- Do not add seed users or shared demo accounts.
- Do not introduce an `admin` role.
- Keep all tenant-owned database reads and writes scoped by `companyId`.
