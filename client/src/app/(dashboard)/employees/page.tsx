"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Employee, PaginatedEmployees } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import Badge from "@/components/Badge";
import EmployeeFormModal from "@/components/EmployeeFormModal";
import { Plus, Search, Trash2, Pencil, ChevronLeft, ChevronRight } from "lucide-react";

export default function EmployeesPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<PaginatedEmployees | null>(null);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("joiningDate");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const [searchInput, setSearchInput] = useState("");


useEffect(() => {
  const t = setTimeout(() => {
    setSearch(searchInput);
    setPage(1);
  }, 400);
  return () => clearTimeout(t);
}, [searchInput]);

  const canWrite = user?.role === "super_admin" || user?.role === "hr_manager";
  const canDelete = user?.role === "super_admin";

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: "10", sortBy, order };
      if (search) params.search = search;
      if (department) params.department = department;
      if (status) params.status = status;
      const res = await api.get("/employees", { params });
      setResult(res.data);
    } finally {
      setLoading(false);
    }
  }, [page, search, department, status, sortBy, order]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleDelete = async (id: string) => {
    if (!confirm("Soft-delete this employee? Their record is kept but marked inactive.")) return;
    await api.delete(`/employees/${id}`);
    fetchEmployees();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Employees</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {result ? `${result.total} total` : "…"}
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--color-primary)" }}
          >
            <Plus size={16} /> Add employee
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
          <input
  value={searchInput}
  onChange={(e) => setSearchInput(e.target.value)}
  placeholder="Search by name or email…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}
          />
        </div>
        <input
          value={department}
          onChange={(e) => {
            setPage(1);
            setDepartment(e.target.value);
          }}
          placeholder="Filter by department"
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={`${sortBy}:${order}`}
          onChange={(e) => {
            const [sb, o] = e.target.value.split(":");
            setSortBy(sb);
            setOrder(o);
          }}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}
        >
          <option value="joiningDate:desc">Newest joined</option>
          <option value="joiningDate:asc">Oldest joined</option>
          <option value="name:asc">Name A–Z</option>
          <option value="name:desc">Name Z–A</option>
        </select>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--color-bg)" }}>
              {["Employee", "Department", "Designation", "Status", "Role", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: "var(--color-text-muted)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8" style={{ color: "var(--color-text-muted)" }}>Loading…</td></tr>
            ) : result?.data.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8" style={{ color: "var(--color-text-muted)" }}>No employees match these filters.</td></tr>
            ) : (
              result?.data.map((emp) => (
                <tr key={emp._id} style={{ borderTop: "1px solid var(--color-border)" }}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{emp.name}</p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{emp.email}</p>
                  </td>
                  <td className="px-4 py-3">{emp.department}</td>
                  <td className="px-4 py-3">{emp.designation}</td>
                  <td className="px-4 py-3">
                    <Badge text={emp.status} tone={emp.status === "active" ? "success" : "danger"} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge text={emp.role.replace("_", " ")} tone="primary" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {(canWrite || user?._id === emp._id) && (
                        <button
                          onClick={() => {
                            setEditing(emp);
                            setModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDelete(emp._id)} className="p-1.5 rounded-lg" style={{ color: "var(--color-danger)" }}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {result && result.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: "var(--color-text-muted)" }}>
            Page {result.page} of {result.pages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-lg disabled:opacity-40"
              style={{ border: "1px solid var(--color-border)" }}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              disabled={page >= result.pages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg disabled:opacity-40"
              style={{ border: "1px solid var(--color-border)" }}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {modalOpen && (
        <EmployeeFormModal
          employee={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            fetchEmployees();
          }}
        />
      )}
    </div>
  );
}
