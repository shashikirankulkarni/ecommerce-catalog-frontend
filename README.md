# Catalog Administration

The administration console for the
[ecommerce-catalog-service](https://github.com/shashikirankulkarni/ecommerce-catalog-service) service.
React 19, Vite, TypeScript.

A single screen: list, filter, create, edit, deactivate and reactivate products. Deployed
independently of the backend — nginx serves this bundle and proxies `/api` to the
application, so the two ship on their own schedules behind one origin.

---

## Running it

The backend has to be up first. From the catalog repository:

```bash
docker compose --profile db up -d --wait
./mvnw spring-boot:run
scripts/seed.sh                    # 21 sample products, so the table has something in it
```

Then here:

```bash
npm ci
npm run dev
```

<http://localhost:5173>

Vite proxies `/api` to `http://localhost:8081` — the **dev** environment, not your local
run. Point it at `http://localhost:8080` in `vite.config.ts` if you would rather work
against a locally running backend.

## Scripts

| | |
|---|---|
| `npm run dev` | Vite dev server with the API proxy |
| `npm run build` | `tsc -b && vite build` → `dist/` |
| `npm run lint` | oxlint |
| `npm run preview` | serve the production build locally |

## How it talks to the API

**Every request uses a relative URL.** There is no API base URL, no environment variable
to inject at build time, and no CORS configuration anywhere:

```ts
const BASE = '/api/v1/products';
```

In development Vite proxies `/api`; in production nginx does the same. The browser sees one
origin either way, so the same bundle runs unchanged in every environment — which is what
lets one build be promoted rather than rebuilt per environment.

## Errors

The API returns [RFC 7807](https://datatracker.ietf.org/doc/html/rfc7807) problem details,
and this UI uses them properly rather than flattening everything into "something went
wrong":

- A duplicate SKU shows **the message the API actually sent** — *"A product with sku
  'LAPTOP-001' already exists"*
- A validation failure maps the `errors` object back onto the **individual form fields**,
  so the message appears under the input that caused it

Worth trying: create a product with a SKU that already exists, then submit the form with an
empty SKU and a negative price.

## Deployment

Push to `main` (via a pull request — the ruleset requires one) and `deploy.yml` runs:

| Job | Where | What |
|---|---|---|
| **build** | `ubuntu-latest` | `npm ci`, lint, `vite build`, record the bundle's SHA-256 |
| **deploy** | self-hosted runner | verify that digest, stage, swap atomically, verify the served page |

The deploy job does not check out the source at all — it needs the built bundle and nothing
else. Publishing is **staged then swapped**, not copied in place: copying over the live
directory serves a half-updated site for its duration, with an `index.html` referencing an
asset that has not arrived yet. The previous build is kept as `dev.old` and restored if the
post-deploy check fails.

nginx is never restarted, so the API stays up throughout a UI release.

## Notes worth keeping

**No router.** There is one screen, and client-side routing would need a server-side
fallback to `index.html` for no benefit. nginx has the `try_files` fallback anyway, so a
refresh on any path still loads the app.

**The form resets by `key`, not in an effect.** The parent passes
`key={editing?.id ?? 'new'}`, so React discards the component and builds a fresh one.
Resetting state inside an effect renders once with stale values before correcting itself.

**`ApiError` uses explicit fields, not constructor parameter properties.** TypeScript 6
enables `erasableSyntaxOnly`, which forbids any syntax that emits runtime code — and
parameter properties do.

**Assets are cached for a year, `index.html` never.** Vite hashes asset filenames, so the
name changes whenever the content does; `index.html` is served `no-cache` or browsers keep
loading the previous bundle after a deployment.
