# GAMES PLANET — Console Sell Portal

Remake of `gamesplanet13/sell` and `gamesplanet13/sellps`, plus the original English selling terms. Source snapshots are in `legacy/`.

## Live application

https://games-planet-console-sell.gamesplanet.chatgpt.site

Customers use **Login / Create account** with the platform's ChatGPT identity, then register their Games Planet name and 10-digit mobile. This is real hosted sign-in, not browser-only login, and does not provide a separate email/password or SMS-OTP provider.

- Public valuation and supported-model checks.
- Account registration, protected 2–6 photo uploads, parcel/address submission and request history.
- Owner-only admin with inspection workflow, final offer, customer acceptance, payment status and JSON record export.
- Persistent hosted D1 database and private R2 photos; every read/mutation is authorised server-side.
- Mobile responsive interface, English/Hindi selling terms and WhatsApp handoff links.

## Storage and GitHub

GitHub stores the application source, migration and policy history. **Customer records are NOT committed to this public repository.** GitHub Pages cannot run the authenticated backend. The app runs on Sites with D1/R2. Photos and customer records are protected by ownership checks, not guessable paths or localStorage credentials.

An optional private GitHub record-backup integration is implemented but is **not connected by default**. Add server secrets `GITHUB_BACKUP_TOKEN` and `GITHUB_BACKUP_REPO` (`owner/private-repo`) using Sites environment settings. Use a fine-grained GitHub token restricted to that private repo with Contents read/write. A public destination is explicitly refused. Tokens never belong in source or browser code. Records are backed up as immutable snapshots to avoid overwriting concurrent updates. Images stay in R2; snapshots include image IDs/metadata, not image binary backups. Configure an object-storage backup separately if required.

The admin interface reports whether private GitHub backup is configured. Admin JSON export includes customer records, requests, status events and photo metadata. Export files contain private data; do not upload them to a public repository. Backups are supplemental; failed backups do not erase successful database submissions.

## Rules consolidated from legacy pages

- PS2 Fat and PS3 Fat are not accepted.
- Working, never-repaired consoles only; no internal hardware modifications. The previous PS5 repaired-condition pricing inconsistency is removed to match the written terms.
- PS2 Slim: Excellent ₹1,500–₹2,000, Good ₹1,000–₹1,500. Rasila IDE combo ₹2,500 reference estimate.
- PS3 Slim: Excellent ₹5,000–₹6,000, Good ₹3,500–₹5,000. SuperSlim: Excellent ₹4,000–₹5,000, Good ₹3,000–₹4,000.
- PS4 Fat: ₹7,000–₹8,000. PS4 Slim firmware ≤13.52: ₹12,000; firmware ≥13.60: ₹10,000. Unknown/malformed firmware and 13.53–13.59 show manual review without a guessed price. PS4 Pro retains its previous ranges because no replacement price was provided.
- PS5 Fat Disc: ₹30,000; Fat Digital: ₹25,000; Slim Digital: ₹30,000; Slim Disc: ₹35,000; Pro Digital / Disc: ₹50,000. Updated by the owner on 19 October 2026; final inspection still applies.
- Pickup is free subject to confirmation/serviceability. Self-courier actual reimbursement is capped at ₹350, consolidating the newer sell page over the older ₹100–₹500 PDF range.
- Do not ship before confirmation. Payment only after inspection and acceptance of the final offer. Rejected-console return is free, matching original terms. Customer bears transit risk and must pack securely.

## Owner configuration

`ADMIN_EMAILS` is a server-side allowlist configured from the verified Site owner's account. It is never auto-assigned to the first visitor. Sign in with the owner's existing ChatGPT account to see Admin.

Runtime values are managed by Sites, not committed files. `.openai/hosting.json` declares D1 `DB`, R2 `BUCKET` and Site identity.

## Development and checks

Use Node 24+ for the SQLite integration tests. Follow the Sites helper workflow for install/build/publish. Tests never use real customer data.

```
node --experimental-strip-types --test tests/rules.test.mjs
node tests/api.test.mjs
node node_modules/typescript/bin/tsc --noEmit
```

The API integration test bundles the real routes with only hosted identity/bindings replaced, executes queries against SQLite, and verifies CSRF, ownership isolation, model eligibility, immutable server pricing, consent, idempotency, admin transitions, customer offer acceptance and export.

Publish applies the schema migration from `drizzle/`. Database schema is never created by customer requests. Browser QA was unavailable in the authoring environment; build, types, domain logic and real API/SQLite integration checks are used instead.
