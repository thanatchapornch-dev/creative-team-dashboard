"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "./Avatar";
import { logoutAction } from "@/app/(app)/actions";

type NavItem = { href: string; label: string; icon: string; roles?: Array<"MEMBER" | "LEADER" | "ADMIN"> };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/tasks", label: "My Tasks", icon: "✅" },
  { href: "/team-queue", label: "Team Queue", icon: "🗂️" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
  { href: "/leave", label: "Leave", icon: "🏖️" },
  { href: "/approval", label: "Approval", icon: "📋", roles: ["LEADER", "ADMIN"] },
  { href: "/reports", label: "Reports", icon: "📊" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar({
  member,
}: {
  member: { nickname: string; position: string; profilePictureUrl: string; role: string };
}) {
  const pathname = usePathname();

  return (
    <aside
      className="w-60 shrink-0 flex flex-col h-screen sticky top-0 px-4 py-6"
      style={{ background: "var(--navy)", color: "var(--offwhite)" }}
    >
      <div className="mb-8 px-2">
        <p className="font-bold text-lg leading-tight">Creative & Production</p>
        <p className="text-xs" style={{ color: "var(--lime)" }}>Team Dashboard</p>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {NAV.filter((item) => !item.roles || item.roles.includes(member.role as never)).map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition"
              style={{
                background: active ? "var(--orange)" : "transparent",
                color: active ? "white" : "var(--offwhite)",
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 flex items-center gap-3 rounded-xl px-2 py-3" style={{ background: "var(--navy-soft)" }}>
        <Avatar name={member.nickname} src={member.profilePictureUrl} size={36} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{member.nickname}</p>
          <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{member.position}</p>
        </div>
        <form action={logoutAction}>
          <button type="submit" title="Logout" className="text-sm opacity-80 hover:opacity-100">
            ↩️
          </button>
        </form>
      </div>
    </aside>
  );
}
