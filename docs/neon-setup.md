# Neon setup

HUMAN:HERE now uses Neon Postgres, Neon Data API, Managed Better Auth, and Neon Object Storage. This is a fresh installation: no old users, data, or files are imported.

## Connected project

Provisioned September 29, 2026 in **NSoul Co**:

- [humanhere in Neon Console](https://console.neon.tech/app/projects/frosty-rice-41252011)
- Project: `frosty-rice-41252011`, Postgres 18, AWS Ohio (`aws-us-east-2`)
- Main branch: `br-square-leaf-b58omvqb`
- Development branch: `br-flat-star-b5qjvi90`
- Both branches have Managed Better Auth with magic links, Data API, and the three media buckets. Development has all ten migrations; main has the first seven. Apply migrations 008–010 to main (`npm run db:migrate` against main, then refresh its Data API schema) before deploying. 009 adds owner edit and delete of stories; 010 adds terms acceptance on profiles, a consent wording version, and the staff-only `consent_archive` kept when a story is deleted.
- `.neon` and `.env.local` point to **development**. Database/storage credentials and the generated session secret are in the ignored `.env.local` only.
- Local trusted origins: `http://localhost:3000` and `http://127.0.0.1:3000`. Google remains disabled in the app until explicitly configured. Main has no application production origin configured yet.

Verified against the hosted development branch: SQL ownership/consent/partner tests, anonymous public Data API reads, denied private-table reads, signed uploads/downloads, denied anonymous private-file access, public media access, and browser upload preflight. Test rows were rolled back and test files removed. The app's login page, session endpoint, public archive, protected-page redirect, and unauthenticated upload rejection were also checked locally. No sign-in emails were sent; complete a real email-link sign-in before launch.

`202609290007_neon_identity_permissions.sql` exposes only the verified request subject through a narrow definer function because Neon's managed `auth` schema is not grantable by the application owner. The SQL tests use the same JWT-claims setting as the hosted Data API.

## Recreate the project

1. Create a project named `humanhere` in [Neon Console](https://console.neon.tech). Choose AWS US East (Ohio), `aws-us-east-2`, which supports Object Storage. Use a separate development branch before configuring production.
2. Enable **Data API** with **Managed Better Auth**. Copy the Data API URL and Auth URL into `NEON_DATA_API_URL` and `NEON_AUTH_BASE_URL` in `.env.local`.
3. Copy the Postgres owner connection string into `DATABASE_URL`. Use an unpooled connection for migrations. This credential stays server-only; visitor queries use the Data API and RLS.
4. Generate `NEON_AUTH_COOKIE_SECRET` with `openssl rand -base64 32` and store it in `.env.local`.
5. Under Auth, add `http://localhost:3000` as a trusted application origin. Add the actual HTTPS site origin before deployment. Set `NEXT_PUBLIC_SITE_URL` to that origin in each environment.
6. Enable the **Magic Link** plugin and new-user registration, then set `NEON_AUTH_MAGIC_LINK_ENABLED=true`. Optionally configure Google OAuth and set `NEON_AUTH_GOOGLE_ENABLED=true`. Disabled methods remain hidden. The SDK handles callback verification on `/auth/complete`; do not configure the old `/auth/callback` exchange route.

The email form retains passwordless sign-in. Apple sign-in is no longer offered by this integration. Use dedicated email delivery and production OAuth credentials for the production project; see [Neon's authentication checklist](https://neon.com/docs/auth/production-checklist).

## Initialize Postgres

```sh
npm run db:migrate
```

The migration command verifies Data API prerequisites, serializes concurrent migration runs, and records checksums in a private `app_migrations` schema. Re-running skips completed migrations. Applied files must remain unchanged; subsequent schema changes need new migrations.

Application profiles are created through `ensure_profile()` using the verified JWT subject. Clients cannot supply another identity or choose a staff role. All application ownership references point to these profiles, keeping the schema independent of the provider's internal auth tables. Deleting an identity in Neon Auth does not delete its application profile or consent history; use an explicit reviewed retention/removal workflow for application data.

After signing in once, grant the initial administrator role in the Neon SQL editor using the exact user ID shown in Neon Auth:

```sql
update public.profiles set role = 'admin' where id = '<your-auth-user-id>'::uuid;
```

## Configure Object Storage

Create these buckets on the same branch in Neon Console:

| Bucket | Access |
| --- | --- |
| `submission-private` | Private |
| `social-review-private` | Private |
| `published-media` | Public read |

Create a branch-scoped storage credential with read and write scopes. Set `AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`. Set `NEXT_PUBLIC_MEDIA_BASE_URL` to the storage endpoint followed by `/published-media`, without a trailing slash.

```sh
npm run storage:setup
```

This verifies the buckets and the effective upload CORS policy for `NEXT_PUBLIC_SITE_URL`. Neon handles browser preflight automatically; bucket CORS mutation returned `NoSuchBucket` for inherited buckets, so the script checks the working policy directly. Run it separately for each branch/environment. Credentials never reach the browser. Private uploads use five-minute signed URLs, size/type validation, and owner/draft checks. A completed upload is copied to a fresh private key so an unexpired upload URL cannot modify a registered file. Owner/staff downloads expire after one minute. Publication requires verified consent and copies approved files to the public bucket; consent revocation unpublishes the story and removes public objects.

Abandoned uploads remain private under `pending/`. Neon currently stores lifecycle configuration without enforcing it, so do not assume a bucket lifecycle rule will perform this cleanup. Instead run:

```sh
npm run storage:clean            # dry run: lists what would be removed
npm run storage:clean -- --delete
```

This removes `pending/` objects older than an hour and private or public objects older than a day that no database row references. Schedule it per environment once hosting is chosen.

## Verify

```sh
npm run typecheck
npm run lint
npm run test:auth
npm run test:storage
npm run test:rls
npm run test:help
npm run test:location
npm run test:globe
npm run build
npm run dev
```

`test:rls` runs all migrations and SQL isolation tests in disposable PGlite PostgreSQL. It substitutes only Neon's JWT helper and roles. It does not prove that hosted Auth, Data API, CORS, email, or bucket permissions have been configured correctly.

Not yet verified with a real account: magic-link email delivery, session completion and refresh, sign-out, and every authenticated browser flow below. Once connected, exercise sign-in/sign-out, private draft creation, upload/download, a second user's denied access, staff publication, love/notes, and consent revocation on the development branch. Set `WORLD_DEMO_ENABLED=false` to inspect real published records. The code-only globe demo remains enabled by default.

Production needs the same environment variables in the hosting provider. With no Neon configuration, public demo pages still work and account access remains unavailable. The migration command only changes the database schema; it does not create a project or deploy the website.

References: [Next.js Auth](https://neon.com/docs/auth/quick-start/nextjs-api-only), [Data API access control](https://neon.com/docs/data-api/access-control), [Object Storage](https://neon.com/docs/storage/get-started), [S3 compatibility](https://neon.com/docs/storage/s3-compatibility).
