import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { sortLeaderFirst } from "@/lib/members";
import { ProfileSettingsForm } from "@/components/ProfileSettingsForm";
import { CompanySettingsForm } from "@/components/CompanySettingsForm";
import { MembersAdminSection } from "@/components/MembersAdminSection";

export default async function SettingsPage() {
  const member = await getCurrentMember();
  if (!member) return null;
  const isAdmin = member.role === "LEADER" || member.role === "ADMIN";

  const [settings, membersRaw] = await Promise.all([
    getSettings(),
    isAdmin ? prisma.member.findMany({ orderBy: { createdAt: "asc" } }) : Promise.resolve([]),
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
        </>
      )}
    </div>
  );
}
