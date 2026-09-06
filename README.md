# Catalog Administration

Admin interface for the [ecommerce-catalog](https://github.com/shashikirankulkarni/ecommerce-catalog)
service. React 19, Vite, TypeScript.

A single page: list, filter, create, edit, deactivate and reactivate
products. No router, because there is one screen and client-side routing
would need a server-side fallback to `index.html` for no benefit.

## Running it

```bash
npm ci
npm run dev
```

Then open http://localhost:5173.

Vite proxies `/api` to `http://localhost:8081`, the dev environment, so
the browser sees a single origin and there is no CORS to configure. Every
request in `src/api.ts` uses a relative URL for the same reason - in
production nginx serves the page and proxies `/api` to the application,
so the same code works unchanged.

The backend must be running. From the catalog repository:

```bash
docker compose --profile dev up -d
```

Sample data:

```bash
scripts/seed.sh
```

## Build

```bash
npm run build      # tsc -b && vite build, output in dist/
npm run lint       # oxlint
```

## Notes

Errors come back as RFC 7807 problem details, so a duplicate SKU shows
the message the API actually sent, and validation failures are mapped
back onto individual form fields from the `errors` object rather than
being flattened into one generic message.
