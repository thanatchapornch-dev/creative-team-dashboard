import { prisma } from "@/lib/prisma";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; member?: string }>;
}) {
  const params = await searchParams;
  const membersRaw = await prisma.member.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, nickname: true, position: true, profilePictureUrl: true, role: true },
  });
  // Team leader/admin shows first, consistent with the dashboard's ordering.
  const members = [...membersRaw].sort((a, b) => (a.role !== "MEMBER" ? 0 : 1) - (b.role !== "MEMBER" ? 0 : 1));

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-6" style={{ background: "var(--navy)" }}>
      <div className="text-center">
        <h1 className="text-3xl font-bold" style={{ color: "var(--offwhite)" }}>
          Creative & Production
        </h1>
        <p className="text-sm" style={{ color: "var(--lime)" }}>Team Dashboard</p>
      </div>
      <LoginForm members={members} initialSelected={params.member} hasError={params.error === "invalid"} />
    </main>
  );
}
