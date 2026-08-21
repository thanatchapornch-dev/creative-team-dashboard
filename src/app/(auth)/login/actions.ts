"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPin } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const memberId = String(formData.get("memberId") ?? "");
  const pin = String(formData.get("pin") ?? "");

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) {
    redirect(`/login?error=invalid`);
  }

  const ok = await verifyPin(pin, member.pinHash);
  if (!ok) {
    redirect(`/login?error=invalid&member=${memberId}`);
  }

  await createSession(member.id);
  redirect("/dashboard");
}
