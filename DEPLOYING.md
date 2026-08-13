# Deploying Taizan Capital

The application is production-ready and needs no API key to run. What it
needs is an account to deploy into, which is the one step that cannot be
automated — it requires authenticating as you.

## What is already done

- Production build verified clean (`npm run build`)
- No secrets in the repository; `.env*` is gitignored
- No API credential required — the data source is a public, keyless
  endpoint
- Hero video renditions tracked, so the homepage has footage after a
  clone
- Open Graph and Twitter card metadata, driven by `NEXT_PUBLIC_SITE_URL`
  or Vercel's own `VERCEL_URL`
- API routes are same-origin only. They set no `Access-Control-Allow-Origin`
  header at all, which is stricter than restricting to a domain — there is
  no CORS configuration to get wrong

## One-time setup

### 1. Push to GitHub

The repository has no remote. Create an empty repository under your own
account — do not initialise it with a README — then:

```bash
git remote add origin https://github.com/<you>/taizan-capital-web.git
git push -u origin main
```

The branch `research-terminal` holds the terminal work. Merge it first if
it has not been merged:

```bash
git checkout main && git merge research-terminal
```

### 2. Connect Vercel

Sign in at vercel.com with the same GitHub account, then **Add New →
Project** and pick the repository. Vercel detects Next.js and needs no
configuration: the defaults for build command, output directory and
install command are all correct.

Deploy. The first build takes two to three minutes.

### 3. Set the canonical URL

Once the deployment has a URL, add one environment variable in
**Project → Settings → Environment Variables**:

```
NEXT_PUBLIC_SITE_URL = https://<your-project>.vercel.app
```

Redeploy so social cards resolve to absolute URLs. Without it they fall
back to `VERCEL_URL`, which changes per deployment and is wrong for
sharing.

## Cost

Zero. Vercel's Hobby tier covers this: static pages, serverless routes
and the bandwidth a portfolio site uses. HTTPS is automatic. No custom
domain is required — the `.vercel.app` subdomain is a public, shareable
link.

A custom domain is the only component with a real cost, roughly
A$20–30 a year, and is optional.

## Before going public

Two things worth a decision rather than a default:

**Repository visibility.** A public repository exposes the commit
history, which includes the development trail. Private costs nothing on
the Hobby tier and Vercel deploys from it identically.

**The `.git` directory is 132 MB.** Two video masters — `forest.mp4` at
30 MB and `river.mp4` at 39 MB — were committed in early history and
nothing references them. They do not affect the deployed site, only clone
times. Removing them means rewriting history, which is safe on a repo
with no other collaborators but is not reversible.

## Verifying the deployment

The production build has been tested locally; confirm the same on the
live URL:

1. Homepage loads with hero video playing
2. `/research` lists constituents with a delay label
3. Search resolves a company by name
4. A company page loads its Overview, then Financials
5. `/research/coverage` renders
6. Add to watchlist, reload, confirm it persists
7. Social preview: paste the URL into LinkedIn's Post Inspector

## Connecting a fundamentals provider later

The provider layer is isolated in `src/lib/research/`. Balance sheet,
cash flow, DCF, ROIC and quality screening are blocked on data the
current source strips, not on application code. Adding a licensed
provider is a new adapter behind the same interface plus a key in
`.env.local`; see `.env.example` for the variables already scaffolded.
`/research/coverage` lists exactly which capabilities that would unblock.
