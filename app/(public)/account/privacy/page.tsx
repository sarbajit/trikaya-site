import { PrivacyActions } from "./PrivacyActions";

export default function AccountPrivacyPage() {
  return (
    <div>
      <p className="text-sm text-muted-foreground">Manage your data under GDPR/DPDP data subject rights.</p>
      <div className="mt-4">
        <PrivacyActions />
      </div>
    </div>
  );
}
