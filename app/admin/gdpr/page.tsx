import { connectDB } from "@/lib/db";
import { ConsentLog } from "@/models/ConsentLog";
import { PageHeader } from "../_components/PageHeader";
import { ConsentLogTable, type AuditRow } from "./ConsentLogTable";
import { GdprRequestsTable, type GdprRequestRow } from "./GdprRequestsTable";

export default async function AdminGdprPage() {
  await connectDB();
  const logs = await ConsentLog.find()
    .sort({ timestamp: -1 })
    .populate("userId", "name email")
    .populate("agentId", "contactPerson email")
    .limit(500);

  const auditRows: AuditRow[] = logs.map((log) => {
    const user = log.userId as unknown as { name?: string; email?: string } | null;
    const agent = log.agentId as unknown as { contactPerson?: string; email?: string } | null;
    const who = user?.name ?? agent?.contactPerson ?? (log.sessionId ? `Anonymous (${log.sessionId.slice(0, 8)})` : "Unknown");
    return {
      id: log._id.toString(),
      who,
      consentType: log.consentType,
      granted: log.granted,
      ip: log.ip,
      timestamp: log.timestamp.toISOString(),
    };
  });

  const fulfilledUserIds = new Set(
    logs.filter((l) => l.consentType === "data_deletion_fulfilled" && l.userId).map((l) => String(l.userId))
  );

  const requestRows: GdprRequestRow[] = logs
    .filter((l) => l.consentType === "data_export_request" || l.consentType === "data_deletion_request")
    .map((log) => {
      const user = log.userId as unknown as { name?: string; email?: string } | null;
      return {
        id: log._id.toString(),
        userId: log.userId ? String(log.userId) : undefined,
        name: user?.name ?? "Unknown user",
        email: user?.email ?? "",
        type: log.consentType as GdprRequestRow["type"],
        timestamp: log.timestamp.toISOString(),
        fulfilled: log.userId ? fulfilledUserIds.has(String(log.userId)) : false,
      };
    });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="GDPR & Privacy"
        description="Data subject requests and the full consent audit log."
      />

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Data requests</h2>
        <div className="mt-3">
          <GdprRequestsTable initialRows={requestRows} />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">Consent log</h2>
        <p className="mt-1 text-sm text-muted-foreground">Most recent 500 entries — proof-of-consent audit trail.</p>
        <div className="mt-3">
          <ConsentLogTable rows={auditRows} />
        </div>
      </div>
    </div>
  );
}
