"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { Users } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex-1 flex items-center justify-center px-4"
      style={{ background: "var(--color-bg)" }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-8 animate-fade-in"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "var(--color-primary)" }}
          >
            <Users size={18} color="white" />
          </div>
          <span className="font-semibold text-lg">EMS</span>
        </div>
        <h1 className="text-xl font-semibold mt-4 mb-1">Sign in</h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
          Enter your work email and password to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
              style={{ border: "1px solid var(--color-border)", background: "var(--color-bg)" }}
              placeholder="admin@ems.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
              style={{ border: "1px solid var(--color-border)", background: "var(--color-bg)" }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div
              className="text-sm rounded-lg px-3 py-2"
              style={{ background: "var(--color-danger-tint)", color: "var(--color-danger)" }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg py-2 text-sm font-medium text-white transition-opacity disabled:opacity-60"
            style={{ background: "var(--color-primary)" }}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
