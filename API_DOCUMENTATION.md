# API Documentation

Base URL (local): `http://localhost:5000/api`

All endpoints except `/auth/login` and `/health` require authentication via an httpOnly JWT cookie (set automatically after login) or an `Authorization: Bearer <token>` header.

---

## Authentication

### `POST /auth/login`

Log in and receive a JWT.

**Body:**

```json
{ "email": "admin@ems.com", "password": "Admin@123" }
```

**Response `200`:**

```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": {
    "_id": "...",
    "name": "System Administrator",
    "role": "super_admin",
    "...": "..."
  }
}
```

**Response `401`:** invalid credentials.

---

### `POST /auth/logout`

Clears the auth cookie. Requires authentication.

**Response `200`:**

```json
{ "success": true, "message": "Logged out successfully." }
```

---

### `GET /auth/me`

Returns the currently authenticated user. Used by the frontend to check session validity on load.

**Response `200`:**

```json
{ "success": true, "user": { "...": "..." } }
```

---

## Employees

### `GET /employees`

List employees with search, filter, sort, and pagination.

**Access:** All authenticated roles. Employees are automatically restricted to seeing only their own record.

**Query parameters:**
| Param | Type | Description |
|---|---|---|
| `search` | string | Matches against name or email (case-insensitive) |
| `department` | string | Exact match |
| `role` | string | `super_admin` \| `hr_manager` \| `employee` |
| `status` | string | `active` \| `inactive` |
| `sortBy` | string | `name` \| `salary` \| `joiningDate` (default) |
| `order` | string | `asc` \| `desc` (default) |
| `page` | number | default `1` |
| `limit` | number | default `10`, max `100` |

**Response `200`:**

```json
{
  "success": true,
  "count": 10,
  "total": 34,
  "page": 1,
  "pages": 4,
  "data": [{ "...": "employee object" }]
}
```

---

### `GET /employees/:id`

Get a single employee by ID.

**Access:** Super Admin / HR Manager (any employee); Employee role (only their own ID — returns `403` otherwise).

---

### `POST /employees`

Create a new employee.

**Access:** Super Admin, HR Manager only. Only Super Admin may set `role: "super_admin"`.

**Body:**

```json
{
  "employeeId": "EMP0010",
  "name": "Jane Doe",
  "email": "jane@ems.com",
  "password": "SecurePass1",
  "phone": "9876543210",
  "department": "Engineering",
  "designation": "Software Engineer",
  "salary": 650000,
  "joiningDate": "2026-01-15",
  "role": "employee",
  "status": "active",
  "reportingManager": "<employeeObjectId or null>"
}
```

**Response `201`:** created employee object (password excluded).
**Response `409`:** duplicate `employeeId` or `email`.

---

### `PUT /employees/:id`

Update an employee.

**Access & field restrictions:**

- **Super Admin:** any field, any employee
- **HR Manager:** any field except cannot set `role: "super_admin"`
- **Employee:** only their own record, and only `phone` / `profileImage` — all other fields in the request body are silently ignored

Setting `reportingManager` runs circular-reporting validation (see below).

**Response `200`:** updated employee object.
**Response `400`:** circular reporting detected, or an employee cannot report to themselves.
**Response `403`:** role/field restriction violated.

---

### `DELETE /employees/:id`

Soft-deletes an employee (`isDeleted: true`, `status: "inactive"`). Data is retained but hidden from all normal queries.

**Access:** Super Admin only.

**Response `200`:**

```json
{ "success": true, "message": "Employee soft-deleted." }
```

---

## Dashboard

### `GET /dashboard/stats`

Returns aggregate counts for the dashboard.

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "totalEmployees": 34,
    "activeEmployees": 30,
    "inactiveEmployees": 4,
    "departmentCount": 5,
    "departments": ["Engineering", "HR", "Sales", "Finance", "Administration"]
  }
}
```

---

## Organization

### `GET /organization/tree`

Returns the full reporting hierarchy as a nested tree, rooted at every employee with no manager.

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "System Administrator",
      "designation": "Super Admin",
      "children": [
        {
          "_id": "...",
          "name": "Priya Sharma",
          "children": [
            /* nested reports */
          ]
        }
      ]
    }
  ]
}
```

---

### `GET /employees/:id/reportees`

Returns the direct reports of a given employee (one level down, not the full subtree).

**Response `200`:**

```json
{ "success": true, "count": 2, "data": [{ "...": "employee" }] }
```

---

### `PATCH /employees/:id/manager`

Reassign (or clear) an employee's reporting manager.

**Access:** Super Admin, HR Manager only.

**Body:**

```json
{ "managerId": "<employeeObjectId>" }
```

Send `managerId: null` (or omit it) to clear the reporting manager.

**Response `200`:** updated employee with populated `reportingManager`.
**Response `400`:**

- `"An employee cannot report to themselves."`
- `"This assignment would create a circular reporting structure."`
- `"Reporting manager does not exist."`

---

## Error format

All errors follow this shape:

```json
{ "success": false, "message": "Human-readable explanation" }
```

Validation errors (`400` from `express-validator`) instead return:

```json
{ "success": false, "errors": [{ "msg": "...", "path": "...", "...": "..." }] }
```

## Status codes used

| Code | Meaning                                            |
| ---- | -------------------------------------------------- |
| 200  | Success                                            |
| 201  | Resource created                                   |
| 400  | Validation error / bad request                     |
| 401  | Not authenticated / invalid credentials            |
| 403  | Authenticated but not permitted (RBAC)             |
| 404  | Resource not found                                 |
| 409  | Duplicate key (employeeId or email already exists) |
| 500  | Server error                                       |
