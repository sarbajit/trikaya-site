import { renderEmailLayout } from "./layout";

// Guest name/note come from an authenticated but still user-controlled form —
// escape before interpolating into the email HTML.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function bookingRequestedTemplate(params: {
  guestName: string;
  guestEmail: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  rooms: { roomTypeName: string; adults: number; childAges: number[] }[];
  totalAmount: number;
  currency: string;
  guestNote?: string;
  adminUrl: string;
}): { subject: string; html: string } {
  const { guestName, guestEmail, propertyName, checkIn, checkOut, rooms, totalAmount, currency, guestNote, adminUrl } =
    params;

  const roomsHtml = rooms
    .map(
      (room) =>
        `<li>${escapeHtml(room.roomTypeName)} — ${room.adults} adult${room.adults > 1 ? "s" : ""}${
          room.childAges.length > 0 ? `, ${room.childAges.length} child${room.childAges.length > 1 ? "ren" : ""}` : ""
        }</li>`
    )
    .join("");

  const bodyHtml = `
    <p><strong>Guest:</strong> ${escapeHtml(guestName)} (${escapeHtml(guestEmail)})</p>
    <p><strong>Property:</strong> ${escapeHtml(propertyName)}</p>
    <p><strong>Dates:</strong> ${checkIn} &rarr; ${checkOut}</p>
    <p><strong>Rooms:</strong></p>
    <ul>${roomsHtml}</ul>
    <p><strong>Total:</strong> ${currency} ${totalAmount.toLocaleString("en-IN")}</p>
    ${guestNote ? `<p><strong>Guest note:</strong> ${escapeHtml(guestNote).replace(/\n/g, "<br />")}</p>` : ""}
  `;

  return {
    subject: `New booking request from ${guestName}`,
    html: renderEmailLayout({
      title: "New booking request",
      bodyHtml,
      ctaLabel: "Review request",
      ctaUrl: adminUrl,
    }),
  };
}
