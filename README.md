# Employee Management System (EMS)

A full-stack Employee Management System with JWT authentication, role-based access control (RBAC), employee CRUD, and organizational hierarchy management — built for the Playstack Incorporation Full Stack Developer hiring assignment.

**Live Demo:** _(add your deployed URL here if deployed)_
**Screenshots:** see below

---

## Tech Stack

| Layer    | Technology                                        |
| -------- | ------------------------------------------------- |
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Backend  | Node.js, Express.js, TypeScript                   |
| Database | MongoDB (Mongoose ODM)                            |
| Auth     | JWT (httpOnly cookies) + bcrypt password hashing  |
| Charts   | Recharts                                          |

---

## Features

### Authentication

- Login / Logout with JWT stored in an httpOnly cookie
- Passwords hashed with bcrypt (never stored or returned in plaintext)
- Protected routes on both frontend (redirect if unauthenticated) and backend (middleware-enforced)

### Role-Based Access Control

Three roles: **Super Admin**, **HR Manager**, **Employee**

| Action                            | Super Admin | HR Manager |    Employee    |
| --------------------------------- | :---------: | :--------: | :------------: |
| View all employees                |     ✅      |     ✅     | ❌ (self only) |
| Create employee                   |     ✅      |     ✅     |       ❌       |
| Edit any employee                 |     ✅      |     ✅     |       ❌       |
| Edit own profile (limited fields) |     ✅      |     ✅     |       ✅       |
| Delete (soft) employee            |     ✅      |     ❌     |       ❌       |
| Assign Super Admin role           |     ✅      |     ❌     |       ❌       |
| Assign reporting manager          |     ✅      |     ✅     |       ❌       |

RBAC is enforced at **two layers**: route-level middleware on the backend (`authorize()`), and field-level filtering inside controllers (e.g. an Employee's update request is stripped down to only `phone` and `profileImage` before it touches the database) — so the restriction holds even if someone bypasses the UI and calls the API directly.

### Employee Management

Full CRUD with fields: Employee ID, Name, Email, Phone, Department, Designation, Salary, Joining Date, Status, Role, Reporting Manager.

### Organizational Hierarchy

- Assign a reporting manager per employee
- Visual, collapsible reporting tree
- **Circular reporting prevention**: before saving a manager assignment, the backend walks up the proposed manager's chain — if it ever reaches the employee being reassigned, the save is rejected.

### Dashboard

Total / Active / Inactive employee counts, department count, and a headcount-by-department bar chart.

### Search, Filter, Sort, Pagination

Search by name/email, filter by department/role/status, sort by name or joining date, paginated results (10 per page).

### Validation

Enforced on both frontend (HTML5 + controlled inputs) and backend (`express-validator`): email format, 10-digit phone, non-negative salary, required fields.

### Bonus features implemented

- ✅ Pagination
- ✅ Soft delete (employees are flagged `isDeleted`, not destroyed, and auto-excluded from all queries)
- ✅ Dashboard chart (Recharts bar chart)

---

## Project Structure

```
employee-management-system/
├── server/ # Express + TypeScript backend
│ ├── src/
│ │ ├── models/ # Mongoose schemas
│ │ ├── controllers/ # Route handlers
│ │ ├── routes/ # Express routers
│ │ ├── middleware/ # Auth, RBAC, validation
│ │ ├── utils/ # JWT helpers, seed script
│ │ └── config/ # DB connection
│ └── package.json
├── client/ # Next.js frontend
│ ├── src/
│ │ ├── app/ # App Router pages
│ │ ├── components/ # Reusable UI components
│ │ ├── context/ # Auth context
│ │ └── lib/ # API client, types
│ └── package.json
├── API_DOCUMENTATION.md
|__ SCREENSHOTS
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB (local install or a free MongoDB Atlas cluster)

### 1. Clone the repository

```bash
git clone https://github.com/RockyDarshan/employee-management-system.git
cd employee-management-system
```

### 2. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` and fill in:

MONGO_URI=<your MongoDB connection string>
JWT_SECRET=<any long random string>

Seed the first Super Admin account:

```bash
npm run seed
```

This creates: `admin@ems.com` / `Admin@123`

Start the backend:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Frontend setup

```bash
cd ../client
npm install
```

Create `client/.env.local`:

NEXT_PUBLIC_API_URL=http://localhost:5000/api
Start the frontend:

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

### 4. Log in

Visit `http://localhost:3000`, log in with `admin@ems.com` / `Admin@123`.

---

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for full endpoint reference.

---

---

## Screenshots

**Login**
![Login](./screenshots/01-login.png)

**Dashboard**
![Dashboard](./screenshots/02-dashboard.png)

**Employees List**
![Employees](./screenshots/03-employees-list.png)

**Add Employee (with reporting manager assignment)**
![Add Employee](./screenshots/04-add-employee-form.png)

**Organization Hierarchy**
![Org Tree](./screenshots/05-organization-tree.png)

**RBAC — HR cannot assign Super Admin role**
![RBAC](./screenshots/06-rbac-role-restriction.png)

**Circular Reporting Prevention**
![Circular Check](./screenshots/07-circular-reporting-error.png)

## Key Design Decisions

- **Single collection for users and employees** — every employee record doubles as the login credential, since in this domain every employee is also a system user. Simpler than maintaining two synced collections.
- **httpOnly JWT cookie** for XSS protection, with Bearer-token fallback support for API testing tools like Postman.
- **Soft delete via `isDeleted` flag** with a global Mongoose query hook that auto-filters deleted records from every `find()` — deletion is reversible and auditable, not destructive.
- **Circular-reporting detection** walks the proposed manager's reporting chain upward with cycle protection, rejecting any assignment that would loop back to the employee being reassigned.

---

## Author

Darshan — [github.com/RockyDarshan](https://github.com/RockyDarshan)
