import { connectDB } from "@/lib/db";
import { ContactMessage } from "@/models/ContactMessage";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { PageHeader } from "../_components/PageHeader";

interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

const columns: DataTableColumn<ContactMessageRow>[] = [
  {
    key: "name",
    header: "From",
    sortValue: (row) => row.name,
    render: (row) => (
      <>
        <div className="font-medium text-foreground">{row.name}</div>
        <div className="text-xs text-muted-foreground">{row.email}</div>
      </>
    ),
  },
  {
    key: "message",
    header: "Message",
    className: "max-w-md",
    render: (row) => <p className="line-clamp-3 text-sm text-foreground">{row.message}</p>,
  },
  {
    key: "createdAt",
    header: "Received",
    sortValue: (row) => new Date(row.createdAt).getTime(),
    className: "whitespace-nowrap text-sm text-muted-foreground",
    render: (row) => new Date(row.createdAt).toLocaleString(),
  },
];

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
        <DataTable columns={columns} data={rows} rowKey={(row) => row.id} emptyMessage="No messages yet." />
      </div>
    </div>
  );
}
