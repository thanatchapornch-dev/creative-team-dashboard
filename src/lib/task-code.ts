import { prisma } from "./prisma";

/**
 * Based on the highest TSK-#### number ever issued, not a row count — a
 * count-based code collides with an existing taskCode (and every create
 * fails on the unique constraint) the moment any task has ever been
 * deleted, since the count then permanently undercounts the highest number
 * actually in use. Ignores non-"TSK-" codes (e.g. the GMAP- batch-import
 * codes), which are a separate numbering scheme.
 */
export async function nextTaskCode(): Promise<string> {
  const tasks = await prisma.task.findMany({
    where: { taskCode: { startsWith: "TSK-" } },
    select: { taskCode: true },
  });
  const maxNum = tasks.reduce((max, t) => {
    const n = parseInt(t.taskCode.slice(4), 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `TSK-${String(maxNum + 1).padStart(4, "0")}`;
}
