import { prisma } from "./prisma";

export async function nextTaskCode(): Promise<string> {
  const count = await prisma.task.count();
  return `TSK-${String(count + 1).padStart(4, "0")}`;
}
