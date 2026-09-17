# Deploying the insurance claims demo

The app builds to a Cloudflare Worker with static assets. It declares no D1,
R2, KV, or secret bindings, so it runs entirely on Cloudflare's free plan.

Live URL: `https://sop-insurance-claims.<your-subdomain>.workers.dev`

The first label comes from `name` in `vite.config.ts`. The `<your-subdomain>`
half is chosen once per Cloudflare account, the first time you enable
workers.dev; `npx wrangler whoami` prints it afterwards.

## One-time Cloudflare setup

1. Create a free account at <https://dash.cloudflare.com/sign-up>.
2. Workers & Pages -> Overview. If prompted, pick your workers.dev subdomain.
3. Copy your **Account ID** from the right-hand sidebar of that page.
4. My Profile -> API Tokens -> Create Token -> **Edit Cloudflare Workers**
   template -> restrict it to your account -> create, and copy the token.

## Manual deploy

Requires dependencies installed locally (~750 MB of `node_modules`):

```bash
cd apps/insurance_claims/demo
npm ci
npm run build
npx wrangler login              # browser OAuth, instead of the API token
npx wrangler deploy --config dist/server/wrangler.json
```

Wrangler prints the live URL when it finishes. Add `--dry-run` to validate the
bundle without publishing.

## Automatic deploy (preferred)

`.github/workflows/insurance-demo-ci.yml` deploys on every push to `main` that
touches the demo, and on manual **Run workflow**. The deploy job only runs
after lint, tests, and build pass.

Add two repository secrets under Settings -> Secrets and variables -> Actions:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | the API token from step 4 above |
| `CLOUDFLARE_ACCOUNT_ID` | the Account ID from step 3 above |

CI builds from `package-lock.json`, so you never need `node_modules` on your
own machine for a deploy. The run summary links the deployed URL.

## Custom domain

Hosting stays free; you only pay a registrar for the domain (~$10/yr). Point
the domain's nameservers at Cloudflare, then Workers & Pages -> your worker ->
Settings -> Domains & Routes -> Add custom domain. TLS is issued automatically.

## Free-plan headroom

100,000 requests/day. Current bundle: ~633 KiB of worker code plus 21 static
asset files, 247 KiB gzipped on upload — well under the 3 MB compressed limit.
Fixture data is bundled at build time, so requests do no I/O.
