# App Review reply — Guideline 2.1, Information Needed (Sep 25, 2026)

Paste the reply below into App Store Connect, and also into App Review Information → Notes.
Attach the screen recording (shot list at the bottom) to the reply.

---

Hello App Review team,

Thank you for taking the time. Here is the information you asked for.

**1. Screen recording**
Attached: a screen recording on a physical iPhone running the latest iOS. It starts with launching the app and shows the typical flow: onboarding, capturing a thought, the day plan, a project ("room"), the "I'm stuck" screen, the focus screen, the subscription screen with Restore Purchases, signing in, and deleting the account from inside the app.

**2. Purpose and audience**
NÈNÈMI is a calm planning and capture app for adults with ADHD and other non-linear thinkers.
The problem: people with ADHD often lose track of thoughts, lose their place in ongoing projects, and freeze when it is time to start.
The value: the person types or says whatever is on their mind, and NÈNÈMI sorts it into today's plan or into a project space ("room") that remembers where they left off. When they feel stuck, it offers one small next step and a focus timer. It does not use streaks, scores or overdue warnings.
NÈNÈMI is a productivity tool. It is not a medical device and does not diagnose or treat any condition. A "Human support" screen points people to real professionals and directories.

**3. How to access the main features**
No login or credentials are needed. All core features work without an account.
- Fastest path: on the first screen, tap "I just want to check it out". This opens a sample space with example projects and a sample day, with no sign-up and no payment.
- Full path: tap "Let me show you around", answer a few short questions, type one thing on your mind, and the app creates your first project. After the subscription screen (you can choose Free), you land on the home screen.
- Home: type or hold the mic to talk. The app sorts what you wrote into today's plan or a project.
- The grid button at the top right opens My day, Rooms, and I'm stuck.
- Accounts are optional and only offered with a paid plan (Sign in with Apple, Google, or email code). To delete an account: open the "···" menu at the top right → Delete my account. This permanently deletes the account and all its data on our servers.
- Subscriptions are sold only through Apple In-App Purchase (monthly and annual with a 7-day free trial), with Restore Purchases, the auto-renewal terms, the Terms of Use (EULA) and the Privacy Policy on the subscription screen.
- No sample files are needed.
- No demo account is needed: every feature works without signing in. To see account creation and deletion, buy a plan with a Sandbox Apple Account and choose Sign in with Apple on the account card.

**4. External services**
- Anthropic (Claude API): sorts the text the person types or dictates into today's plan or a project. Only the text they submit and their project names are sent. If it can't be reached, the app sorts on the device instead.
- Apple Speech framework: turns voice into text for the mic.
- Apple In-App Purchase through RevenueCat: subscriptions and restoring purchases.
- Clerk: optional sign-in (Sign in with Apple, Google, email code).
- Neon (Postgres database): syncs the person's data between devices when they have an account or a sync code.
- Vercel: hosts the app and its API. Vercel Blob stores photos and PDFs the person attaches to a project.
- Calendar feed (our own): an optional subscribe link so the day plan shows up in the person's calendar app.
Everything is saved on the device first. The app works offline.

**5. Regional differences**
None. The app works the same in all regions where it is available. Prices come from the App Store for each storefront.

**6. Regulated industry**
Not applicable. NÈNÈMI is a general productivity app, not a healthcare, financial, or other regulated service, and it includes no protected third-party material.

**User-generated content**
Everything a person writes stays private to them. There is no sharing, no public posting, no messaging and no social features, so no other user can see it.

Thank you,
Marcos Cuellar
marcos@ollinos.com

---

## Before you press Submit (your checklist)

- Attach the two subscriptions (nenemi_monthly_1099, nenemi_annual_5999) to this app version: App Store Connect → the version → In-App Purchases and Subscriptions → add both. Apple wants them submitted with the app (3.1.1).
- Paste the reply above into the reply AND into App Review Information → Notes.
- Leave "Sign-in required" unchecked (no demo account needed).
- Upload the new screenshots and attach the recording below to the reply.

## Shot list for the screen recording (on a real iPhone, latest iOS)

Turn on recording: Settings → Control Center → add Screen Recording. Start recording from Control Center, then:

1. From the home screen, tap the NÈNÈMI icon (the recording must start with the launch).
2. Splash → "Hi, I'm NÈNÈMI." → tap "Let me show you around".
3. Type a name, answer the questions quickly, type one thing on your mind, tap "Looks good, let's lock it in".
4. Hold the promise button for 3 seconds.
5. Subscription screen: show the plans, scroll to Restore Purchases and the Terms / Privacy links. Pick the annual plan and buy it in the sandbox (this shows paid content).
6. Account card: Sign in with Apple (this shows account creation).
7. Home: type a messy thought and send it. Show it get sorted. Tap "Open Today".
8. My day: check a task off.
9. Grid button → Rooms → open a room → "Start focus" → "That's done."
10. Grid button → I'm stuck → tap one option.
11. "···" menu → Delete my account → confirm (this shows account deletion).
12. Stop recording. Keep it under about 3 minutes.
