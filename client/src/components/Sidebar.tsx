"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, Users, Network, LogOut } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/organization", label: "Organization", icon: Network },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className="w-60 shrink-0 flex flex-col h-screen sticky top-0"
      style={{ background: "var(--color-surface)", borderRight: "1px solid var(--color-border)" }}
    >
      <div className="flex items-center gap-2 px-5 py-5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--color-primary)" }}
        >
          <Users size={16} color="white" />
        </div>
        <span className="font-semibold">EMS</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: active ? "var(--color-primary-tint)" : "transparent",
                color: active ? "var(--color-primary-dark)" : "var(--color-text-muted)",
              }}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 mt-auto">
        <div
          className="px-3 py-3 rounded-lg mb-2"
          style={{ background: "var(--color-bg)" }}
        >
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs capitalize" style={{ color: "var(--color-text-muted)" }}>
            {user?.role.replace("_", " ")}
          </p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ color: "var(--color-danger)" }}
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>
    </aside>
  );
}
