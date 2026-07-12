import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Agent, type AgentStatus } from "@/models/Agent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const STATUS_COPY: Record<AgentStatus, { variant: "success" | "default" | "destructive"; message: string }> = {
  pending: {
    variant: "default",
    message: "Your application is under review. We'll notify you by email once it's processed.",
  },
  approved: {
    variant: "success",
    message: "Your business account is approved. B2B rates and booking tools are coming in a later phase.",
  },
  rejected: {
    variant: "destructive",
    message: "Your application was not approved. Contact us if you have questions.",
  },
  suspended: {
    variant: "destructive",
    message: "Your account has been suspended. Contact us for details.",
  },
};

export default async function AgentDashboardPage() {
  const session = await auth();
  if (session?.user?.role !== "agent") {
    redirect("/");
  }

  await connectDB();
  const agent = await Agent.findById(session.user.id);
  if (!agent) {
    redirect("/agent/login");
  }

  const copy = STATUS_COPY[agent.status];

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Welcome, {agent.contactPerson}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{agent.businessName}</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account status</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant={copy.variant}>
            <AlertDescription>{copy.message}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </main>
  );
}
