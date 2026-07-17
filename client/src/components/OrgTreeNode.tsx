"use client";

import { useState } from "react";
import { OrgNode } from "@/lib/types";
import { ChevronRight, ChevronDown, User } from "lucide-react";

export default function OrgTreeNode({ node, depth = 0 }: { node: OrgNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-2 rounded-lg"
        style={{ marginLeft: depth * 20 }}
      >
        {hasChildren ? (
          <button onClick={() => setOpen((o) => !o)} style={{ color: "var(--color-text-muted)" }}>
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        ) : (
          <span className="w-[15px]" />
        )}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "var(--color-primary-tint)" }}
        >
          <User size={13} color="var(--color-primary-dark)" />
        </div>
        <div>
          <p className="text-sm font-medium">{node.name}</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {node.designation} · {node.department}
          </p>
        </div>
      </div>
      {open && hasChildren && (
        <div>
          {node.children.map((child) => (
            <OrgTreeNode key={child._id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
