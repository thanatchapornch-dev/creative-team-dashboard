import { prisma } from "./prisma";

export type ThemeColors = {
  navy: string;
  offwhite: string;
  orange: string;
  lime: string;
};

export type ResolvedSettings = {
  id: number;
  companyName: string;
  workingDays: string[];
  holidays: string[];
  annualLeaveNoticeDays: number;
  approvalSlaDays: number;
  taskReminderDaysBefore: number;
  themeColors: ThemeColors;
};

export async function getSettings(): Promise<ResolvedSettings> {
  let row = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!row) {
    row = await prisma.settings.create({ data: { id: 1 } });
  }
  return {
    id: row.id,
    companyName: row.companyName,
    workingDays: row.workingDays.split(",").filter(Boolean),
    holidays: JSON.parse(row.holidays) as string[],
    annualLeaveNoticeDays: row.annualLeaveNoticeDays,
    approvalSlaDays: row.approvalSlaDays,
    taskReminderDaysBefore: row.taskReminderDaysBefore,
    themeColors: JSON.parse(row.themeColors) as ThemeColors,
  };
}

export async function updateSettings(patch: {
  companyName?: string;
  workingDays?: string[];
  holidays?: string[];
  annualLeaveNoticeDays?: number;
  approvalSlaDays?: number;
  taskReminderDaysBefore?: number;
  themeColors?: ThemeColors;
}) {
  const data: Record<string, unknown> = {};
  if (patch.companyName !== undefined) data.companyName = patch.companyName;
  if (patch.workingDays !== undefined) data.workingDays = patch.workingDays.join(",");
  if (patch.holidays !== undefined) data.holidays = JSON.stringify(patch.holidays);
  if (patch.annualLeaveNoticeDays !== undefined) data.annualLeaveNoticeDays = patch.annualLeaveNoticeDays;
  if (patch.approvalSlaDays !== undefined) data.approvalSlaDays = patch.approvalSlaDays;
  if (patch.taskReminderDaysBefore !== undefined) data.taskReminderDaysBefore = patch.taskReminderDaysBefore;
  if (patch.themeColors !== undefined) data.themeColors = JSON.stringify(patch.themeColors);

  return prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });
}
