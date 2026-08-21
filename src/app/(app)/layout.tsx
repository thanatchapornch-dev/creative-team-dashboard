import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runDeadlineSweep } from "@/lib/automation";
import { Sidebar } from "@/components/Sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { AutoRefresh } from "@/components/AutoRefresh";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  await runDeadlineSweep();

  const notifications = await prisma.notificationLog.findMany({
    where: { recipientId: member.id, channel: "IN_APP" },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="flex min-h-screen" style={{ background: "var(--offwhite)" }}>
      <AutoRefresh />
      <Sidebar member={member} />
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-end gap-4 px-8 py-4">
          <NotificationBell
            notifications={notifications.map((n) => ({
              id: n.id,
              type: n.type,
              title: n.title,
              body: n.body,
              createdAt: n.createdAt.toISOString(),
              readAt: n.readAt ? n.readAt.toISOString() : null,
            }))}
          />
        </header>
        <main className="flex-1 px-8 pb-10">{children}</main>
      </div>
    </div>
  );
}
