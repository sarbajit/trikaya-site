import { BookingConfirmation } from "./_components/BookingConfirmation";

export default async function BookingConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <BookingConfirmation bookingId={id} />
    </main>
  );
}
