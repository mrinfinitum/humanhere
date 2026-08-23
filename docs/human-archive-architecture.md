# HUMAN:HERE — Human Archive architecture

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
- `/share` — local-only submission prototype designed around moderation and explicit consent.
- `/about` — Why We Show Up / Christian foundation.
- `/get-involved` — Give, Volunteer, Partner, Pray.
- `/give` and `/contact` — retained utility routes.
- `/people` and `/people/[slug]` — compatibility redirects to `/humans` routes.

## Scaling approach

The archive uses normal semantic DOM, CSS Grid, and vertical exploration. The first
batch is server-rendered; later batches are requested by cursor only when a visitor
reaches the archive boundary. Images use `next/image`, only first-viewport images are
prioritized, route prefetch is disabled for large artifact lists, and future providers
can replace fixture content without changing components.

The public provider contract only exposes entries intentionally selected by the
provider. A future Supabase provider must enforce `published = true` and
`consentStatus = approved` server-side. The fixture provider is development-only and
every fixture is visibly labeled `DEV_FIXTURE`.

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
