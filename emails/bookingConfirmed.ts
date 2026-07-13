import { renderEmailLayout } from "./layout";

export function bookingConfirmedTemplate(params: {
  guestName: string;
  propertyName: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  currency: string;
  accountUrl: string;
}): { subject: string; html: string } {
  const { guestName, propertyName, roomTypeName, checkIn, checkOut, totalAmount, currency, accountUrl } = params;

  return {
    subject: `Booking confirmed — ${propertyName}`,
    html: renderEmailLayout({
      title: "Your booking is confirmed",
      bodyHtml: `<p>Hi ${guestName},</p><p>Your booking at <strong>${propertyName}</strong> is confirmed.</p><p><strong>Room:</strong> ${roomTypeName}<br /><strong>Check-in:</strong> ${checkIn}<br /><strong>Check-out:</strong> ${checkOut}<br /><strong>Total paid:</strong> ${currency} ${totalAmount.toLocaleString("en-IN")}</p><p>Your invoice is attached to this email.</p>`,
      ctaLabel: "View booking",
      ctaUrl: accountUrl,
    }),
  };
}
