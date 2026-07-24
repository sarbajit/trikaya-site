"use client";

export function WhatsAppFloater({ whatsappNumber }: { whatsappNumber?: string }) {
  if (!whatsappNumber) return null;

  return (
    <a
      href={`https://wa.me/${whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-accent-foreground shadow-lg transition-transform hover:scale-105"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2Zm0 1.67c2.19 0 4.25.85 5.8 2.4a8.2 8.2 0 0 1 2.41 5.84c0 4.55-3.7 8.25-8.25 8.25a8.24 8.24 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.39c0-4.55 3.7-8.24 8.25-8.24Zm-4.53 4.6c-.16 0-.42.06-.65.31-.22.25-.85.83-.85 2.03s.87 2.36.99 2.52c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.19 1.11.16 1.53.1.47-.07 1.43-.58 1.63-1.15.2-.56.2-1.05.14-1.15-.06-.1-.22-.16-.47-.28-.24-.13-1.44-.71-1.66-.79-.22-.08-.39-.13-.55.13-.16.25-.63.79-.78.95-.14.16-.28.18-.53.06-.24-.13-1.03-.38-1.96-1.21-.72-.65-1.21-1.44-1.35-1.69-.14-.25-.02-.38.11-.51.11-.11.24-.28.37-.42.12-.14.16-.25.24-.4.08-.16.04-.31-.02-.44-.06-.13-.55-1.35-.76-1.84-.2-.48-.4-.42-.55-.42Z" />
      </svg>
    </a>
  );
}
