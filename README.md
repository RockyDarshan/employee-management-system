# Employee Management System (EMS)

A full-stack Employee Management System with JWT authentication, three-tier role-based access control (RBAC), employee CRUD, and organizational hierarchy management with circular-reporting prevention.

**Live demo:** _<add your Vercel URL after deploying>_
**API health check:** _<add your Render URL>/api/health_

---

## Screenshots

|               Login                |                 Dashboard                  |
| :--------------------------------: | :----------------------------------------: |
| ![Login](screenshots/01-login.png) | ![Dashboard](screenshots/02-dashboard.png) |

|                  Employee list                  |                     Add employee                      |
| :---------------------------------------------: | :---------------------------------------------------: |
| ![Employees](screenshots/03-employees-list.png) | ![Add employee](screenshots/04-add-employee-form.png) |

|                 Organization tree                 |                 RBAC restriction                  |
| :-----------------------------------------------: | :-----------------------------------------------: |
| ![Org tree](screenshots/05-organization-tree.png) | ![RBAC](screenshots/06-rbac-role-restriction.png) |

|                      Circular reporting prevention                       |
| :----------------------------------------------------------------------: |
| ![Circular reporting error](screenshots/07-circular-reporting-error.png) |

---

## Tech Stack

| Layer      | Technology                                                                   |
| ---------- | ---------------------------------------------------------------------------- |
| Frontend   | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Axios, Recharts |
| Backend    | Node.js, Express.js, TypeScript                                              |
| Database   | MongoDB with Mongoose ODM                                                    |
| Auth       | JWT stored in an httpOnly cookie, bcrypt password hashing                    |
| Validation | express-validator (server), HTML5 + controlled inputs (client)               |

---

## Features

### Authentication

- Login and logout with the JWT stored in an **httpOnly cookie**, so client-side JavaScript cannot read it
- Passwords hashed with bcrypt and excluded from queries by default (`select: false`)
- Inactive or deleted accounts are rejected at login and on every request
- Protected routes on both layers: the dashboard layout redirects unauthenticated users to `/login`, and every API route except login sits behind the `protect` middleware

### Role-Based Access Control

Three roles: **Super Admin**, **HR Manager**, **Employee**.

| Action                            | Super Admin | HR Manager |         Employee          |
| --------------------------------- | :---------: | :--------: | :-----------------------: |
| View all employees                |     ✅      |     ✅     |      ❌ (self only)       |
| Create employee                   |     ✅      |     ✅     |            ❌             |
| Edit any employee                 |     ✅      |     ✅     |            ❌             |
| Edit own profile (limited fields) |     ✅      |     ✅     | ✅ (phone, profile image) |
| Soft-delete employee              |     ✅      |     ❌     |            ❌             |
| Assign Super Admin role           |     ✅      |     ❌     |            ❌             |
| Assign reporting manager          |     ✅      |     ✅     |            ❌             |

RBAC is enforced in **two layers**:

1. **Route level:** the `authorize("super_admin", "hr_manager")` middleware rejects a role before the controller runs.
2. **Field level:** inside the controllers, an Employee's update request is stripped down to `phone` and `profileImage` before it reaches the database, and list/detail endpoints are scoped to the user's own record.

Because both layers live on the server, the restrictions hold even if someone bypasses the UI and calls the API directly.

### Employee Management

Full CRUD with these fields: Employee ID, Name, Email, Phone, Department, Designation, Salary, Joining Date, Status, Role, Reporting Manager.

### Organizational Hierarchy

- Assign a reporting manager to any employee
- Collapsible reporting tree built on the server from the `reportingManager` self-reference
- **Circular reporting prevention:** before a manager assignment is saved, the backend walks up the proposed manager's chain. If it reaches the employee being reassigned, the request is rejected with a 400. The same check runs on both create/update and the dedicated manager endpoint.
- **Deleting a manager:** when an employee is soft-deleted, their direct reports are moved up to the deleted employee's own manager (or become top-level if there is none). The hierarchy never contains links to deleted people, and moving reports up one level cannot create a cycle.

### Dashboard

Total, active and inactive employee counts, number of departments, and a headcount-by-department bar chart (Recharts).

### Search, Filter, Sort, Pagination

Search by name or email, filter by department, role and status, sort by name, salary or joining date, and page through results 10 at a time.

### Soft Delete

Deleting an employee sets `isDeleted: true` and `status: "inactive"` instead of removing the document. A Mongoose query hook excludes soft-deleted records from find, count and distinct queries automatically, so they disappear from lists, counts and the manager dropdown, while the data is preserved.

### Validation

Server-side validation with `express-validator`: valid email, 10-digit phone, non-negative salary, ISO date, allowed role and status values, and page/limit bounds. Mongoose schema validation backs it up, and duplicate employee IDs or emails return a clear 409.

---

## Architecture

```
Browser (Next.js, App Router)
   │  Axios, withCredentials, httpOnly JWT cookie
   ▼
Express API ── protect (verify JWT, load user, check status)
   │         └─ authorize(...roles) (route-level RBAC)
   ▼
Controllers ── field-level RBAC, circular-reporting check
   ▼
Mongoose models ── bcrypt pre-save hook, soft-delete query hook
   ▼
MongoDB
```

- The frontend asks `GET /api/auth/me` on load to find out who is logged in, using the cookie already in the browser.
- A 401 from any API call sends the user back to `/login`.
- A central error handler and a JSON 404 handler keep API responses consistent.

---

## API Overview

All routes are prefixed with `/api`. Everything except `/auth/login` and `/health` requires authentication.

| Method | Endpoint                   | Access                                  | Description                                |
| ------ | -------------------------- | --------------------------------------- | ------------------------------------------ |
| GET    | `/health`                  | Public                                  | Health check                               |
| POST   | `/auth/login`              | Public                                  | Log in, sets the cookie                    |
| POST   | `/auth/logout`             | Authenticated                           | Clears the cookie                          |
| GET    | `/auth/me`                 | Authenticated                           | Current user                               |
| GET    | `/employees`               | Authenticated (Employee sees self only) | List with search, filter, sort, pagination |
| POST   | `/employees`               | Super Admin, HR                         | Create employee                            |
| GET    | `/employees/:id`           | Authenticated (Employee: self only)     | Get one employee                           |
| PUT    | `/employees/:id`           | Authenticated (field-level rules)       | Update employee                            |
| DELETE | `/employees/:id`           | Super Admin                             | Soft-delete, reassigns direct reports      |
| GET    | `/employees/:id/reportees` | Authenticated                           | Direct reports of an employee              |
| PATCH  | `/employees/:id/manager`   | Super Admin, HR                         | Change reporting manager                   |
| GET    | `/dashboard/stats`         | Authenticated                           | Counts and department breakdown            |
| GET    | `/organization/tree`       | Authenticated                           | Nested reporting tree                      |

Full request and response examples are in [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

---

## Project Structure

```
employee-management-system/
├── server/                     # Express + TypeScript API
│   └── src/
│       ├── config/             # MongoDB connection
│       ├── controllers/        # Auth and employee handlers
│       ├── middleware/         # protect, authorize, validators
│       ├── models/             # Employee schema, hooks
│       ├── routes/             # Express routers
│       ├── utils/              # JWT helpers, seed script
│       ├── app.ts              # Express app (CORS, cookies, routes, error handling)
│       └── server.ts           # Entry point
├── client/                     # Next.js frontend
│   └── src/
│       ├── app/                # Pages: login, dashboard, employees, organization
│       ├── components/         # Sidebar, StatCard, Badge, EmployeeFormModal, OrgTreeNode
│       ├── context/            # AuthContext
│       └── lib/                # Axios instance, shared types
├── screenshots/
├── API_DOCUMENTATION.md
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18 or newer
- A MongoDB database: a local install or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Clone

```bash
git clone https://github.com/RockyDarshan/employee-management-system.git
cd employee-management-system
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env      # on Windows: copy .env.example .env
```

Fill in `server/.env`:

| Variable                  | Description                            | Example                                           |
| ------------------------- | -------------------------------------- | ------------------------------------------------- |
| `PORT`                    | API port                               | `5000`                                            |
| `NODE_ENV`                | `development` or `production`          | `development`                                     |
| `MONGO_URI`               | MongoDB connection string              | `mongodb+srv://user:pass@cluster.mongodb.net/ems` |
| `JWT_SECRET`              | Long random string used to sign tokens | `openssl rand -hex 32`                            |
| `JWT_EXPIRES_IN`          | Token lifetime                         | `1d`                                              |
| `JWT_COOKIE_EXPIRES_DAYS` | Cookie lifetime in days                | `1`                                               |
| `CLIENT_URL`              | Frontend origin allowed by CORS        | `http://localhost:3000`                           |

Create the first Super Admin and start the API:

```bash
npm run seed     # creates admin@ems.com / Admin@123
npm run dev      # http://localhost:5000
```

### 3. Frontend

```bash
cd ../client
npm install
```

Create `client/.env.local`:

| Variable              | Description  | Default                     |
| --------------------- | ------------ | --------------------------- |
| `NEXT_PUBLIC_API_URL` | API base URL | `http://localhost:5000/api` |

```bash
npm run dev      # http://localhost:3000
```

Log in with the seeded Super Admin, then create HR Manager and Employee accounts from the Employees page to see how each role's view changes.

---

## Deployment

| Part     | Platform             | Notes                                                                                          |
| -------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| Database | MongoDB Atlas        | Allow network access from anywhere (`0.0.0.0/0`) so the host can connect                       |
| API      | Render (Web Service) | Root directory `server`, build `npm install --include=dev && npm run build`, start `npm start` |
| Client   | Vercel               | Root directory `client`                                                                        |

The client calls `/api/...` on its own domain and a Next.js rewrite forwards it to the API. The browser therefore only talks to one origin, which keeps the httpOnly cookie first-party and avoids cross-site cookie issues.

Vercel environment variables:

| Variable              | Value                                                              |
| --------------------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL` | `/api`                                                             |
| `BACKEND_URL`         | The Render service URL, for example `https://ems-api.onrender.com` |

Render environment variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_COOKIE_EXPIRES_DAYS`, `NODE_ENV=production`, `CLIENT_URL` (the Vercel URL).

> On Render's free plan the API sleeps after inactivity, so the first request after a pause can take up to a minute.

---

## Demo Accounts

| Role        | Email                          | Password     |
| ----------- | ------------------------------ | ------------ |
| Super Admin | admin@ems.com                  | Admin@123    |
| HR Manager  | _<create one and add it here>_ | _<password>_ |
| Employee    | _<create one and add it here>_ | _<password>_ |

---

## Known Limitations and Future Work

- No automated test suite yet; behavior was verified manually (screenshots above cover the main flows)
- No password change or reset flow, and no refresh tokens (a session lasts as long as the cookie)
- Profile image is stored as a URL string, with no file upload
- Department is free text rather than a managed list
- Dashboard statistics are visible to every role, not only administrators

---

## Author

**Darshan** — [GitHub](https://github.com/RockyDarshan)
