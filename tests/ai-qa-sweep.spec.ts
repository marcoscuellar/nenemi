import { test, expect, type Page, type BrowserContext, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// NÈNÈMI AI QA sweep (see CLAUDE.md). Two parts, run at phone and desktop size:
//   1. Regression color audit: every primary view is strictly monochrome ink / paper / carbon.
//      Maíz is allowed; brand teal only on the onboarding kickers (1b, 19b); a room's own
//      color only where the person picked it. Anything else chromatic is a FAIL.
//   2. Critical path: splash → the Porch → "I'm overwhelmed" → Stuck → back to the Porch mid-conversation,
//      where the Second Home button is on screen → Second Home (Day, Rooms, Stuck) → My day →
//      check a task off → reload, and the state, the layout, and the console all hold.
// The page is served from this folder under the app host; /api is mocked, the outside world stubbed.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// the real app host, so the page behaves exactly as in production. Every request is intercepted by serve():
// nothing reaches the live site.
const ORIGIN = 'https://app.mynenemi.com';
const INK = 'rgb(17, 19, 18)';
const CARBON = 'rgb(113, 113, 122)';
const TYPES: Record<string, string> = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
};

// ---------- harness ----------
async function serve(context: BrowserContext, { billing = false, iap = false } = {}) {
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== ORIGIN) {
      // fonts, Clerk, analytics: answered empty so nothing leaves the machine and nothing logs an error
      const ext = path.extname(url.pathname);
      return route.fulfill({ status: 200, contentType: TYPES[ext] ?? 'text/plain', body: '' });
    }
    if (url.pathname === '/api/config')
      return route.fulfill({ json: { billing, smartRouting: false, authEnabled: false, price: { monthly: 10.99, annual: 59.99 }, revenuecatIosKey: iap ? 'appl_test_key' : null } });
    if (url.pathname === '/api/iap')
      return route.fulfill({ json: { plan: 'paid', planSource: 'apple', planUntil: null, trialEnd: null, roomLimit: null } });
    if (url.pathname.startsWith('/api/')) return route.fulfill({ json: {} });
    const file = path.join(ROOT, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return route.fulfill({ status: 200, body: '' });
    return route.fulfill({ body: fs.readFileSync(file), contentType: TYPES[path.extname(file)] ?? 'application/octet-stream' });
  });
}

function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  return errors;
}

// a returning person: skips the questions (never the splash). Also counts layout shifts for the reload check.
async function asReturning(context: BrowserContext) {
  await context.addInitScript(() => {
    try { localStorage.setItem('nenemi.onboarded', '1'); localStorage.setItem('nenemi.seen', '1'); } catch (e) {}
    (window as any).__cls = 0;
    try {
      new PerformanceObserver(list => {
        for (const e of list.getEntries() as any[]) if (!e.hadRecentInput) (window as any).__cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (e) {}
  });
}

async function pastSplash(page: Page) {
  await page.locator('#nxSplash').waitFor({ state: 'detached', timeout: 6_000 });
}

async function show(page: Page, pane: string) {
  await page.evaluate(`go(${JSON.stringify(pane)})`); // the page's own globals (some are top-level let/const, not window props)
  await expect(page.locator(`#pane-${pane}`)).toHaveClass(/\bactive\b/);
  await page.waitForTimeout(350); // let transitions settle before computing styles
}

function record(info: TestInfo, row: { view: string; consoleErrors: number | string; tokenAudit: string; status: 'PASS' | 'FAIL' }) {
  info.annotations.push({ type: 'qa-row', description: JSON.stringify(row) });
}

// ---------- 1. the color audit, run inside the page ----------
type Violation = { where: string; prop: string; value: string };

async function colorAudit(page: Page, rootSel = 'body'): Promise<Violation[]> {
  return page.evaluate((sel) => {
    const out: { where: string; prop: string; value: string }[] = [];
    const root = document.querySelector(sel);
    if (!root) return [{ where: sel, prop: 'missing', value: 'root not found' }];
    // allowed on purpose: brand teal on the 1b / 19b kickers, a room color the person picked, Google's own logo
    const allowed = (el: Element) =>
      !!el.closest('#onboard .recog-kicker, #onboard .recog-same, #onboard .name-kicker, [style*="--rc"], .rs-dots, #ob-acct svg, .ob-google svg, [data-qa-allow]');
    const colors = (v: string) => [...v.matchAll(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/g)]
      .map(m => ({ r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4], raw: m[0] }));
    // ink, paper and carbon are neutral. Maíz (#E9BE55, hue ~43) is the one warm accent.
    // Everything else with real chroma is banned: cyans, blues, greens, neons, reds, corals, oranges.
    const banned = ({ r, g, b, a }: { r: number; g: number; b: number; a: number }) => {
      if (a < 0.03) return false;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), chroma = mx - mn;
      if (chroma * a < 24) return false; // a neutral, or a tint too faint to read as color
      let h = 0;
      if (mx === r) h = ((g - b) / chroma) % 6; else if (mx === g) h = (b - r) / chroma + 2; else h = (r - g) / chroma + 4;
      h = (h * 60 + 360) % 360;
      const maiz = h >= 36 && h <= 56;
      return !maiz;
    };
    const visible = (el: Element) => {
      const s = getComputedStyle(el);
      return el.getClientRects().length > 0 && s.visibility !== 'hidden' && s.display !== 'none' && parseFloat(s.opacity) > 0.05;
    };
    const ownText = (el: Element) => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent!.trim());
    const els = [root, ...root.querySelectorAll('*')];
    for (const el of els) {
      if (!visible(el) || allowed(el)) continue;
      const s = getComputedStyle(el);
      const check: [string, string][] = [['background-color', s.backgroundColor], ['box-shadow', s.boxShadow]];
      if (ownText(el) || el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) check.push(['color', s.color]);
      for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const)
        if (parseFloat((s as any)[`border${side}Width`]) > 0 && (s as any)[`border${side}Style`] !== 'none') check.push([`border-${side.toLowerCase()}`, (s as any)[`border${side}Color`]]);
      if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) check.push(['outline', s.outlineColor]);
      if (el instanceof SVGElement && !(el instanceof SVGSVGElement)) { check.push(['fill', s.fill], ['stroke', s.stroke]); }
      for (const [prop, value] of check)
        for (const c of colors(value)) if (banned(c)) {
          const id = el.id ? '#' + el.id : '';
          const cls = typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : '';
          out.push({ where: `${el.tagName.toLowerCase()}${id}${cls}`.slice(0, 90), prop, value: c.raw });
        }
    }
    return out;
  }, rootSel);
}

const fmtAudit = (v: Violation[]) => (v.length ? `${v.length} banned` : 'clean');

// ---------- views ----------
type View = { name: string; billing?: boolean; open: (page: Page) => Promise<void>; root?: string; fresh?: boolean };

const VIEWS: View[] = [
  {
    name: 'Splash', root: '#nxSplash',
    open: async page => { await expect(page.locator('#nxSplash')).toBeVisible(); await expect(page.locator('#nxSplash')).toHaveCSS('background-color', INK); },
  },
  {
    name: 'Front Porch', open: async page => {
      await pastSplash(page); await expect(page.locator('#pane-home')).toHaveClass(/\bactive\b/);
      // the Porch (v5): dark, the bot speaks first, one composer, no tab bar
      await expect(page.locator('#pane-home')).toHaveCSS('background-color', 'rgb(10, 10, 10)');
      await expect(page.locator('#greetingText .pb-time')).toHaveText(/^(Morning|Afternoon|Evening|Hey)(, [^.]+)?\.$/);
      await expect(page.locator('#greetingText .pb-sub')).toContainText("I'll sort it");
      await expect(page.locator('#composerInput')).toHaveAttribute('placeholder', 'Type or hold to talk');
      await expect(page.locator('#homeMic')).toBeVisible();
      await expect(page.locator('#tabbar')).toBeHidden();
      // the zero-state hero: glyph, "Morning, {name}.", the welcome question, left-aligned
      await expect(page.locator('#greetingText .pb-glyph')).toBeVisible();
      await expect(page.locator('#greetingText .pb-hello')).toHaveText(/^(What's on today\?|What's on your mind\?|Anything still up there\?)$/);
      await expect(page.locator('#greetingText')).toHaveCSS('text-align', 'left');
      await expect(page.locator('.nx-toast', { hasText: 'Open Horizon' })).toHaveCount(0); // the morning banner is gone
    },
  },
  {
    name: 'Front Porch (mid-conversation)',
    open: async page => {
      await pastSplash(page);
      await page.fill('#composerInput', 'Remember to call the dentist about Thursday');
      await page.press('#composerInput', 'Enter');
      await expect(page.locator('.app')).toHaveClass(/\btalking\b/);
      await expect(page.locator('#secondHomeBtn')).toBeInViewport(); // always a way out to the structure
      // the bot sorts on its own: no question, where it went, three chips; the hero is out of the way
      const reply = page.locator('#chatLog .bubble.sorted').last();
      await expect(reply).toContainText('Slotted into Today');
      expect(await reply.textContent(), 'the Porch asked a question instead of sorting').not.toContain('?');
      for (const c of ['Open Today', 'Move to Room', "I'm Stuck"]) await expect(page.locator('#chatLog .chip', { hasText: c }).last()).toBeVisible();
      await expect(page.locator('#greetingText')).toBeHidden();
      await page.waitForTimeout(600);
      // the composer stays in view and never covers the thread
      const bar = (await page.locator('#composerPill').boundingBox())!;
      const last = (await page.locator('#chatLog > *').last().boundingBox())!;
      const vh = page.viewportSize()!.height;
      expect(bar.y + bar.height, 'composer below the fold').toBeLessThanOrEqual(vh);
      expect(last.y + last.height, 'composer covers the thread').toBeLessThanOrEqual(bar.y + 1);
    },
  },
  { name: 'Place', open: async page => { await pastSplash(page); await show(page, 'place'); } },
  {
    name: 'Second Home (sheet)', open: async page => {
      await pastSplash(page); await page.locator('#secondHomeBtn').click();
      await expect(page.locator('#secondHome')).toBeVisible();
      await expect(page.locator('#secondHome .sh-tile')).toHaveCount(3);
      await page.waitForTimeout(300);
    },
  },
  {
    name: 'My day (NOW + done)',
    open: async page => {
      await pastSplash(page); await show(page, 'calendar');
      const h = new Date().getHours(), pad = (n: number) => String(n).padStart(2, '0');
      await addDayTask(page, 'QA block happening now', `${pad(h)}:00`, `${pad(Math.min(23, h + 1))}:59`);
      await addDayTask(page, 'QA finished item');
      await page.locator('.nx-task-row', { hasText: 'QA finished item' }).locator('.nx-task-check').click();
      await page.waitForTimeout(350);
    },
  },
  { name: 'Rooms', open: async page => { await pastSplash(page); await show(page, 'rooms'); } },
  {
    name: 'Room (example)',
    open: async page => {
      await pastSplash(page);
      await page.evaluate(`openRoom((rooms.find(x => x.demo) || rooms[0]).id)`);
      await expect(page.locator('#pane-roomview')).toHaveClass(/\bactive\b/); await page.waitForTimeout(350);
    },
  },
  { name: 'Stuck Rescue', open: async page => { await pastSplash(page); await show(page, 'stuck'); } },
  { name: 'Onboarding 1b (teal kicker)', fresh: true, root: '#onboard', open: async page => { await pastSplash(page); await obStep(page, 'ob-reality-check'); } },
  { name: 'Onboarding 19 (dark)', fresh: true, root: '#onboard', open: async page => { await pastSplash(page); await obStep(page, 'ob-learn'); await expect(page.locator('#onboard')).toHaveCSS('background-color', INK); } },
  { name: 'Onboarding 19b (teal kicker)', fresh: true, root: '#onboard', open: async page => { await pastSplash(page); await obStep(page, 'ob-definition'); } },
  {
    name: 'Paywall', fresh: true, billing: true, root: '#onboard',
    open: async page => {
      await pastSplash(page); await obStep(page, 'ob-pay');
      await expect(page.locator('#ob-pay')).toBeVisible();
      await expect(page.locator('#onboard .ob-badge')).toHaveCSS('background-color', INK);
    },
  },
];

async function obStep(page: Page, id: string) {
  await page.evaluate(`advanceTo(${JSON.stringify(id)})`);
  await expect(page.locator('#' + id)).toBeVisible();
  await page.waitForTimeout(600); // the act change eases over .4s
}

async function addDayTask(page: Page, name: string, start?: string, end?: string) {
  await page.fill('#nxDayInput', name);
  if (start) {
    await page.$$eval('#pane-calendar input[type=time]', (els, [s, e]) => {
      const set = (el: Element, v: string) => { (el as HTMLInputElement).value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
      set(els[0], s!); if (els[1] && e) set(els[1], e);
    }, [start, end]);
  }
  await page.press('#nxDayInput', 'Enter');
  await expect(page.locator('.nx-task-row', { hasText: name })).toBeVisible();
}

// ---------- 1. regression color audit ----------
test.describe('color audit', () => {
  for (const view of VIEWS) {
    test(view.name, async ({ context, page }, info) => {
      await serve(context, { billing: view.billing });
      if (!view.fresh) await asReturning(context);
      const errors = watchConsole(page);
      await page.goto(ORIGIN + (view.fresh ? '/?welcome' : '/'), { waitUntil: 'domcontentloaded' });
      await view.open(page);
      const violations = await colorAudit(page, view.root);
      const ok = violations.length === 0 && errors.length === 0;
      record(info, { view: view.name, consoleErrors: errors.length, tokenAudit: fmtAudit(violations), status: ok ? 'PASS' : 'FAIL' });
      expect.soft(errors, 'console errors').toEqual([]);
      expect(violations, 'banned colors (see where / prop / value)').toEqual([]);
    });
  }
});

// ---------- 2. critical path + storage ----------
test('critical path + storage', async ({ context, page }, info) => {
  await serve(context);
  await asReturning(context);
  const errors = watchConsole(page);
  const step = async (view: string, body: () => Promise<void>, audit?: string) => {
    const before = errors.length;
    let status: 'PASS' | 'FAIL' = 'PASS', tokenAudit = '—';
    try {
      await body();
      if (audit) { const v = await colorAudit(page, audit); tokenAudit = fmtAudit(v); if (v.length) status = 'FAIL'; }
    } catch (e) { status = 'FAIL'; record(info, { view: `Path: ${view}`, consoleErrors: errors.length - before, tokenAudit, status }); throw e; }
    if (errors.length > before) status = 'FAIL';
    record(info, { view: `Path: ${view}`, consoleErrors: errors.length - before, tokenAudit, status });
    expect(errors.slice(before), `console errors during "${view}"`).toEqual([]);
  };

  await step('open → dark splash → Front Porch', async () => {
    await page.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#nxSplash')).toHaveCSS('background-color', INK);
    await pastSplash(page);
    await expect(page.locator('#pane-home')).toHaveClass(/\bactive\b/);
    await expect(page.locator('#greetingText')).toContainText("I'll sort it");
  }, 'body');

  await step('"I\'m overwhelmed" → Stuck Rescue', async () => {
    await page.fill('#composerInput', "I'm overwhelmed");
    await page.press('#composerInput', 'Enter');
    await expect(page.locator('#pane-stuck')).toHaveClass(/\bactive\b/, { timeout: 4_000 });
  }, 'body');

  await step('mid-conversation → Second Home (Day, Rooms, Stuck)', async () => {
    // back on the Porch the conversation is still going; the way out to the structure has to be right there
    await page.locator('#nav-home:visible, #tn-home:visible').first().click();
    await expect(page.locator('#pane-home')).toHaveClass(/\bactive\b/);
    await expect(page.locator('.app')).toHaveClass(/\btalking\b/);
    const escape = page.locator('#secondHomeBtn');
    await expect(escape).toBeInViewport();
    await escape.click();
    await expect(page.locator('#secondHome')).toBeVisible();
    for (const t of ['My day', 'Rooms', "I'm stuck"]) await expect(page.locator('#secondHome .sh-tile', { hasText: t })).toBeVisible();
  }, 'body');

  await step('My day → check off → ink check + carbon strike', async () => {
    await page.locator('#secondHome .sh-tile', { hasText: 'My day' }).click();
    await expect(page.locator('#pane-calendar')).toHaveClass(/\bactive\b/);
    await addDayTask(page, 'QA path task');
    const row = page.locator('.nx-task-row', { hasText: 'QA path task' });
    await row.locator('.nx-task-check').click();
    await expect(row.locator('.nx-task-check')).toHaveClass(/completed/);
    await expect(row.locator('.nx-task-check')).toHaveCSS('background-color', INK);
    await expect(row.locator('.nx-task-name')).toHaveCSS('color', CARBON);
    await expect(row.locator('.nx-task-name')).toHaveCSS('text-decoration-line', 'line-through');
  }, 'body');

  await step('reload → state persists, no layout shift', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await pastSplash(page);
    await expect(page.locator('#pane-home')).toHaveClass(/\bactive\b/); // every open lands on the Porch
    await show(page, 'calendar');
    const row = page.locator('.nx-task-row', { hasText: 'QA path task' });
    await expect(row).toBeVisible();
    await expect(row.locator('.nx-task-check')).toHaveClass(/completed/);
    await expect(row.locator('.nx-task-name')).toHaveCSS('text-decoration-line', 'line-through');
    await page.waitForTimeout(500);
    const cls = await page.evaluate(() => (window as any).__cls as number);
    expect(cls, 'cumulative layout shift after reload').toBeLessThan(0.1);
  }, 'body');
});

// ---------- 3. the iPhone paywall: Apple in-app purchase through RevenueCat ----------
// A stand-in for the native bridge: the page believes it's inside the iPhone app, and a fake RevenueCat
// plugin answers like the App Store (sandbox prices, a purchase, a restore) and records every call.
async function asIPhoneApp(context: BrowserContext, { restoreHasPurchase = true } = {}) {
  await context.addInitScript((restoreHasPurchase) => {
    const calls: any[] = []; (window as any).__iapCalls = calls;
    const pkg = (id: string, type: string, price: string) => ({ identifier: type, packageType: type.replace('$rc_', '').toUpperCase(), presentedOfferingContext: { offeringIdentifier: 'default' }, product: { identifier: id, priceString: price } });
    const active = { entitlements: { active: { full_access: { identifier: 'full_access', isActive: true } } } };
    const none = { entitlements: { active: {} } };
    const Purchases = {
      isConfigured: async () => ({ isConfigured: calls.some(c => c[0] === 'configure') }),
      configure: async (o: any) => { calls.push(['configure', o]); },
      getOfferings: async () => { calls.push(['getOfferings']); const p = [pkg('nenemi_monthly_1099', '$rc_monthly', '$10.99'), pkg('nenemi_annual_5999', '$rc_annual', '$59.99')]; return { current: { identifier: 'default', availablePackages: p }, all: { default: { identifier: 'default', availablePackages: p } } }; },
      logIn: async (o: any) => { calls.push(['logIn', o]); return { customerInfo: none, created: false }; },
      logOut: async () => { calls.push(['logOut']); return { customerInfo: none }; },
      purchasePackage: async (o: any) => { calls.push(['purchasePackage', o.aPackage.product.identifier]); return { customerInfo: active, productIdentifier: o.aPackage.product.identifier }; },
      restorePurchases: async () => { calls.push(['restorePurchases']); return { customerInfo: restoreHasPurchase ? active : none }; },
    };
    (window as any).Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios', Plugins: { Purchases } };
  }, restoreHasPurchase);
}
async function signInForTest(page: Page) {
  // a signed-in account, the way Clerk would leave it, so purchases can be tied to the user id
  await page.evaluate(`auth.signedIn = true; window.Clerk = { user: { id: 'user_reviewer' }, session: null }`);
}

test('iPhone paywall: store prices, buy, restore, terms', async ({ context, page }, info) => {
  await serve(context, { iap: true });
  await asIPhoneApp(context);
  const errors = watchConsole(page);
  await page.goto(ORIGIN + '/?welcome', { waitUntil: 'domcontentloaded' });
  await pastSplash(page);
  await expect.poll(() => page.evaluate('iap.ready'), { message: 'RevenueCat offerings loaded' }).toBe(true);
  const configured = await page.evaluate(`__iapCalls.find(c => c[0] === 'configure')[1].apiKey`);
  expect(configured).toBe('appl_test_key');

  // the paywall is no longer skipped inside the iPhone app
  await obStep(page, 'ob-pay');
  await expect(page.locator('#ob-pay')).toBeVisible();
  await expect(page.locator('#obPriceMonthly')).toContainText('$10.99');
  await expect(page.locator('#obPriceAnnual')).toContainText('$59.99');
  await expect(page.locator('#onboard .ob-badge')).toHaveText('7 days free');
  // Apple's requirements: a restore button, the auto-renew terms, EULA and privacy links
  await expect(page.locator('#obRestoreBtn')).toBeVisible();
  await expect(page.locator('#onboard .ob-legal .ob-legal-ios')).toBeVisible();
  await expect(page.locator('#onboard .ob-legal .ob-legal-ios')).toContainText('24 hours');
  await expect(page.locator('#onboard .ob-legal a[href="/terms.html"]')).toHaveText('Terms of Use (EULA)');
  await expect(page.locator('#onboard .ob-legal a[href="/privacy.html"]')).toHaveText('Privacy Policy');
  const audit = await colorAudit(page, '#onboard');

  // buy the annual plan (the default): the right product, tied to the account, Full access on
  await signInForTest(page);
  await page.locator('#obPaidBtn').click();
  await expect.poll(() => page.evaluate(`JSON.stringify(__iapCalls.filter(c => c[0] === 'purchasePackage' || c[0] === 'logIn'))`))
    .toBe(JSON.stringify([['logIn', { appUserID: 'user_reviewer' }], ['purchasePackage', 'nenemi_annual_5999']]));
  await expect.poll(() => page.evaluate('auth.plan')).toBe('paid');
  await expect(page.locator('#onboard')).toBeHidden();
  expect(await page.evaluate('canAddRoom()')).toBe(true);

  // monthly maps to its own product
  await page.evaluate(`obPickPlan('monthly'); iapBuy('monthly')`);
  await expect.poll(() => page.evaluate(`__iapCalls.filter(c => c[0] === 'purchasePackage').map(c => c[1]).join(',')`)).toBe('nenemi_annual_5999,nenemi_monthly_1099');

  // restore
  const restored = await page.evaluate('iapRestore()');
  expect(restored).toBe('Full access is back on.');

  const ok = audit.length === 0 && errors.length === 0;
  record(info, { view: 'iPhone paywall: prices, buy, restore, terms', consoleErrors: errors.length, tokenAudit: fmtAudit(audit), status: ok ? 'PASS' : 'FAIL' });
  expect(errors, 'console errors').toEqual([]);
  expect(audit, 'banned colors on the iPhone paywall').toEqual([]);
});

test('iPhone paywall: restore with nothing to restore, and the web paywall stays web', async ({ context, page }, info) => {
  await serve(context, { iap: true });
  await asIPhoneApp(context, { restoreHasPurchase: false });
  const errors = watchConsole(page);
  await page.goto(ORIGIN + '/?welcome', { waitUntil: 'domcontentloaded' });
  await pastSplash(page);
  await expect.poll(() => page.evaluate('iap.ready')).toBe(true);
  await obStep(page, 'ob-pay');
  await signInForTest(page);
  await page.locator('#obRestoreBtn').click();
  await expect(page.locator('#obErr3')).toHaveText('No purchases to restore on this Apple ID.');
  expect(await page.evaluate('auth.plan')).not.toBe('paid');

  // the website: no restore button, web renewal line, Stripe untouched
  const web = await context.browser()!.newPage();
  await serve(web.context(), { billing: true });
  await web.goto(ORIGIN + '/?welcome', { waitUntil: 'domcontentloaded' });
  await pastSplash(web);
  await obStep(web, 'ob-pay');
  await expect(web.locator('#obRestoreBtn')).toBeHidden();
  await expect(web.locator('#onboard .ob-legal .ob-legal-web')).toBeVisible();
  await expect(web.locator('#onboard .ob-legal .ob-legal-ios')).toBeHidden();
  await web.close();

  const ok = errors.length === 0;
  record(info, { view: 'iPhone restore (none) + web paywall', consoleErrors: errors.length, tokenAudit: '—', status: ok ? 'PASS' : 'FAIL' });
  expect(errors, 'console errors').toEqual([]);
});
