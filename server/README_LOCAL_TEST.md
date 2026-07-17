# Local Testing Guide

## 1. Prerequisites
- Node.js 18+
- MongoDB running locally (or a free MongoDB Atlas cluster)

## 2. Setup
```bash
cd server
npm install
cp .env.example .env
```
Edit `.env` — set `MONGO_URI` (e.g. `mongodb://localhost:27017/ems`) and a real `JWT_SECRET`.

## 3. Start MongoDB (if local)
```bash
# macOS (brew)
brew services start mongodb-community
# Linux
sudo systemctl start mongod
# Or use MongoDB Atlas connection string instead of local
```

## 4. Seed the first Super Admin
```bash
npm run seed
# Creates: admin@ems.com / Admin@123
```

## 5. Run the server
```bash
npm run dev
# Server on http://localhost:5000
```

## 6. Test with curl

**Health check**
```bash
curl http://localhost:5000/api/health
```

**Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"admin@ems.com","password":"Admin@123"}'
```
Copy the `token` from the response — use it as a Bearer token, or rely on `cookies.txt` for subsequent curl calls with `-b cookies.txt`.

**Create an employee (as Super Admin)**
```bash
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "employeeId":"EMP0002",
    "name":"Priya Sharma",
    "email":"priya@ems.com",
    "password":"Priya@123",
    "phone":"9876543210",
    "department":"Engineering",
    "designation":"Software Engineer",
    "salary":600000,
    "joiningDate":"2026-01-15",
    "role":"employee"
  }'
```

**Get all employees**
```bash
curl -b cookies.txt "http://localhost:5000/api/employees?page=1&limit=10"
```

**Dashboard stats**
```bash
curl -b cookies.txt http://localhost:5000/api/dashboard/stats
```

**Org tree**
```bash
curl -b cookies.txt http://localhost:5000/api/organization/tree
```

**Assign a manager**
```bash
curl -X PATCH http://localhost:5000/api/employees/<EMPLOYEE_ID>/manager \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"managerId":"<MANAGER_ID>"}'
```

**Logout**
```bash
curl -X POST http://localhost:5000/api/auth/logout -b cookies.txt
```

## Postman alternative
Import the endpoints above as a collection, enable "Send cookies automatically" or manually paste the Bearer token into the Authorization tab after login.
