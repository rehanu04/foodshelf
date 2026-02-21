# FoodShelf

Offline-first grocery + meal planning app with family sharing.

## V1 Scope
- Grocery inventory (CRUD) with tags (veg/non-veg, category, fridge/pantry/freezer, finish-soon)
- Shopping list from low/out stock + manual add
- Family sharing via Household + invite code
- AI meal suggestions via **Cloudflare Worker proxy** (Gemini key never in app)
- Offline-first using Room; sync when signed-in

## Non-goals (for V1)
- No camera / computer vision inventory
- No phone OTP login
- No barcode scanning (later)
- No payments / in-app purchase

## Tech Stack
- Android: Kotlin, Jetpack Compose, Room
- Auth: Firebase (Google + Email/Password)
- AI Proxy: Cloudflare Workers
- AI: Gemini API (server-side key)

## Repo Structure
- `android/` — Android Studio project
- `worker/` — Cloudflare Worker proxy
- `docs/` — screenshots, architecture notes
- `assets/` — icons/branding
