# Nenemi on the App Store

One screen at a time. Do the step, come back, say "done". Nothing here needs to be understood ahead of time.

## Status at handoff — 2026-09-21

- **Web app:** live at https://www.mynenemi.com, deploys automatically from `main` (Vercel). Current `main`: `8c122c1`.
- **iOS shell:** ready in `app/`. Build **1.0 (2)**, iPhone only, portrait, minimum iOS 15. Loads the live app (app.mynenemi.com) in a Capacitor WebView, so shipping web updates needs no new review.
- **Assets in the repo:** app icon + splash (in Xcode project), store screenshots for the 6.7" and 6.5" slots — 5 each — in `nenemi-handover/store/screenshots/`, privacy / terms / support pages live.
- **One real blocker left:** Clerk must be switched to its production instance on mynenemi.com, and **Sign in with Apple** added (Apple requires it because Google sign-in is offered). ~20 minutes, with you at the keyboard. See "Still to do" at the bottom.
- **Store screenshots refreshed 2026-09-23** to match the current look (reference restyle, time-of-day greeting, My Day). Five screens each for the 6.7" and 6.5" slots, at exact App Store sizes (1290×2796 and 1242×2688), in `nenemi-handover/store/screenshots/`.

### Money: Full access is sold inside the iPhone app through Apple (Sep 2026)
The same paywall as the web, sold by Apple through RevenueCat. Never Stripe inside the app.
- **Monthly:** $10.99, product `nenemi_monthly_1099`, no trial.
- **Annual:** $59.99, product `nenemi_annual_5999`, 7-day free trial.
- **Entitlement:** `full_access` (RevenueCat). The RevenueCat app user id is the Clerk user id, so a purchase unlocks the account on the web and every device.
- **Where it lives:** `index.html` (the `IAP` block and `obChoosePaid`), `api/iap.js` (sync + RevenueCat webhook → Clerk `publicMetadata` `{ plan, planSource: 'apple', planUntil, trialEnd }`), `app/` (`@revenuecat/purchases-capacitor`).
- **The paywall shows:** store prices, Restore purchases, Apple's auto-renew terms, and Terms of Use (EULA) + Privacy Policy links. If the store doesn't answer, the paywall is skipped rather than shown broken.

## Subscriptions: one-time setup (do these in order)

1. **Paid Apps agreement.** App Store Connect → Business → sign the Paid Apps agreement and fill in bank and tax info. Apple won't sell anything until this is Active.
2. **Create the subscriptions.** App Store Connect → the app → Monetization → Subscriptions → create a group called `Full access`. Inside it, add two products:
   - `nenemi_monthly_1099`: 1 month, $10.99.
   - `nenemi_annual_5999`: 1 year, $59.99, with an Introductory Offer of a 7-day free trial.

   Give each a display name and description, plus the review screenshot of the paywall.
3. **RevenueCat.** At app.revenuecat.com, create the project, then:
   - Add the iOS app (bundle id `com.ollinos.nenemi`) and upload the In-App Purchase key from App Store Connect (Users and Access → Integrations → In-App Purchase).
   - Products: import both product ids.
   - Entitlements: create `full_access` and attach both products.
   - Offerings: `default` (current), with a Monthly package → `nenemi_monthly_1099` and an Annual package → `nenemi_annual_5999`.
4. **Vercel env vars** (Production), then redeploy:
   - `REVENUECAT_IOS_KEY`: the public Apple API key (starts `appl_`).
   - `REVENUECAT_SECRET_KEY`: the secret key (starts `sk_`).
   - `REVENUECAT_WEBHOOK_AUTH`: any long random string.
5. **RevenueCat webhook.** Integrations → Webhooks, then:
   - URL: `https://app.mynenemi.com/api/iap?action=webhook`
   - Authorization header: the same string as `REVENUECAT_WEBHOOK_AUTH`
6. **Sandbox test.** App Store Connect → Users and Access → Sandbox → add a tester. On the iPhone build:
   - Sign in, buy annual, and check the app shows Full access.
   - Delete the app, reinstall, sign in, tap Restore purchases.
7. **Demo account for the reviewer.** Leave it on the free plan, so the reviewer can see and test the purchase with their sandbox account.
8. **Attach the subscriptions to the version.** On the 1.0 version page under In-App Purchases and Subscriptions, add both products. The first subscriptions must be submitted with a build.

## Rebuild the native binary (on the Mac)

```
cd nenemi && git pull
cd app
npm install
npx cap sync ios
npx cap open ios
```

In Xcode:
1. Select the App target → Signing & Capabilities → **+ Capability → In-App Purchase**, if it isn't listed already.
2. File → Packages → Resolve Package Versions. The first time, this downloads RevenueCat.
3. General → bump **Build** by one (for example 1.0 (3)).
4. Pick "Any iOS Device (arm64)" → Product → Archive → Distribute App → App Store Connect → Upload.

The mic's speech plugin is now registered by hand in `SceneDelegate.swift` (`NenemiViewController`). Capacitor 8 only auto-registers npm plugins, so without this the mic would never reach the app.

## What is already built

- `app/` is the native shell. It is a Capacitor project that opens app.mynenemi.com inside the app, so every push to `main` updates the app too, with no new App Store review.
- Bundle ID: `com.ollinos.nenemi`. App name: Nenemi. iPhone only, portrait only. Minimum iOS 15.
- App icon (the white N with the teal glow, from photos/originals/N-icon.jpg) and splash are in the Xcode project.
- The mic works inside the app through Apple's own speech recognizer, shipped as a local Swift package (`app/ios/App/NenemiSpeech`). The web page notices it is inside the shell and uses that instead of the browser API.
- Microphone and speech permission text is written. Encryption exemption is declared.
- Support page: https://www.mynenemi.com/support.html. Privacy: https://www.mynenemi.com/privacy.html. Terms: https://www.mynenemi.com/terms.html.

## Your steps, in order

### 1. Wait for Apple's activation email
It goes to the iCloud address on the order. Usually within 48 hours. Nothing else can start before it lands.

### 2. Sign the agreements
1. Open https://appstoreconnect.apple.com and sign in.
2. If a yellow banner asks you to accept the Paid Apps or Developer agreement, accept it. Free app still needs the free one signed.

### 3. Get a Mac ready
Any Mac from the last five years. Install Xcode from the Mac App Store (it is big, start the download early). Open it once so it finishes installing its tools.

If you do not have a Mac: say so and we use a rented one in the cloud for the upload step only.

### 4. Put the repo on the Mac
In Terminal:
```
git clone https://github.com/marcoscuellar/nenemi.git
cd nenemi/app
npm install
npx cap sync ios
npx cap open ios
```
Xcode opens with the Nenemi project.

Already cloned once? In Terminal, inside `nenemi/app`: `git pull`, then `npx cap sync ios`, then `npx cap open ios`.

### 5. Signing, once
1. In Xcode's left sidebar click the blue "App" at the top.
2. Under Targets click "App", then the "Signing & Capabilities" tab.
3. Tick "Automatically manage signing". Team: pick your name.
4. Xcode registers the bundle ID with Apple by itself.

### 6. Run it on your phone
1. Plug in your iPhone. Pick it in the device menu at the top of Xcode.
2. Press the Play button. First time the phone asks you to trust the developer: Settings, General, VPN & Device Management, trust.
3. Nenemi opens on the phone. Tap the mic once and allow the two permissions.

### 7. Create the app record
1. App Store Connect, My Apps, the plus button, New App.
2. Platform iOS. Name: Nenemi. Primary language: English (U.S.). Bundle ID: com.ollinos.nenemi. SKU: nenemi-ios.
3. Create.

### 8. Upload the build
1. In Xcode pick "Any iOS Device (arm64)" as the target.
2. Menu Product, Archive. Wait.
3. When the Organizer window appears: Distribute App, App Store Connect, Upload, keep every default, Upload.
4. Ten to thirty minutes later the build shows up in App Store Connect under TestFlight.

### 9. Fill the listing
Everything below is ready to paste. Screenshots are in `nenemi-handover/store/screenshots/` (`6.7` for the 6.7" slot, `6.5` for the 6.5" slot), five each, in order. Download them from GitHub and drag them in.

### 10. Submit for review
1. App Store tab, 1.0 Prepare for Submission.
2. Pick the build. Paste the copy. Upload screenshots. Answer the privacy questions with the table below.
3. Add to Review. Apple usually answers within a day or two.

## Store listing, ready to paste

- **Name:** Nenemi
- **Subtitle:** A memory app for ADHD brains
- **Category:** Productivity. Secondary: Health & Fitness.
- **Age rating:** 4+ (answer no to everything in the questionnaire).
- **Keywords:** adhd,memory,brain dump,focus,planner,executive function,notes,voice,calendar,overwhelm
- **Promotional text:** Made for your brain. Not their expectations.
- **Description:**

  Nenemi is somewhere to put a thought without having to organize it first.

  Say it or type it, messy is fine. Nenemi files it in the right room, starts a new one, or holds it loose. You never decide where it goes.

  Rooms hold one thing each: where you left off and one small next move. Open one and you are back in, no re-reading.

  Dump your whole day in one breath and get a day back you can actually follow. Priorities first. Air between things. Nothing overdue, ever.

  Feeling stuck? Four doors, then one small move. A dark, quiet screen when everything is everywhere. Never a list. Never a lecture.

  Real people help. ADHD coaches, therapists, psychiatrists, and 988 are one tap from the stuck screen.

  No streaks. No red. No shame. Sign in once and your rooms follow you to every device.

- **Support URL:** https://www.mynenemi.com/support.html
- **Marketing URL:** https://www.mynenemi.com/welcome.html
- **Privacy Policy URL:** https://www.mynenemi.com/privacy.html
- **Copyright:** 2026 Marcos Cuellar

## App privacy answers

| Question | Answer |
|---|---|
| Do you collect data? | Yes |
| Contact info: email, name | Collected, linked to the user, only when they sign in. Purpose: app functionality. |
| User content: other user content (notes, rooms, calendar) | Collected, linked to the user. Purpose: app functionality. |
| User content: photos or videos | Collected, linked to the user, only when they attach one to a room. Purpose: app functionality. |
| Identifiers: user ID | Collected, linked. Purpose: app functionality. |
| Used for tracking? | No |
| Purchases: purchase history | Collected, linked to the user (Apple and RevenueCat, to unlock Full access). Purpose: app functionality. |
| Everything else (location, health, browsing, diagnostics, contacts) | Not collected |

## Review notes, paste into "Notes" for the reviewer

Sign in with the demo account below (email and password). Then type or speak into the box on the first screen. Your data is saved on the device and synced to your account. Speech is handled on device by Apple's recognizer. The app is a native shell around our web app so updates ship without a resubmission; all features are usable inside the app.

## Still to do before submission

- **Clerk → production + Sign in with Apple — verify it's live.** The plan is: Clerk on its production instance on mynenemi.com, with Sign in with Apple enabled (Apple requires it whenever Google sign-in is offered). Marcos believes this is already done; it couldn't be confirmed from the build environment. 10-second check: open the sign-in sheet on https://www.mynenemi.com — "Continue with Apple" should be one of the options, and the account should be a production Clerk instance (not a `*.clerk.accounts.dev` dev one).
- Store screenshots: **done** (refreshed 2026-09-23, both slots, exact sizes). Upload the framed set in `nenemi-handover/store/framed/` (headline + real app screen + a person behind it). The plain screens stay in `store/screenshots/`.
- **Demo account for Apple's reviewer.** The app now opens on the sign-up screen, so the reviewer needs a login. Create one account (e.g. a spare email + password) and paste both into App Store Connect → App Review Information → Sign-in required.
