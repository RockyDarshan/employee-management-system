import dotenv from "dotenv";
dotenv.config();
import connectDB from "../config/db";
import Employee from "../models/Employee";

const seedSuperAdmin = async () => {
  await connectDB();

  const existing = await Employee.findOne({ role: "super_admin" });
  if (existing) {
    console.log("Super Admin already exists:", existing.email);
    process.exit(0);
  }

  const admin = await Employee.create({
    employeeId: "EMP0001",
    name: "System Administrator",
    email: "admin@ems.com",
    password: "Admin@123",
    phone: "9999999999",
    department: "Administration",
    designation: "Super Admin",
    salary: 100000,
    joiningDate: new Date(),
    status: "active",
    role: "super_admin",
  });

  console.log("Super Admin created:", admin.email, "password: Admin@123");
  process.exit(0);
};

seedSuperAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
