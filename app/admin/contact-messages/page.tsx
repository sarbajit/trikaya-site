import { connectDB } from "@/lib/db";
import { ContactMessage } from "@/models/ContactMessage";
import { PageHeader } from "../_components/PageHeader";
import { ContactMessagesTable, type ContactMessageRow } from "./ContactMessagesTable";

export default async function AdminContactMessagesPage() {
  await connectDB();
  const messages = await ContactMessage.find().sort({ createdAt: -1 });

  const rows: ContactMessageRow[] = messages.map((m) => ({
    id: m._id.toString(),
    name: m.name,
    email: m.email,
    message: m.message,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Contact messages"
        description="Messages submitted through the public contact form, most recent first."
      />
      <div className="mt-6">
        <ContactMessagesTable rows={rows} />
      </div>
    </div>
  );
}
