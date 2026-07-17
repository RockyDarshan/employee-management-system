"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { OrgNode } from "@/lib/types";
import OrgTreeNode from "@/components/OrgTreeNode";

export default function OrganizationPage() {
  const [tree, setTree] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/organization/tree")
      .then((res) => setTree(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold">Organization</h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Reporting hierarchy, built from each employee's assigned manager
        </p>
      </div>

      <div
        className="rounded-xl p-4"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        {loading ? (
          <p style={{ color: "var(--color-text-muted)" }}>Loading org tree…</p>
        ) : tree.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>No employees yet.</p>
        ) : (
          tree.map((root) => <OrgTreeNode key={root._id} node={root} />)
        )}
      </div>
    </div>
  );
}
