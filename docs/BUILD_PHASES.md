# Build Phases — Paste One at a Time into Claude Code

General rule: run each phase in its own session (or with `/clear` between phases). Read the plan Claude produces before approving it. Don't move to the next phase until `npm run build` passes and you've clicked through the feature yourself.

---

### Phase 0 — Project Setup
```
Start in plan mode. Read /docs/PROJECT_SPEC.md sections 1, 8, and 9. Scaffold a new
Next.js (App Router, TypeScript strict) project deployable to Vercel, matching the
repo structure in spec section 9. Set up MongoDB connection via Mongoose with a
cached-connection helper safe for serverless. Set up Tailwind with a theme.css
driven by CSS variables for primaryColor/secondaryColor (placeholder values for now).
Create CLAUDE.md at project root from /docs/CLAUDE.md. Add a .env.example listing
the variables in spec section 8. Do not build any features yet — just scaffolding,
config, and a placeholder home page. Show me the plan before creating files.
```

### Phase 1 — Data Models
```
Plan mode. Read spec section 6 (Data Model). Create Mongoose schemas for every
collection listed: Users, Agents, Properties, RoomTypes, RatePlans, Availability,
Bookings, Reviews, SiteSettings, StaticPages, OTAConnections, ConsentLogs,
ContactMessages. Include indexes where lookups will be frequent (slug, roomTypeId+date,
email). Add TypeScript types generated from or alongside the schemas. Then write a
one-off seed script (scripts/seed.ts) that connects to MongoDB and inserts the data
from /data/seed-data.ts (propertiesSeed, roomTypesSeed, ratePlansSeed, agentsSeed,
siteSettingsSeed) via these models, resolving propertySlug/roomTypeName references
to real ObjectIds. Run it and confirm the data lands correctly — this is the fastest
way to catch schema mistakes before any UI is built. No UI yet.
```

### Phase 2 — Branding & Site Settings (do this early — colors cascade everywhere)
```
Plan mode. Build the SiteSettings singleton: API routes to read/update it, and an
admin page (basic auth-gated for now) to edit company name (+ show/hide toggle),
logo upload, primary/secondary color pickers, addresses/phones/emails/social links
(all dynamic add/remove lists), b2bEnabled toggle, contact recipient email. Wire the
color pickers to actually update the CSS variables used by Tailwind theme tokens
site-wide. Use the shared CloudinaryUploader component described in CLAUDE.md
(build it now if it doesn't exist) for the logo upload.
```

### Phase 3 — Auth
```
Plan mode. Implement NextAuth (Auth.js) with credentials provider, roles
(customer/agent/admin), JWT session. Build /register, /login, password reset flow,
email verification. Capture GDPR consent (checkbox + logged timestamp/IP/policy
version) at signup per spec section 5.11. Don't build agent-specific registration
yet — that's Phase 5.
```

### Phase 4 — Adaptive Public Frontend Shell
```
Plan mode. Read spec section 4. Build the home page with homepageMode logic
(auto/single/portfolio/portal based on live property count), the /properties
listing page with search/filter (destination, dates, guests, price, amenities),
and /properties/[slug] detail page layout (gallery, rooms, amenities, policies,
map placeholder, reviews placeholder — booking widget comes in Phase 7). Use the
data seeded from /data/seed-data.ts in Phase 1. Test both UI extremes explicitly:
(1) filter the DB down to a single property and confirm the home page renders as
a full single-property showcase, not an empty grid, then (2) restore all 9
properties and confirm the portal/portfolio view groups by destination and
search/filter works across all five destinations. Design should read as premium,
not templated — check /docs/PROJECT_SPEC.md section 4 design requirements.
```

### Phase 5 — B2B Agent Registration & Approval
```
Plan mode. Build /agent/register (business name, GSTIN optional, contact person,
business-proof document upload via CloudinaryUploader) creating an Agent with
status "pending". Build the admin approval queue: view uploaded documents,
approve/reject/suspend. Approved + logged-in agents should have role "agent" on
their session with an "approved" flag.
```

### Phase 6 — Rates, Availability & Admin Property Management
```
Plan mode. Read spec sections 5.2, 5.3, 5.10. Build full admin CRUD for
Properties and RoomTypes (including pricingModel per_night/per_person_per_night,
B2C/B2B base rates), RatePlans (seasonal/date overrides), and the availability
calendar (visual, bulk block/unblock). Build the single shared server-side
pricing function described in spec 5.2 that both the availability-check API and
booking API will use — this must be the only place price gets calculated.
```

### Phase 7 — Booking Flow + Razorpay
```
Plan mode. Read spec sections 5.3 and 5.4. Wire the property detail page's
booking widget to: check availability -> get quote from the shared pricing
function -> create Razorpay order server-side -> Razorpay Checkout -> verify
webhook signature server-side -> decrement Availability -> mark Booking
confirmed. Never trust client-reported payment success alone. Show a booking
confirmation page.
```

### Phase 8 — Invoices & Email
```
Plan mode. Read spec section 5.5. On booking confirmation, generate a PDF
invoice (company details from SiteSettings, booking + rate breakdown, invoice
number using invoicePrefix) and email it automatically via the configured email
provider. Make the same invoice downloadable from /account/bookings/[id].
```

### Phase 8.5 — Admin Panel Visual Overhaul (no functional changes)
Plan mode. The admin panel currently works correctly but looks dated — same
Radix UI + lucide-react stack, but inconsistent spacing, layout, and visual
hierarchy across pages. This phase is presentation-only: every existing
feature, API route, validation rule, and data-fetching call must keep working
exactly as it does now. Do not touch business logic, route handlers, or prop
contracts between components and their data — only restructure markup, styling,
and shared UI primitives.

Before changing anything, do an inventory pass: list every existing admin page
and the ad-hoc UI patterns each one uses (tables, forms, buttons, badges,
dialogs, empty states) so we can see what's duplicated vs. reusable.

Then build a small shared admin component set (on top of the existing Radix
primitives — consider adopting shadcn/ui conventions since it's Radix +
Tailwind under the hood and directly compatible with what's already installed):
  - Consistent app shell: collapsible sidebar grouped by section (Dashboard,
    Properties, Bookings, Agents, Reviews, Content, Settings), topbar with
    admin user menu, breadcrumbs.
  - A shared DataTable (sortable columns, pagination, empty state, loading
    skeleton) and retrofit every existing admin list view (properties,
    bookings, agents, reviews, etc.) onto it.
  - Shared form layout primitives (label + field + error message pattern) and
    retrofit existing forms onto them, keeping the same fields and validation.
  - Status badges/pills for booking status, agent approval status, review
    moderation status — consistent color coding, used everywhere that status
    already appears.
  - Shared Dialog pattern (Radix Dialog) for confirmations (approve/reject
    agent, cancel booking, delete property) replacing any ad-hoc confirm()
    calls or one-off modals.
  - Toast notifications (Radix Toast) for action success/failure, replacing
    any inline "Saved!" text or alert()s.
  - Loading skeletons instead of blank screens or spinner-only states.

Admin panel gets its own clean, neutral base theme (grays/whites, ideally
dark-mode-ready) — do NOT apply SiteSettings.primaryColor/secondaryColor as
the dominant palette here. Use the brand colors only as a small accent:
primary action buttons and the active sidebar nav indicator. This is
different from the public site, where those colors should be dominant.

Go page by page through the existing admin panel (branding/site settings,
properties, room types, rate plans, availability calendar, agent approval
queue, bookings, reviews moderation, static pages, contact settings) and
apply the shared primitives. After each page, confirm every button, form
submit, and data load still behaves identically to before — this is a visual
refactor, not a rebuild. Note: there is currently no dedicated Dashboard/KPI
landing page for admin (spec section 3 lists one, but no phase has built it
yet) — flag this back to me rather than building new KPI logic under this
visual-only phase; we'll scope that as its own phase separately.

### Phase 9 — Booking History, Account Pages, Reviews
```
Plan mode. Build /account/bookings (list + detail + invoice download) and
/account/reviews. Build the review submission flow per spec 5.7 (must have a
completed booking for that property to review), and the admin moderation queue.
```

### Phase 10 — Static Pages, Contact Form, GDPR
```
Plan mode. Read spec sections 5.9 and 5.11. Build the StaticPages admin editor
(Terms, Privacy Policy, Refund/Cancellation Policy, About Us) reflected on their
public pages. Build the contact form -> email to SiteSettings.contactRecipientEmail.
Build the cookie consent banner (categorized, blocking non-essential scripts
until consent) and a basic data export/deletion request flow (self-serve or
admin-assisted) with entries logged to ConsentLogs.
```

### Phase 11 — OTA Channel Sync
```
Plan mode. Read spec section 5.6 carefully — this integrates with a channel
manager, not Booking.com/MakeMyTrip directly. Build the ChannelManagerAdapter
interface, a webhook endpoint that updates Availability immediately on
incoming events, a Vercel Cron job for nightly reconciliation, and the admin
OTA connection settings screen with a "not connected" manual fallback state
for properties without a channel manager yet. I will provide real channel
manager API docs/credentials once we choose a provider — for now, build against
a mocked adapter implementation so the architecture is provable.
```

### Phase 12 — SEO/GEO, Polish, Security Pass, Deploy
```
Plan mode. Read spec sections 5.12 and 7. Add Hotel/LodgingBusiness JSON-LD
schema per property, sitemap.xml, robots.txt, editable meta tags. Add custom
404/500 pages and empty states across the app. Run a security pass: rate
limiting on auth/booking/contact endpoints, secure headers, confirm no secrets
are exposed client-side. Then walk me through deployment to Vercel including
required environment variables.
```
