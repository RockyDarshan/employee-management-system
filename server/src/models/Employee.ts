import mongoose, { Document, Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";

export type Role = "super_admin" | "hr_manager" | "employee";
export type Status = "active" | "inactive";

export interface IEmployee extends Document {
  employeeId: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: Date;
  status: Status;
  role: Role;
  reportingManager: Types.ObjectId | null;
  profileImage: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const employeeSchema = new Schema<IEmployee>(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, "Phone number must be 10 digits"],
    },
    department: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    salary: { type: Number, required: true, min: 0 },
    joiningDate: { type: Date, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    role: {
      type: String,
      enum: ["super_admin", "hr_manager", "employee"],
      default: "employee",
    },
    reportingManager: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    profileImage: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false, select: false },
  },
  { timestamps: true },
);

// Hash password before saving, only if it was modified
employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Exclude soft-deleted docs from normal find queries by default
employeeSchema.pre(/^find/, function (this: mongoose.Query<any, any>, next) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

employeeSchema.methods.comparePassword = async function (
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IEmployee>("Employee", employeeSchema);
