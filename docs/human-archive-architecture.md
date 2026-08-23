# HUMAN:HERE — Human Archive architecture and audit

## Phase 1 audit — 2026-08-23

- Runtime: Next.js 16.3.2 App Router, React 19.2.8, TypeScript 5, React Compiler.
- Styling: one global stylesheet; Geist is loaded through `next/font`.
- Existing motion: D3 and GSAP support a legacy `/people` force map but are not needed by the semantic archive prototype.
- Media: five local development images in `public/images`; none are approved production stories.
- Data: TypeScript fixtures only. No database, durable drafts, consent ledger, moderation queue, or private upload path exists.
- Supabase: no SDK packages, clients, config, migrations, CLI, environment files, or known environment variable names existed at audit time.
- Vercel: no repository-level `vercel.json` or linked `.vercel` metadata exists. The app is compatible with Vercel's zero-config Next.js deployment, but deployment environment values and scheduled jobs remain external setup tasks.
- Cache: public archive reads were uncached in-process fixture reads; progressive batches came from a Client Component calling `/api/humans`. There were no resource tags, publication invalidation hooks, or CDN-aware server repository reads.
- Media: current archive artifacts use `next/image`, responsive `sizes`, lazy defaults, and priority on three opening images. The records were still coupled to presentation URLs and had no provider/variant resolver.
- Security: no authentication or authorization existed. Public fixture records were visibly marked but the former repository contract did not itself encode `published` and verified-consent reads.
- Quality baseline: the archive prototype passed lint, TypeScript, and a production Webpack build before this infrastructure phase.

The application can retain the App Router, server/client component split, `next/image`, Geist, local development media, and the new semantic archive field. Supabase becomes the system of record immediately after the content contracts below are finalized.

## Scaling risks found

- The former fixture cursor was an array offset and cannot become the production pagination strategy.
- The browser-owned progressive fetch path can remain an enhancement, but initial and story reads must be server-only and cacheable.
- A raw table-shaped public response could accidentally grow to include consent or editorial fields; a narrow public projection is mandatory.
- Publication, edit, removal, and consent revocation had no targeted cache invalidation path.
- Legacy D3/GSAP code mounts a second archive implementation and carries unnecessary client weight.
- There was no private-to-public media promotion boundary, upload restriction, signed review URL, or future video-provider seam.
- Admin and moderation views did not exist; any implementation must use bounded indexed cursors rather than whole queues.
- Social discovery did not exist; it must remain asynchronous and isolated from public renders.

## Infrastructure retained

- Next.js 16 App Router and React Server Components for a small client bundle.
- Dynamic routes and `generateMetadata` for stable, shareable human-story URLs.
- `next/image` for responsive image derivatives, lazy loading, and layout stability.
- Geist as the licensed interface grotesk.
- Existing local development portraits and documentary image fixtures.
- Existing About, Get Involved, Give, and Contact content where it remains useful.

## Frontend being replaced

- The brochure homepage sequence and every homepage-specific marketing section.
- The conventional announcement/header/footer chrome on the archive experience.
- The D3/GSAP force map and split archive panel.
- The legacy `/people` card grid and conventional story-page template.
- Homepage-specific section, statistic, card, icon-grid, CTA, and hero CSS.

## New information architecture

- `/` — curated opening of the Human Archive.
- `/humans` — larger progressive archive.
- `/humans/[slug]` — shareable immersive artifact/story viewer.
- `/share` — authenticated, autosaving private submission flow designed around moderation and explicit consent.
- `/account` — My HUMAN:HERE: owned drafts, statuses, consent, change/removal controls.
- `/about` — Why We Show Up / Christian foundation.
- `/get-involved` — Give, Volunteer, Partner, Pray.
- `/give` and `/contact` — retained utility routes.
- `/remove-my-story` — public entry point to a verified removal workflow.
- `/admin/submissions`, `/admin/social`, `/admin/consent`, `/admin/removal-requests` — server-authorized staff tools.
- `/people` and `/people/[slug]` — temporary compatibility redirects to `/humans` routes.

## Scaling approach

The archive uses normal semantic DOM, CSS Grid, and vertical exploration. The first
batch is server-rendered; later batches are requested by cursor only when a visitor
reaches the archive boundary. Images use `next/image`, only first-viewport images are
prioritized, route prefetch is disabled for large artifact lists, and future providers
can replace fixture content without changing components.

The public provider contract exposes only `listPublished`, `getPublishedBySlug`, and
`getPublishedAdjacent`. The Supabase implementation must enforce `published = true`
and `consent_verified = true` in every server-side query. The fixture provider is development-only and
every fixture is visibly labeled `DEV_FIXTURE`.

Authentication identity, account email, private needs, internal notes, raw submissions,
consent evidence, referrals, and moderation records are deliberately absent from
`HumanEntry`. A public identity may be anonymous even when its owner has an authenticated
private account.

## Supabase boundary

- Browser clients use only the publishable key and act under authenticated RLS.
- Server Components and Route Handlers use cookie-bound SSR clients; privileged workflows use a server-only service-role client.
- User uploads begin in `submission-private`; social review assets begin in `social-review-private`.
- `published-media` contains only assets copied there by an authorized publication workflow.
- Hashtag discovery is private moderation input, never a public feed and never evidence of consent.
- Every state-changing admin operation is authorized again on the server and constrained in Postgres.

## Public traffic and caching

Public traffic follows Browser → Vercel CDN / Next cache → cached server repository →
Supabase REST/Postgres only on cache miss or revalidation. The public repository uses a
cookie-free publishable-key client so a visitor session can never vary shared cache data.
It selects an explicit column list from `human_entries_public`; it never reads submissions,
consent evidence, moderation notes, referrals, private locations, or account contact data.

Cache tags are deliberately small in scope:

- `human-entry:{slug}` — one story and its metadata.
- `human-list` — cursor archive batches and adjacency.
- `featured-humans` — editorial homepage choices.
- `human-homepage` — the curated opening field.

Normal edits use stale-while-revalidate. Unpublish, removal, and consent revocation use
immediate expiry for the affected story and collection tags. Public list and story queries
are ordered by `(published_at desc, id desc)` and use opaque keyset cursors, never offsets.
The database has matching partial indexes for all-public, type-filtered, and featured reads.

## Authenticated traffic

Supabase Auth supports Google, Apple, and email magic links. The code uses current
`@supabase/ssr` cookie handling through Next 16 `proxy.ts`; authorization is rechecked in
Server Actions and private repositories. Browsing is anonymous. Draft creation, autosave,
upload, status, consent, removal, and staff access are authenticated and enforced by RLS.
The deployment uses Supabase's HTTP clients rather than long-lived unmanaged Postgres
connections from Vercel functions.

## Media and publication

`MediaAsset` stores a provider plus path/identifier, MIME type, dimensions, duration, and
optional placeholder—not a provider URL. `resolveMediaUrl` is the only public delivery
adapter. User media starts in `submission-private`; social review media starts in
`social-review-private`; only a staff-authorized server workflow copies approved media to
`published-media`. A failed database publication removes copied objects. This boundary lets
images move to Cloudflare Images/Imgix/Cloudinary and video move to Mux/Cloudflare Stream
without changing story records.

## Moderation and asynchronous work

Submission, consent, social discovery, moderation flags, referrals, and removal requests
are separate private tables. Staff queues are bounded to 40 indexed records. Manual social
URLs are supported now; official provider adapters implement `SocialDiscoveryProvider`
later and run through scheduled/admin/background workflows, never public render paths.
Creator links are one-time, expiring, high-entropy tokens stored only as SHA-256 digests.
Hashtag use is never treated as consent and no workflow auto-publishes.

## Verification and intentional deferrals

- Lint, TypeScript, the 10,000-record cursor test, production build, HTTP smoke tests, and
  the production dependency audit pass in this workspace.
- `supabase/tests/rls_isolation.sql` creates two disposable users and proves cross-user draft
  reads fail, but execution requires a running local Supabase Docker stack or linked project.
  This environment has neither; `npm run test:rls` correctly stopped at the unavailable
  local database. Run `supabase start && npm run test:rls` before enabling production uploads.
- Google and Apple providers, redirect origins, production secrets, Vercel project linkage,
  and migrations must be configured/applied in the deployment environment.
- Mux/Cloudflare Stream, external image delivery, R2, Postgres full-text search, a durable
  job queue, third-party error monitoring, and virtualization are intentionally deferred
  until measured load justifies them.

Likely next bottlenecks are original-media processing and video delivery, followed by search
once the archive reaches tens of thousands of entries. The public database read rate should
remain low because cached pages and data are shared at the CDN and invalidated surgically.

## Reference principles translated

- Essesi: tiny objects separated by disproportionate whitespace; object-to-viewer
  expansion; interface copy reduced to labels.
- A Possible: content as a navigable field; persistent but quiet orientation;
  relationships and discovery precede explanation.
- Lost Memories: varying native media proportions; archival numbering and metadata;
  muted neighbors on hover; direct routes for every object.

HUMAN:HERE translates those principles into a warm paper field of portraits, notes,
voices, places, and statements. It does not reuse their layouts, assets, typefaces,
or interaction code.
