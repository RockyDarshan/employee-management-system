"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { DashboardStats, Employee } from "@/lib/types";
import StatCard from "@/components/StatCard";
import { Users, UserCheck, UserX, Building2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [deptCounts, setDeptCounts] = useState<{ department: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, employeesRes] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/employees?limit=100"),
        ]);
        setStats(statsRes.data.data);

        // Build department -> headcount breakdown for the chart client-side
        const employees: Employee[] = employeesRes.data.data;
        const counts: Record<string, number> = {};
        employees.forEach((e) => {
          counts[e.department] = (counts[e.department] || 0) + 1;
        });
        setDeptCounts(Object.entries(counts).map(([department, count]) => ({ department, count })));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p style={{ color: "var(--color-text-muted)" }}>Loading dashboard…</p>;
  if (!stats) return <p>Failed to load dashboard.</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Organization overview at a glance
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={stats.totalEmployees} icon={Users} accent="var(--color-primary)" />
        <StatCard label="Active" value={stats.activeEmployees} icon={UserCheck} accent="var(--color-success)" />
        <StatCard label="Inactive" value={stats.inactiveEmployees} icon={UserX} accent="var(--color-danger)" />
        <StatCard label="Departments" value={stats.departmentCount} icon={Building2} accent="var(--color-warning)" />
      </div>

      <div
        className="rounded-xl p-5"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <h2 className="text-sm font-medium mb-4">Headcount by department</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={deptCounts}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="department" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
