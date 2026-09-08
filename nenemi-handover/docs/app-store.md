# Nenemi on the App Store

One screen at a time. Do the step, come back, say "done". Nothing here needs to be understood ahead of time.

## What is already built

- `app/` is the native shell. It is a Capacitor project that opens www.mynenemi.com inside the app, so every push to `main` updates the app too, with no new App Store review.
- Bundle ID: `com.ollinos.nenemi`. App name: Nenemi. iPhone only, portrait only. Minimum iOS 15.
- App icon and splash are in the Xcode project.
- The mic works inside the app through Apple's own speech recognizer. The web page notices it is inside the shell and uses that instead of the browser API.
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
Everything below is ready to paste. Screenshots come from me the moment you say the build is up.

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
- **Promotional text:** Made for your brain. Not for their expectations.
- **Description:**

  Nenemi is somewhere to put a thought without having to organize it first.

  Say it or type it, messy is fine. Nenemi files it in the right room, starts a new one, or holds it loose. You never decide where it goes.

  Rooms hold one thing each: where you left off and one small next move. Open one and you are back in, no re-reading.

  Dump your whole day in one breath and get a day back you can actually follow. Priorities first. Air between things. Nothing overdue, ever.

  Feeling stuck? Four doors, then one small move. A dark, quiet screen when everything is everywhere. Never a list. Never a lecture.

  Real people help. ADHD coaches, therapists, psychiatrists, and 988 are one tap from the stuck screen.

  No streaks. No red. No shame. Works with no account; sign in when you want it on another device.

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
| Identifiers: user ID | Collected, linked. Purpose: app functionality. |
| Used for tracking? | No |
| Everything else (location, health, purchases, browsing, diagnostics, contacts, photos) | Not collected |

## Review notes, paste into "Notes" for the reviewer

No account is needed. Open the app and type or speak into the box on the first screen. Sign-in is optional and only syncs data across devices. Speech is handled on device by Apple's recognizer. The app is a native shell around our web app so updates ship without a resubmission; all features are usable inside the app.

## Still to do before submission

- Clerk must move from the development instance to a production instance on mynenemi.com, and Sign in with Apple must be added. Apple requires it whenever Google sign-in is offered. That is a guided setup with you at the keyboard, about twenty minutes.
- Screenshots for 6.7" and 6.5" iPhones. I generate these from the live site once the build exists.
