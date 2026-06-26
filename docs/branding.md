# Nami — Naming and Domains

## Product title

User-facing copy uses **Nami** only.

| Use | Label |
| --- | --- |
| Browser tab, Walrus Sites metadata, marketing | **Nami** |
| Repo / package names | `nami`, `@nami/*` (technical identifiers) |
| Avoid in new UI | "Nami Chat", "Nami-Fiends", "Fiends" as product title |

The protocol is a communication and identity layer; the host app title is **Nami**.

## Domains (future)

New deploys and public URLs should prefer **Nami** branding:

```text
nami.app / nami.wal.app (Walrus Sites) / nami.<your-domain>
```

SuiNS site names, zkLogin redirect URIs, and OAuth client titles should match the live **Nami** origin.

## Legacy URLs (until cutover)

These remain valid for existing testnet deploys; do not rename in env without a coordinated migration:

```text
https://nami-fiends.vercel.app
https://nami-backend-rv0o.onrender.com
```

After Walrus Sites (Phase 9.1) and DNS cutover, sunset Vercel in favor of the Walrus portal URL and update `VITE_ZKLOGIN_REDIRECT_URL` accordingly.

## Related

- [vision.md](./vision.md) — cross-platform hosts
- [walrus-sites-deploy.md](./walrus-sites-deploy.md) — SPA metadata (`ws-resources.json` → `site_name: "Nami"`)