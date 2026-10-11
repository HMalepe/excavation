import { pageRole } from "@/lib/auth/guards";
import { StaffShell, STAFF_NAV } from "@/components/ui/StaffShell";
import { PrivacyTool } from "@/components/client/PrivacyTool";

export const dynamic = "force-dynamic";
export const metadata = { title: "Privacy requests" };

export default async function PrivacyPage() {
  await pageRole(["excavation_staff"]);
  return (
    <StaffShell title="Privacy requests" nav={STAFF_NAV}>
      <p className="text-muted">For a parent or guardian who asks to see, take a copy of, or delete their child&apos;s information (POPIA). Everything here is written to the audit log. Confirm who is asking before you export or erase anything.</p>
      <PrivacyTool />
    </StaffShell>
  );
}
