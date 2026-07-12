# CLAUDE.md — QuickTrails Booking Platform

Full requirements live in `/docs/PROJECT_SPEC.md`. Read the relevant section there before starting a phase — do not guess at requirements this file doesn't cover.

## TIER 1 — Hard Rules (never violate)
- Never trust client-submitted prices or Razorpay payment status. Always recompute price server-side and verify Razorpay webhook signatures before confirming a booking.
- Never store OTA/channel-manager credentials, or any secret, in plaintext. Use `ENCRYPTION_KEY` (see `/lib`).
- Never commit `.env*` files or secrets to git.
- Every write endpoint validates input with Zod server-side, even if the client also validates.
- Primary/secondary brand colors come from `SiteSettings` in the DB, not hardcoded — every new component must consume the theme tokens, not fixed hex values.
- B2B rates must only render for logged-in, **approved** agents, and only when `SiteSettings.b2bEnabled` is true. Default to B2C rate otherwise.
- Any image upload anywhere in the app goes through the shared `<CloudinaryUploader>` component — don't build one-off upload logic per page.

## TIER 2 — Working Agreement
- Before touching any file: is the task unambiguous and small (single file, <30 min of work)? If yes, proceed. If no — **enter plan mode first**, propose the approach, list affected files, and wait for approval before editing.
- If execution diverges from an approved plan mid-task, stop and re-enter plan mode rather than improvising.
- State assumptions explicitly. If a requirement in `PROJECT_SPEC.md` is ambiguous for the current task, ask rather than guessing.
- After finishing a phase, run the build (`npm run build`) and fix errors before considering it done.
- Keep commits scoped to one phase/feature; write a real commit message, not "updates".

## Stack Reminders
- Next.js App Router + TypeScript strict mode. Mongoose with a cached connection helper (serverless-safe). NextAuth (Auth.js) for auth with `customer | agent | admin` roles. Tailwind with theme tokens driven by admin settings. Razorpay, Cloudinary, Resend/SendGrid — client init helpers live in `/lib`.

## Known Constraint
- Direct OTA (Booking.com/MakeMyTrip) APIs are not available to individual properties. OTA sync integrates with a channel-manager API via the `ChannelManagerAdapter` interface (see spec §5.6) — do not attempt to build a direct Booking.com/MMT integration.
