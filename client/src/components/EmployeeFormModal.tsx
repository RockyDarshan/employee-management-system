"use client";

import { useState, useEffect, FormEvent } from "react";
import { X } from "lucide-react";
import api from "@/lib/api";
import { Employee } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

interface Props {
  employee?: Employee | null;
  onClose: () => void;
  onSaved: () => void;
}

const inputClass =
  "w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2";
const inputStyle = { border: "1px solid var(--color-border)", background: "var(--color-bg)" };

type EmployeeFormPayload = {
  employeeId: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: string;
  status: string;
  role: string;
  reportingManager: string | null;
};

// Pull the manager's id whether reportingManager arrived populated (an object) or as a raw id string
const managerIdOf = (employee?: Employee | null): string => {
  if (!employee?.reportingManager) return "";
  return typeof employee.reportingManager === "string"
    ? employee.reportingManager
    : employee.reportingManager._id;
};

export default function EmployeeFormModal({ employee, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const isEdit = !!employee;
  const canAssignSuperAdmin = user?.role === "super_admin";

  const [form, setForm] = useState({
    employeeId: employee?.employeeId || "",
    name: employee?.name || "",
    email: employee?.email || "",
    password: "",
    phone: employee?.phone || "",
    department: employee?.department || "",
    designation: employee?.designation || "",
    salary: employee?.salary?.toString() || "",
    joiningDate: employee?.joiningDate?.slice(0, 10) || "",
    status: employee?.status || "active",
    role: employee?.role || "employee",
    reportingManager: managerIdOf(employee),
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [managers, setManagers] = useState<Employee[]>([]);

  // Load everyone as a potential manager, then filter out the employee being edited (can't report to self)
  useEffect(() => {
    api.get("/employees", { params: { limit: 100 } }).then((res) => {
      const all: Employee[] = res.data.data;
      setManagers(employee ? all.filter((e) => e._id !== employee._id) : all);
    });
  }, [employee]);

  const handleChange = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload: EmployeeFormPayload = {
        ...form,
        salary: Number(form.salary),
        reportingManager: form.reportingManager || null,
      };

      const payloadToSubmit = isEdit && !payload.password
        ? Object.fromEntries(
            Object.entries(payload).filter(([key]) => key !== "password")
          ) as EmployeeFormPayload
        : payload;

      if (isEdit) {
        await api.put(`/employees/${employee!._id}`, payloadToSubmit);
      } else {
        await api.post("/employees", payloadToSubmit);
      }
      onSaved();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || "Something went wrong. Check the fields and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div
        className="w-full max-w-lg rounded-xl p-6 max-h-[90vh] overflow-y-auto animate-fade-in"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{isEdit ? "Edit employee" : "Add employee"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: "var(--color-text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Employee ID">
              <input
                required
                disabled={isEdit}
                className={inputClass}
                style={inputStyle}
                value={form.employeeId}
                onChange={(e) => handleChange("employeeId", e.target.value)}
              />
            </Field>
            <Field label="Full name">
              <input
                required
                className={inputClass}
                style={inputStyle}
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input
                type="email"
                required
                disabled={isEdit}
                className={inputClass}
                style={inputStyle}
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </Field>
            <Field label={isEdit ? "New password (optional)" : "Password"}>
              <input
                type="password"
                required={!isEdit}
                className={inputClass}
                style={inputStyle}
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder={isEdit ? "Leave blank to keep current" : ""}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <input
                required
                pattern="[0-9]{10}"
                title="10 digit phone number"
                className={inputClass}
                style={inputStyle}
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </Field>
            <Field label="Department">
              <input
                required
                className={inputClass}
                style={inputStyle}
                value={form.department}
                onChange={(e) => handleChange("department", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Designation">
              <input
                required
                className={inputClass}
                style={inputStyle}
                value={form.designation}
                onChange={(e) => handleChange("designation", e.target.value)}
              />
            </Field>
            <Field label="Salary (₹/month)">
              <input
                type="number"
                min={0}
                required
                className={inputClass}
                style={inputStyle}
                value={form.salary}
                onChange={(e) => handleChange("salary", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Joining date">
              <input
                type="date"
                required
                className={inputClass}
                style={inputStyle}
                value={form.joiningDate}
                onChange={(e) => handleChange("joiningDate", e.target.value)}
              />
            </Field>
            <Field label="Status">
              <select
                className={inputClass}
                style={inputStyle}
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
            <Field label="Role">
              <select
                className={inputClass}
                style={inputStyle}
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
              >
                <option value="employee">Employee</option>
                <option value="hr_manager">HR Manager</option>
                {canAssignSuperAdmin && <option value="super_admin">Super Admin</option>}
              </select>
            </Field>
          </div>

          <Field label="Reporting manager">
            <select
              className={inputClass}
              style={inputStyle}
              value={form.reportingManager}
              onChange={(e) => handleChange("reportingManager", e.target.value)}
            >
              <option value="">No manager (top of hierarchy)</option>
              {managers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} — {m.designation}
                </option>
              ))}
            </select>
          </Field>

          {error && (
            <div
              className="text-sm rounded-lg px-3 py-2"
              style={{ background: "var(--color-danger-tint)", color: "var(--color-danger)" }}
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ border: "1px solid var(--color-border)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "var(--color-primary)" }}
            >
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Add employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}