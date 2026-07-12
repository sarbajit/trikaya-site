# Multi-Property Hotel & Resort Booking Platform
## Master Product & Technical Specification

**Purpose of this document:** This is the source of truth for what the website must do. Keep it in the repo (e.g. `/docs/PROJECT_SPEC.md`) and point Claude Code at it at the start of every phase. Do not paste this whole file as one instruction — feed it in phases (see `BUILD_PHASES.md`).

---

## 0. Business Context

**property listing & booking website** — covering hotels, resorts, and homestays owned by a company. Property count will range from 1 to hundreds over time, and the UI must not look broken or empty at either extreme.

---

## 1. Tech Stack (locked decisions)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) | Deployed on Vercel |
| Language | TypeScript | Strict mode on |
| Database | MongoDB (Atlas) via Mongoose | Cached connection pattern for serverless |
| Auth | NextAuth.js (Auth.js) | Credentials + optional Google OAuth; JWT session; role field (customer / agent / admin) |
| Payments | Razorpay | Checkout + server-side order creation + webhook verification |
| Media | Cloudinary | Signed uploads from client, transformations for responsive images |
| Email | SMTP | Transactional templates via React Email or MJML |
| Styling | Tailwind CSS | Design tokens driven by admin-configured colors |
| Validation | Zod | Shared client/server schemas |
| PDF (invoices) | `@react-pdf/renderer` or `pdf-lib` | Generated server-side, emailed + downloadable |
| Calendar/scheduling | Custom availability collection | See Section 5 |
| Cron | Vercel Cron → API route | Nightly OTA reconciliation |
| Optional | Upstash Redis | Rate limiting on auth/booking endpoints if traffic grows |

---

## 2. Gaps Filled Beyond the Original Brief

These weren't explicitly stated but are required for the system to actually work in production. Flagging them so nothing is a surprise later:

1. **Search & filter** on the property listing page — destination, dates, guests, price range, amenities. Without this, "hundreds of properties" is unusable.
2. **Room-type-level inventory**, not just property-level — a property has multiple room types, each with its own rate and stock count.
3. **Seasonal/date-based rate overrides** — weekday/weekend/season pricing, not a single flat rate forever.
4. **B2B agent approval workflow** — agents register but must be approved by admin before their account activates and B2B rates apply; also suspend/reject states.
5. **Password reset / email verification** flow.
6. **Cookie consent banner** with granular categories (necessary/analytics/marketing) — required for actual GDPR compliance, not just a privacy policy page.
7. **Data subject rights handling** — a way for users to request data export/deletion (self-serve or via admin), and consent logging with timestamps for proof of compliance.
8. **India-specific note:** since your customers and business are India-based, GDPR compliance alone won't cover you legally — India's **DPDP Act 2023** will likely apply too. Worth a short legal review; the technical measures below (consent capture, data minimization, deletion handling) largely satisfy both, but the notice/consent language should be checked against DPDP too.
9. **Invoice numbering & basic tax fields** (GSTIN of business, place of supply) since invoices in India have expectations even for a simple B2B/B2C site.
10. **404/500 error pages**, empty states (no results found, no bookings yet, no reviews yet).
11. **SEO/structured data** — `LodgingBusiness`/`Hotel` schema.org markup per property, sitemap.xml, robots.txt, per-page meta tags editable from admin. Given your existing interest in GEO (AI-assisted search visibility), structured, FAQ-rich property pages will help there too.
12. **Manual booking creation** in admin, for phone/walk-in bookings, so the availability calendar stays accurate even for offline sales.
13. **Audit trail** for admin actions (who changed a rate, who approved an agent) — lightweight, but important once more than one admin user exists.
14. **Real-time OTA sync realism check** — see Section 5.6. This needs a channel-manager subscription; Claude Code builds the integration layer, not the OTA relationship.

---

## 3. Information Architecture (Pages)

**Public**
- `/` — Home (adaptive layout, see Section 4)
- `/properties` — Listing with search/filter (destination, dates, guests, price(if logged in as B2B agent, price will be B2B), amenities)
- `/properties/[slug]` — Property detail: gallery slider, rooms, rates(if logged in as B2B agent, price will be B2B), amenities, policies, map, reviews, availability/booking widget
- `/destinations/[slug]` — Optional: properties grouped by destination (Sikkim, Darjeeling, etc.)
- `/about`, `/terms`, `/privacy-policy`, `/refund-cancellation-policy` — CMS-driven static pages
- `/contact` — Form → emails admin-configured recipient
- `/login`, `/register` — Customer auth
- `/agent/register`, `/agent/login` — B2B agent auth + document upload
- `/404`, `/500`
- `/sitemap.xml`, `/llms.txt` - update dynamically once a property or a rate is updated

**Customer (authenticated)**
- `/account` — Profile
- `/account/bookings` — Booking history
- `/account/bookings/[id]` — Booking detail + invoice download
- `/account/reviews` — Reviews submitted

**Agent (authenticated, approved)**
- `/agent/dashboard` — Availability + B2B rates
- `/agent/bookings` — Their booking history

**Admin** (`/admin/...`)
- Dashboard (KPIs)
- Branding & company settings
- Static page content editor
- Properties (CRUD, rooms, rates, media, policies, OTA connections)
- Availability calendar
- Bookings (view/search/manual create/cancel/refund)
- B2B agents (approval queue, rate tiers, enable/disable B2B globally)
- Reviews moderation
- Contact form settings
- GDPR/consent log viewer
- SEO settings

---

## 4. Adaptive Frontend UI/UX

The system must detect (or let admin override) a **homepage mode**:

- **Single property (1 property):** Home page *is* the property showcase — hero with booking widget, full gallery, room types, amenities, location map, reviews. No "browse all properties" grid that would look empty.
- **Small portfolio (2–10):** Home groups properties by destination with rich cards; no heavy search UI needed yet.
- **Large catalogue (10s–100s):** Home becomes a discovery portal — hero search bar (destination/dates/guests), featured/curated collections, popular destinations, testimonials. `/properties` gets full filtering, pagination or infinite scroll, and optional map view.

Implement this as a config flag (`auto | single | portfolio | portal`) in admin, defaulting to `auto` based on live property count, so the site never looks broken at either extreme.

**Design requirements:**
- Premium feel: generous whitespace, high-quality imagery, restrained typography, subtle motion — not a generic template look.
- Primary/secondary/accent color set in admin → exposed as CSS variables/Tailwind theme tokens → used consistently site-wide (buttons, links, headers, badges).
- Fully responsive; image-heavy pages use `next/image` + Cloudinary transformations for performance.
- Empty states designed intentionally (no bookings yet, no reviews yet, no search results) rather than left blank.

---

## 5. Functional Modules

### 5.1 Authentication
- Customers: email/password (+ optional Google) via NextAuth, email verification, password reset.
- Agents: separate registration form collecting business name, GSTIN (optional), contact person, and a business-proof document upload (Cloudinary) — account starts `pending`, inactive until admin approves. In any occassion, notify to admin via email, wherever applicable 
- Roles: `customer`, `agent`, `admin` (optionally `property_manager` later). Session carries role + agent approval status.
- GDPR: consent checkbox (privacy policy acceptance) required at signup, logged with timestamp.

### 5.2 Rates & Pricing Engine
- Each **room type** has: `pricingModel` (`per_night` or `per_person_per_night`), `basePriceB2C`, `basePriceB2B`.
- **Seasonal/date rate overrides**: date-range records that override base price (weekday/weekend variants supported).
- B2B pricing only applies if (a) B2B is globally enabled in admin AND (b) the logged-in agent is approved. Otherwise B2C rate always shown.
- Price calculation must be a single shared server-side function used by both the availability-check API and the booking-creation API, so quoted price and charged price can never drift.

### 5.3 Availability & Booking Engine
- `Availability` collection: one record per `roomType + date` with `totalUnits`, `booked`, `blocked`.
- Booking flow: search (dates + guests) → shared pricing/availability function returns quote → user confirms → Razorpay order created → payment → webhook confirms → availability decremented → booking status `confirmed` → confirmation email + invoice generated.
- Cancellations: release inventory back, apply refund policy rules (from CMS refund/cancellation policy), trigger Razorpay refund (admin-initiated; do not auto-refund without admin action, since refund rules vary).

### 5.4 Payments — Razorpay
- Server creates the order (never trust client-submitted amounts).
- Verify payment via Razorpay webhook signature server-side before marking a booking confirmed — checkout-callback success alone is not sufficient.
- Store `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` on the booking for audit.

### 5.5 Invoices & Confirmation Email
- On confirmed booking: generate a PDF invoice (booking ref, guest/agent details, property, room, dates, rate breakdown, tax fields, company details from admin branding settings) and send it as an email attachment automatically.
- Same invoice downloadable anytime from `/account/bookings/[id]`.

### 5.6 OTA Channel Sync — Architecture & Reality Check
**Reality check (read this before building):** Booking.com and MakeMyTrip do not provide open APIs to individual small properties. Two-way, real-time sync is done through a **channel manager** that already holds certified connections to the OTAs (examples: eZee Absolute, STAAH, RateGain, Cloudbeds, Hotelogix). This is a vendor relationship + subscription the business needs to set up — Claude Code cannot create that connectivity on its own. 

**What Claude Code should build:**
- A generic **ChannelManagerAdapter** interface: `pullAvailability()`, `pushAvailability()`, `handleWebhook(payload)`.
- One concrete implementation per channel manager you actually sign up with (encrypted API credentials stored per property or globally in `OTAConnections`, set from admin).
- A webhook endpoint (`/api/webhooks/channel-manager`) that updates the `Availability` collection **immediately** when the channel manager reports a new OTA booking — this satisfies the "no waiting for nightly cron" requirement.
- A nightly Vercel Cron job (`/api/cron/sync-availability`, protected by a secret) as a reconciliation fallback in case a webhook is missed.
- **Manual fallback mode:** for properties without a channel manager yet, admin gets a manual "block/unblock dates" control and a visible "Not connected to any OTA" status, so the feature degrades gracefully instead of failing.

### 5.7 Reviews
- Only registered guests with a completed booking for that property can submit a review (verified against `Bookings`).
- Reviews go to `pending` status, admin approves/rejects before they show publicly.

### 5.8 Media — Cloudinary
- A single reusable `<CloudinaryUploader>` component used everywhere images are needed: property gallery, room images, agent business-proof docs, company logo, review photos (if allowed).
- Signed upload requests generated server-side (never expose the API secret to the client).

### 5.9 Contact Form
- Submits to an API route that sends email to the admin-configured recipient address (stored in Site Settings), and logs the message for reference.

### 5.10 Admin Panel — Full Feature List
- Company/branding: logo, company name (optional — toggle to hide and show logo-only), address(es) (dynamic, add/remove), phone numbers (dynamic), contact emails (dynamic), social links (dynamic), primary/secondary/accent color pickers.
- Static content editor: Terms & Conditions(rich text), Privacy Policy(rich text), Refund/Cancellation Policy(rich text), About Us (rich text), reflected automatically wherever referenced site-wide.
- Properties: full CRUD, room types, rate plans (B2C/B2B, per-night/per-person), policies, gallery, OTA connection settings.
- Availability calendar: visual, per property/room type, bulk block/unblock, sync status indicator.
- Bookings: search/filter, manual creation, cancel/refund, invoice re-send.
- B2B: global enable/disable toggle, agent approval queue (view uploaded proof documents), approve/reject/suspend, optional per-agent custom rate tier.
- Reviews: moderation queue.
- Contact settings: recipient email.
- GDPR: consent log viewer, data request handling.
- SEO: default meta tags, sitemap regeneration trigger.

### 5.11 GDPR Compliance Checklist
- Cookie consent banner, categorized, blocking non-essential scripts until consent given.
- Privacy policy acceptance logged at signup (user id, timestamp, IP, policy version).
- Self-serve or admin-assisted data export and account deletion request flow.
- Encrypt sensitive data at rest: agent business-proof documents, stored OTA/channel-manager API credentials.
- Data minimization: don't collect fields you don't use.
- Third-party processors (Cloudinary, Razorpay, MongoDB Atlas, email provider) listed in the privacy policy.
- Right to be forgotten balanced against legal/accounting retention needs for financial records — anonymize rather than hard-delete booking/invoice records tied to tax obligations, delete personal profile data.

### 5.12 SEO / GEO
- `Hotel`/`LodgingBusiness` JSON-LD schema per property page.
- Auto-generated `sitemap.xml`, `llms.txt` and `robots.txt`.
- Editable meta title/description per property and static page.
- FAQ schema on relevant pages (helps both classic SEO and AI-answer visibility, which ties into the GEO work you've explored before).
- Enforce alt text on all uploaded images via the uploader component.

---

## 6. Data Model (MongoDB Collections)

- **Users** — name, email, phone, passwordHash, role, gdprConsent{version, timestamp, ip}, createdAt
- **Agents** — businessName, gstin?, contactPerson, email, phone, proofDocUrls[], status(pending/approved/rejected/suspended), rateTier?, approvedBy, approvedAt
- **Properties** — name, slug, destination, address, geo{lat,lng}?, description, amenities[], images[], starRating?, policies{}, isActive, homepageMode?
- **RoomTypes** — propertyId, name, maxOccupancy, pricingModel, basePriceB2C, basePriceB2B, images[], totalInventory
- **RatePlans** — roomTypeId, startDate, endDate, b2cRate, b2bRate, daysOfWeek[]
- **Availability** — roomTypeId, date, totalUnits, booked, blocked
- **Bookings** — userId/agentId, propertyId, roomTypeId, checkIn, checkOut, guests, pricingModelUsed, totalAmount, currency, paymentStatus, razorpay{orderId,paymentId,signature}, invoiceNumber, status, source(website/ota), createdAt
- **Reviews** — userId, propertyId, bookingId, rating, comment, status
- **SiteSettings** (singleton) — companyName, showCompanyName, logoUrl, primaryColor?, secondaryColor?, accentColor?, addresses[], phones[], emails[], socialLinks[], contactRecipientEmail, b2bEnabled, invoicePrefix, taxSettings{gstin}
- **StaticPages** — slug, title, content, updatedAt
- **OTAConnections** — propertyId (or global), provider, encryptedCredentials, syncMode, lastSyncedAt, status
- **ConsentLogs** — userId/sessionId, consentType, granted, timestamp, ip
- **ContactMessages** — name, email, message, createdAt

---

## 7. Non-Functional Requirements

- ISR (`revalidate`) for property/listing pages, with on-demand `revalidatePath` triggered from admin edits.
- Server-side Zod validation on every write endpoint, mirrored client-side for UX.
- Rate limiting on auth, booking, and contact endpoints.
- Secure headers via `next.config.js`; CSRF protection on state-changing routes.
- Structured error handling + user-facing error boundaries; custom 404/500 pages.
- Recommended: Playwright tests for the critical path (search → book → pay → invoice) before go-live.
- Encrypt secrets (OTA credentials) with a server-side key (`ENCRYPTION_KEY`), never store plaintext.

## 8. Environment Variables (expected)

```
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_PROVIDER_API_KEY=
CRON_SECRET=
ENCRYPTION_KEY=
```

## 9. Suggested Repo Structure (App Router)

```
/app
  /(public)/page.tsx
  /(public)/properties/page.tsx
  /(public)/properties/[slug]/page.tsx
  /(public)/about, /terms, /privacy-policy, /refund-cancellation-policy, /contact
  /(public)/login, /register, /agent/register, /agent/login
  /(customer)/account/...
  /(agent)/agent/dashboard, /agent/bookings
  /admin/...
  /api/auth/[...nextauth]
  /api/bookings, /api/payments/razorpay, /api/payments/webhook
  /api/ota/webhook, /api/cron/sync-availability
  /api/reviews, /api/contact, /api/uploads/cloudinary-sign
/models        (Mongoose schemas)
/lib           (db.ts, auth.ts, razorpay.ts, cloudinary.ts, email.ts, pricing.ts, ota/*)
/components
/emails
/docs/PROJECT_SPEC.md, /docs/CLAUDE.md
```
