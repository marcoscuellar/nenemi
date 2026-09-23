# NENEMI Vercel Preview

Vercel-ready static click-through for the approved account setup and value-first product onboarding.

## Deploy

### Fastest option

1. Unzip this package.
2. Go to Vercel and create a new project.
3. Upload this folder or push it to GitHub and import the repository.
4. Framework preset: **Other**.
5. Build command: leave blank.
6. Output directory: leave blank.
7. Deploy.

### Vercel CLI

```bash
npx vercel
```

## What works

- Responsive editorial account setup
- Email confirmation demonstration
- Name and plan selection screens
- Value-first product onboarding
- Browser-local progress using `localStorage`
- Browser notification permission after the first useful result

## Production connections still required

- Apple and Google authentication
- Email delivery and code verification
- User database and secure session management
- StoreKit or web subscription checkout
- Real app routing and synced Rooms/My Day data
- APNs for native iOS push notifications

This package is a functional front-end prototype. It intentionally does not pretend to provide production authentication, billing, or data sync.
