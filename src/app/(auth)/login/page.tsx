import { prisma } from "@/lib/prisma";
import { sortLeaderFirst } from "@/lib/members";
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
  const members = sortLeaderFirst(membersRaw);

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
