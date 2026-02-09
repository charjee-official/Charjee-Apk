# Deployment Notes

## Production Overview
- Backend: Render (Node web service) pointing to Supabase Postgres
- Admin panel: Render (Next.js web service)
- Mobile apps: Expo EAS Build + app stores
- Domains: wordchad.com subdomains

## Render Services
- api-staging.wordchad.com -> ev-backend-staging
- api.wordchad.com -> ev-backend-prod
- admin-staging.wordchad.com -> ev-admin-staging
- admin.wordchad.com -> ev-admin-prod

Apply the blueprint in [render.yaml](../render.yaml), then set secrets in Render:
- DATABASE_URL
- REDIS_URL
- JWT_SECRET
- AUTH_INTERNAL_KEY

## DNS
Point each subdomain to the Render-provided CNAME.
TLS is managed by Render.

## Environment Variables
See [backend/.env.example](../backend/.env.example) and [admin-panel/.env.example](../admin-panel/.env.example).

## Mobile (EAS)
Use [mobile-app/vendor_app/eas.json](../mobile-app/vendor_app/eas.json).

Commands:
- Staging build: eas build --profile staging --platform all
- Production build: eas build --profile production --platform all

## CI/CD
GitHub Actions builds backend and admin panel on PRs and main branch merges.
See [.github/workflows/ci.yml](../.github/workflows/ci.yml).
