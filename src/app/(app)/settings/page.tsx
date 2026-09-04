import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { sortLeaderFirst } from "@/lib/members";
import { ProfileSettingsForm } from "@/components/ProfileSettingsForm";
import { CompanySettingsForm } from "@/components/CompanySettingsForm";
import { MembersAdminSection } from "@/components/MembersAdminSection";
import { StoreUploadForm } from "@/components/StoreUploadForm";
import { EquipmentAdminSection } from "@/components/EquipmentAdminSection";

const STUCK_QUEUE_HOURS = 2;

async function getEmailQueueStats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [queued, oldestQueued, sentLast7Days, lastSent] = await Promise.all([
    prisma.notificationLog.count({ where: { channel: "EMAIL", status: "QUEUED" } }),
    prisma.notificationLog.findFirst({
      where: { channel: "EMAIL", status: "QUEUED" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.notificationLog.count({ where: { channel: "EMAIL", status: "SENT", createdAt: { gte: sevenDaysAgo } } }),
    prisma.notificationLog.findFirst({
      where: { channel: "EMAIL", status: "SENT" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const oldestQueuedHours = oldestQueued ? (Date.now() - oldestQueued.createdAt.getTime()) / (1000 * 60 * 60) : 0;

  return {
    queued,
    oldestQueuedHours,
    stuck: queued > 0 && oldestQueuedHours > STUCK_QUEUE_HOURS,
    sentLast7Days,
    lastSentAt: lastSent?.createdAt ?? null,
  };
}

export default async function SettingsPage() {
  const member = await getCurrentMember();
  if (!member) return null;
  const isAdmin = member.role === "LEADER" || member.role === "ADMIN";

  const [settings, membersRaw, emailStats, equipmentItems] = await Promise.all([
    getSettings(),
    isAdmin ? prisma.member.findMany({ orderBy: { createdAt: "asc" } }) : Promise.resolve([]),
    isAdmin ? getEmailQueueStats() : Promise.resolve(null),
    isAdmin ? prisma.equipmentItem.findMany({ orderBy: { sortOrder: "asc" } }) : Promise.resolve([]),
  ]);
  const members = sortLeaderFirst(membersRaw);

  return (
    <div className="flex flex-col gap-6 pt-2 max-w-3xl">
      <h1 className="text-xl font-bold">Settings</h1>

      <ProfileSettingsForm
        member={{
          nickname: member.nickname,
          position: member.position,
          workEmail: member.workEmail,
          profilePictureUrl: member.profilePictureUrl,
          statusToday: member.statusToday,
        }}
      />

      {isAdmin && (
        <>
          <CompanySettingsForm settings={settings} />
          <MembersAdminSection
            members={members.map((m) => ({
              id: m.id,
              nickname: m.nickname,
              role: m.role,
              workEmail: m.workEmail,
              dailyCapacityHours: m.dailyCapacityHours,
              profilePictureUrl: m.profilePictureUrl,
            }))}
          />
          {emailStats && (
            <div className="card p-4 flex flex-col gap-2">
              <h2 className="font-bold text-sm">📧 สถานะคิวอีเมล</h2>
              <div className="flex flex-wrap gap-4 text-sm">
                <span>
                  รอส่งตอนนี้ <strong>{emailStats.queued}</strong> ฉบับ
                </span>
                <span className="text-[var(--muted)]">
                  ส่งสำเร็จ 7 วันล่าสุด: {emailStats.sentLast7Days} ฉบับ
                </span>
                <span className="text-[var(--muted)]">
                  ส่งล่าสุดเมื่อ:{" "}
                  {emailStats.lastSentAt
                    ? emailStats.lastSentAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })
                    : "ยังไม่เคยส่ง"}
                </span>
              </div>
              {emailStats.stuck && (
                <p className="text-sm rounded-lg px-3 py-2 w-fit" style={{ background: "#fdeaea", color: "#a12b2b" }}>
                  ⚠️ มีอีเมลค้างในคิวมานานกว่า {Math.round(emailStats.oldestQueuedHours)} ชั่วโมง — ตัวส่งอีเมล (Apps Script)
                  อาจหยุดทำงาน ลองเช็ก trigger ใน Apps Script
                </p>
              )}
            </div>
          )}
          <StoreUploadForm />
          <EquipmentAdminSection
            items={equipmentItems.map((i) => ({ id: i.id, name: i.name, category: i.category, active: i.active }))}
          />
        </>
      )}
    </div>
  );
}
