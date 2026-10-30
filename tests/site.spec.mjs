// Browser checks for shared behaviour, layout and every form: `npm run test:browser`.
import { test, expect } from '@playwright/test';
import { PAGES } from './pages.mjs';

const DESKTOP = { width: 1440, height: 900 };

// Stand-in for Cloudflare's Turnstile script: each execute() yields a numbered token
// (or an error when window.__turnstileFail is set). Keeps the tests off the network.
const FAKE_TURNSTILE = `
  window.__turnstile = { renders: 0, executes: 0, resets: 0 };
  window.turnstile = {
    widgets: [],
    render(box, opts) { window.__turnstile.renders++; this.widgets.push(opts); return String(this.widgets.length - 1); },
    execute(id) {
      const opts = this.widgets[Number(id)];
      const n = ++window.__turnstile.executes;
      setTimeout(() => window.__turnstileFail ? opts['error-callback']('300030') : opts.callback('token-' + n), 10);
    },
    reset() { window.__turnstile.resets++; },
  };`;
const PHONE = { width: 390, height: 844 };

async function open(page, path, viewport = DESKTOP) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => {
    if (r.status() >= 400 && new URL(r.url()).origin === new URL(page.url() || r.url()).origin) {
      errors.push(`${r.status()} ${r.url()}`);
    }
  });
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: FAKE_TURNSTILE }));
  await page.setViewportSize(viewport);
  await page.goto(path);
  // Record every message handed to the transport (js/api.js), still letting the fake respond.
  await page.evaluate(() => {
    const send = window.SB.api.send;
    window.__sent = [];
    window.SB.api.send = (message) => {
      window.__sent.push(message);
      return send(message);
    };
  });
  return errors;
}

const sent = (page) => page.evaluate(() => window.__sent);
const sentFrom = (path) => `Sent from: http://127.0.0.1:4173${path}`;

for (const path of PAGES) {
  test.describe(path, () => {
    test('desktop: no errors, nav dropdown, contact modal + form', async ({ page }) => {
      const errors = await open(page, path);

      const dropdown = page.locator('[data-dropdown]').first();
      const toggle = dropdown.locator('[data-dropdown-toggle]');
      await toggle.click();
      await expect(dropdown).toHaveClass(/\bopen\b/);
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(dropdown.locator('.nav-drop-menu')).toBeVisible();
      await page.mouse.click(5, 600);
      await expect(dropdown).not.toHaveClass(/\bopen\b/);
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');

      const modal = page.locator('#sbContactModal');
      const openLink = page.locator('.site-footer [data-modal-open="sbContactModal"]');
      await expect(modal).toBeHidden();
      await openLink.click();
      await expect(modal).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(modal).toBeHidden();

      await openLink.click();
      await expect(modal).toBeVisible();
      await page.mouse.click(10, 450);
      await expect(modal).toBeHidden();

      await openLink.click();
      await modal.locator('[data-modal-close]').click();
      await expect(modal).toBeHidden();

      await openLink.click();
      await page.click('#sbContactForm button[type=submit]');
      expect(await sent(page)).toEqual([]); // required fields block an empty submit

      await page.fill('#sbFirstName', 'Test');
      await page.fill('#sbLastName', 'User');
      await page.fill('#sbEmail', 'test@example.com');
      await page.fill('#sbMessage', 'Hello');
      await page.click('#sbContactForm button[type=submit]');
      await expect(page.locator('#sbModalConfirmText')).toHaveText("Thanks Test, we'll be in touch shortly.");
      await expect(page.locator('#sbModalFormWrap')).toBeHidden();
      expect(await sent(page)).toEqual([{
        form: 'contact-sales',
        category: 'sales',
        title: 'Contact request: Test User',
        replyTo: 'test@example.com',
        body: ['First Name: Test', 'Last Name: User', 'Email: test@example.com', '', 'Message:', 'Hello', '', sentFrom(path)].join('\n'),
        fields: { firstName: 'Test', lastName: 'User', email: 'test@example.com', message: 'Hello' },
        turnstileToken: 'token-1',
      }]);

      // Reopening starts from a fresh form.
      await page.keyboard.press('Escape');
      await openLink.click();
      await expect(page.locator('#sbModalFormWrap')).toBeVisible();
      await expect(page.locator('#sbModalConfirm')).toBeHidden();
      await expect(page.locator('#sbFirstName')).toHaveValue('');

      expect(errors).toEqual([]);
    });

    test('desktop: footer is laid out, not unstyled', async ({ page }) => {
      await open(page, path);
      expect((await page.locator('.site-footer').boundingBox()).height).toBeLessThan(700);
      const icon = await page.locator('.footer-social-link').first().boundingBox();
      expect([icon.width, icon.height]).toEqual([36, 36]);
      await expect(page.locator('.footer-inner')).toHaveCSS('display', 'grid');
    });

    test('phone: no errors, mobile menu, no sideways scroll', async ({ page }) => {
      const errors = await open(page, path, PHONE);

      const menu = page.locator('#navMobile');
      const toggle = page.locator('[data-nav-toggle]');
      const box = await toggle.boundingBox();
      expect(PHONE.width - (box.x + box.width), 'hamburger sits at the right edge').toBeLessThanOrEqual(24);
      await toggle.click();
      await expect(menu).toHaveClass(/\bopen\b/);
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(await toggle.boundingBox(), 'close button stays where the hamburger was').toEqual(box);
      const link = menu.locator('a[href]:not([href="#"])').first();
      await link.evaluate((a) => a.addEventListener('click', (e) => e.preventDefault()));
      await link.click();
      await expect(menu).not.toHaveClass(/\bopen\b/);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  });
}

test.describe('forms', () => {
  test('contact: a filled honeypot shows success but sends nothing', async ({ page }) => {
    await open(page, '/about/');
    await page.locator('.site-footer [data-modal-open="sbContactModal"]').click();
    await page.fill('#sbFirstName', 'Bot');
    await page.fill('#sbLastName', 'Bot');
    await page.fill('#sbEmail', 'bot@example.com');
    await page.fill('#sbMessage', 'spam');
    await page.locator('#sbContactForm [name="bot-field"]').evaluate((el) => { el.value = 'gotcha'; });
    await page.click('#sbContactForm button[type=submit]');
    await expect(page.locator('#sbModalConfirm')).toBeVisible();
    expect(await sent(page)).toEqual([]);
  });

  test('resources: SOC 2 request', async ({ page }) => {
    const errors = await open(page, '/resources/');
    await page.locator('[data-modal-open="sbSoc2Modal"]').click();
    await expect(page.locator('#sbSoc2Modal')).toBeVisible();
    await page.fill('#sbSoc2Email', 'it@example.com');
    await page.click('#sbSoc2Form button[type=submit]');
    await expect(page.locator('#sbSoc2ConfirmText')).toHaveText("Request received. We'll send the SOC 2 report to it@example.com shortly.");
    expect(await sent(page)).toEqual([{
      form: 'soc2-request',
      category: 'sales',
      title: 'SOC 2 report request: it@example.com',
      replyTo: 'it@example.com',
      body: ['Email: it@example.com', '', sentFrom('/resources/')].join('\n'),
      fields: { email: 'it@example.com' },
      turnstileToken: 'token-1',
    }]);
    expect(errors).toEqual([]);
  });

  test('demo: request', async ({ page }) => {
    const errors = await open(page, '/demo/');
    await page.click('#demoForm button[type=submit]');
    expect(await sent(page)).toEqual([]);

    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'User');
    await page.fill('#email', 'test@example.com');
    await page.fill('#organization', 'Test Academy');
    await page.selectOption('#sport', 'lacrosse');
    await page.selectOption('#role', 'head-coach');
    await page.click('#demoForm button[type=submit]');
    await expect(page.locator('#formConfirm')).toBeVisible();
    await expect(page.locator('#formConfirm h3')).toHaveText('Thanks, Test!');
    await expect(page.locator('#demoForm')).toBeHidden();
    expect(await sent(page)).toEqual([{
      form: 'demo-request',
      category: 'sales',
      title: 'Demo request: Test Academy',
      replyTo: 'test@example.com',
      body: [
        'First Name: Test', 'Last Name: User', 'Email: test@example.com', 'Phone: —',
        'School or Organization: Test Academy', 'Sport: Lacrosse', 'Role: Head Coach',
        '', 'Message:', '—', '', sentFrom('/demo/'),
      ].join('\n'),
      fields: {
        firstName: 'Test', lastName: 'User', email: 'test@example.com', phone: '',
        organization: 'Test Academy', sport: 'lacrosse', role: 'head-coach', message: '',
      },
      turnstileToken: 'token-1',
    }]);
    expect(errors).toEqual([]);
  });

  test('support: request', async ({ page }) => {
    const errors = await open(page, '/support/');
    await page.click('#contactForm button[type=submit]');
    expect(await sent(page)).toEqual([]);

    await page.fill('#cName', 'Test User');
    await page.fill('#cEmail', 'test@example.com');
    await page.fill('#cMessage', 'Help');
    await page.click('#contactForm button[type=submit]');
    await expect(page.locator('#contactConfirm')).toBeVisible();
    await expect(page.locator('#contactForm')).toBeHidden();
    expect(await sent(page)).toEqual([{
      form: 'support-request',
      category: 'support',
      title: 'Support request: Test User',
      replyTo: 'test@example.com',
      body: ['Your Name: Test User', 'Email Address: test@example.com', '', 'Message:', 'Help', '', sentFrom('/support/')].join('\n'),
      fields: { name: 'Test User', email: 'test@example.com', message: 'Help' },
      turnstileToken: 'token-1',
    }]);
    expect(errors).toEqual([]);
  });

  test('football: waitlist with referral link', async ({ page }) => {
    const errors = await open(page, '/football/');
    await page.click('#waitlist-form button[type=submit]');
    await expect(page.locator('#first-name')).toHaveCSS('border-color', 'rgb(255, 90, 90)');
    expect(await sent(page)).toEqual([]);

    await page.fill('#first-name', 'Test');
    await page.fill('#last-name', 'Coach');
    await page.fill('#email', 'not-an-email');
    await page.fill('#school', 'Test High');
    await page.selectOption('#position', 'head_coach');
    await page.click('#waitlist-form button[type=submit]');
    expect(await sent(page)).toEqual([]);

    await page.fill('#email', 'coach@example.com');
    await page.click('#waitlist-form button[type=submit]');
    const overlay = page.locator('#confirmation');
    await expect(overlay).toHaveClass(/\bshow\b/);
    await expect(overlay.locator('[data-field="first_name"]')).toHaveText('Test');
    await expect(page.locator('#referral-link-text')).toHaveText(/^scorebreakgridiron\.com\/ref\/[A-Z2-9]{8}$/);
    expect(await sent(page)).toEqual([{
      form: 'waitlist',
      category: 'gridiron-waitlist',
      title: 'Gridiron waitlist: Test Coach, Test High',
      replyTo: 'coach@example.com',
      body: [
        'First Name: Test', 'Last Name: Coach', 'Email Address: coach@example.com',
        'School / Program: Test High', 'Your Role: Head Coach', '', sentFrom('/football/'),
      ].join('\n'),
      fields: { first_name: 'Test', last_name: 'Coach', email: 'coach@example.com', school: 'Test High', position: 'head_coach' },
      turnstileToken: 'token-1',
    }]);

    await page.click('#confirm-close-btn');
    await expect(overlay).not.toHaveClass(/\bshow\b/);
    await expect(page.locator('#first-name')).toHaveValue('');
    expect(errors).toEqual([]);
  });
});

test.describe('page-specific scripts', () => {
  test('index: hero video plays at 0.75x', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => page.evaluate(() => document.getElementById('heroVideo').playbackRate)).toBe(0.75);
  });

  for (const path of ['/', '/lacrosse/']) {
    test(`${path}: testimonial carousel`, async ({ page }) => {
      await page.goto(path);
      const slides = await page.locator('[data-carousel-track] > *').count();
      expect(slides).toBeGreaterThan(1);
      const dots = page.locator('[data-carousel-dots] .tc-dot');
      await expect(dots).toHaveCount(slides);
      await page.click('[data-carousel-next]');
      await expect(dots.nth(1)).toHaveClass(/\bactive\b/);
      await expect(page.locator('[data-carousel-track]')).toHaveAttribute('style', /translateX\(-100%\)/);
      await page.click('[data-carousel-prev]');
      await expect(dots.nth(0)).toHaveClass(/\bactive\b/);
    });
  }
});

test.describe('form failures and edge cases', () => {
  const RED = 'rgb(255, 90, 90)';

  async function fillContact(page, firstName = 'Test') {
    await page.fill('#sbFirstName', firstName);
    await page.fill('#sbLastName', 'User');
    await page.fill('#sbEmail', 'test@example.com');
    await page.fill('#sbMessage', 'Hello');
  }
  // Makes the next send fail, the way a network error or 5xx from the real API would.
  const failNextSend = (page, how = 'reject') => page.evaluate((how) => {
    const send = window.SB.api.send;
    window.SB.api.send = (message) => {
      window.SB.api.send = send;
      if (how === 'throw') {
        throw new Error('sync failure');
      }
      return Promise.reject(new Error('network down'));
    };
  }, how);

  for (const how of ['reject', 'throw']) {
    test(`contact: a failed send (${how}) outlines the button red and keeps the input; a retry succeeds and clears it`, async ({ page }) => {
      const errors = await open(page, '/about/');
      await page.locator('.site-footer [data-modal-open="sbContactModal"]').click();
      await fillContact(page);
      const submit = page.locator('#sbContactForm button[type=submit]');

      await failNextSend(page, how);
      await submit.click();
      await expect(submit).toHaveClass(/\bis-error\b/);
      await expect(submit).toHaveCSS('outline-color', RED);
      await expect(submit).toBeEnabled();
      await expect(page.locator('#sbModalConfirm')).toBeHidden();
      await expect(page.locator('#sbFirstName')).toHaveValue('Test');
      await expect(page.locator('#sbMessage')).toHaveValue('Hello');

      await submit.click();
      await expect(page.locator('#sbModalConfirm')).toBeVisible();
      await expect(submit).not.toHaveClass(/\bis-error\b/);
      expect(await sent(page)).toHaveLength(1);
      expect(errors).toEqual([]);
    });
  }

  test('contact: reopening the modal clears a previous error', async ({ page }) => {
    await open(page, '/about/');
    const openLink = page.locator('.site-footer [data-modal-open="sbContactModal"]');
    await openLink.click();
    await fillContact(page);
    await failNextSend(page);
    const submit = page.locator('#sbContactForm button[type=submit]');
    await submit.click();
    await expect(submit).toHaveClass(/\bis-error\b/);
    await page.keyboard.press('Escape');
    await openLink.click();
    await expect(submit).not.toHaveClass(/\bis-error\b/);
    await expect(page.locator('#sbFirstName')).toHaveValue('');
  });

  test('demo (on-page form): a failed send keeps the form and outlines the button', async ({ page }) => {
    await open(page, '/demo/');
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'User');
    await page.fill('#email', 'test@example.com');
    await page.fill('#organization', 'Test Academy');
    await page.selectOption('#sport', 'lacrosse');
    await page.selectOption('#role', 'head-coach');
    await failNextSend(page);
    const submit = page.locator('#demoForm button[type=submit]');
    await submit.click();
    await expect(submit).toHaveCSS('outline-color', RED);
    await expect(page.locator('#demoForm')).toBeVisible();
    await expect(page.locator('#formConfirm')).toBeHidden();
    await submit.click();
    await expect(page.locator('#formConfirm')).toBeVisible();
    await expect(submit).not.toHaveClass(/\bis-error\b/);
  });

  test('whitespace-only required fields are treated as empty', async ({ page }) => {
    await open(page, '/about/');
    await page.locator('.site-footer [data-modal-open="sbContactModal"]').click();
    await fillContact(page, '   ');
    await page.click('#sbContactForm button[type=submit]');
    await expect(page.locator('#sbModalConfirm')).toBeHidden();
    expect(await sent(page)).toEqual([]);
  });

  test('football: waitlist honeypot shows success but sends nothing', async ({ page }) => {
    await open(page, '/football/');
    await page.fill('#first-name', 'Bot');
    await page.fill('#last-name', 'Bot');
    await page.fill('#email', 'bot@example.com');
    await page.fill('#school', 'Bot High');
    await page.selectOption('#position', 'head_coach');
    await page.locator('#waitlist-form [name="bot-field"]').evaluate((el) => { el.value = 'gotcha'; });
    await page.click('#waitlist-form button[type=submit]');
    await expect(page.locator('#confirmation')).toHaveClass(/\bshow\b/);
    expect(await sent(page)).toEqual([]);
  });

  test('closing one of two open modals keeps the page scroll-locked', async ({ page }) => {
    await open(page, '/football/');
    await page.evaluate(() => { window.SB.modal.open('confirmation'); window.SB.modal.open('sbContactModal'); });
    await page.evaluate(() => window.SB.modal.close('sbContactModal'));
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await page.evaluate(() => window.SB.modal.close('confirmation'));
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  });
});

test.describe('bot protection', () => {
  async function openContact(page) {
    await page.locator('.site-footer [data-modal-open="sbContactModal"]').click();
    await page.fill('#sbFirstName', 'Test');
    await page.fill('#sbLastName', 'User');
    await page.fill('#sbEmail', 'test@example.com');
    await page.fill('#sbMessage', 'Hello');
  }
  const turnstileStats = (page) => page.evaluate(() => window.__turnstile);

  test('local development uses Cloudflare\'s test site key, not the production one', async ({ page }) => {
    await open(page, '/about/');
    expect(await page.evaluate(() => window.SB.config.turnstileSiteKey)).toBe('1x00000000000000000000AA');
  });

  test('Turnstile loads only when a form is used, not on page load', async ({ page }) => {
    await open(page, '/about/');
    expect(await page.evaluate(() => typeof window.turnstile)).toBe('undefined');
    await openContact(page);
    await expect.poll(() => page.evaluate(() => typeof window.turnstile)).toBe('object');
  });

  test('every send runs a fresh Turnstile check (tokens are single-use)', async ({ page }) => {
    await open(page, '/about/');
    await openContact(page);
    const submit = page.locator('#sbContactForm button[type=submit]');
    await page.evaluate(() => {
      const send = window.SB.api.send;
      window.SB.api.send = (message) => { window.SB.api.send = send; window.__sent.push(message); return Promise.reject(new Error('down')); };
    });
    await submit.click();
    await expect(submit).toHaveClass(/\bis-error\b/);
    await submit.click();
    await expect(page.locator('#sbModalConfirm')).toBeVisible();
    expect((await sent(page)).map((m) => m.turnstileToken)).toEqual(['token-1', 'token-2']);
    expect(await turnstileStats(page)).toEqual({ renders: 1, executes: 2, resets: 1 });
  });

  test('a failed Turnstile check sends nothing and outlines the button red', async ({ page }) => {
    await open(page, '/about/');
    await openContact(page);
    await page.evaluate(() => { window.__turnstileFail = true; });
    const submit = page.locator('#sbContactForm button[type=submit]');
    await submit.click();
    await expect(submit).toHaveClass(/\bis-error\b/);
    await expect(page.locator('#sbFirstName')).toHaveValue('Test');
    expect(await sent(page)).toEqual([]);
  });

  test('a blocked Turnstile script sends nothing and outlines the button red', async ({ page }) => {
    await open(page, '/about/');
    await page.unroute('https://challenges.cloudflare.com/**');
    await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
    await openContact(page);
    const submit = page.locator('#sbContactForm button[type=submit]');
    await submit.click();
    await expect(submit).toHaveClass(/\bis-error\b/);
    expect(await sent(page)).toEqual([]);
  });

  test('a filled honeypot skips Turnstile and sends nothing', async ({ page }) => {
    await open(page, '/about/');
    await openContact(page);
    await page.locator('#sbContactForm [name="bot-field"]').evaluate((el) => { el.value = 'gotcha'; });
    await page.click('#sbContactForm button[type=submit]');
    await expect(page.locator('#sbModalConfirm')).toBeVisible();
    expect(await sent(page)).toEqual([]);
    expect((await turnstileStats(page)).executes).toBe(0);
  });

  test('the honeypot field is skipped by Tab', async ({ page }) => {
    await open(page, '/about/');
    await page.locator('.site-footer [data-modal-open="sbContactModal"]').click();
    await page.locator('#sbFirstName').focus();
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => document.activeElement.name)).not.toBe('bot-field');
  });
});

test.describe('form layout', () => {
  const FORMS = [
    { path: '/about/', form: '#sbContactForm', open: (page) => page.evaluate(() => window.SB.modal.open('sbContactModal')) },
    { path: '/resources/', form: '#sbSoc2Form', open: (page) => page.evaluate(() => window.SB.modal.open('sbSoc2Modal')) },
    { path: '/demo/', form: '#demoForm' },
    { path: '/support/', form: '#contactForm' },
    { path: '/football/', form: '#waitlist-form' },
  ];
  for (const { path, form, open: openForm } of FORMS) {
    test(`${form} (${path}): every field fits inside the form at every width`, async ({ page }) => {
      await open(page, path);
      if (openForm) {
        await openForm(page);
      }
      for (const width of [1440, 768, 430, 390, 360, 320]) {
        await page.setViewportSize({ width, height: 900 });
        const overflowing = await page.locator(form).evaluate((f) => {
          const box = f.getBoundingClientRect();
          return [...f.querySelectorAll('input:not([name="bot-field"]), select, textarea, button')]
            .filter((el) => { const r = el.getBoundingClientRect(); return r.left < box.left - 0.5 || r.right > box.right + 0.5; })
            .map((el) => `${el.id || el.name || el.tagName} ${Math.round(el.getBoundingClientRect().right - box.right)}px`);
        });
        expect(overflowing, `at ${width}px`).toEqual([]);
      }
    });
  }
});

test.describe('nav details', () => {
  const BLUE = 'rgb(86, 199, 255)';

  test('current page is highlighted: dropdown item, top link and mobile link', async ({ page }) => {
    await open(page, '/basketball/');
    await page.locator('#dd-sports [data-dropdown-toggle]').click();
    const item = page.locator('#dd-sports a[aria-current="page"]');
    await expect(item).toHaveText('Basketball');
    await expect(item).toHaveCSS('color', BLUE);
    await expect(item).toHaveCSS('background-color', 'rgba(86, 199, 255, 0.1)');

    await open(page, '/support/');
    await expect(page.locator('.nav-right a[aria-current="page"]')).toHaveCSS('color', BLUE);

    await open(page, '/about/', PHONE);
    await page.click('[data-nav-toggle]');
    const mobile = page.locator('#navMobile a[aria-current="page"]');
    await expect(mobile).toHaveText('About Us');
    await expect(mobile).toHaveCSS('color', BLUE);
  });

  test('football uses the shared nav and highlights Football', async ({ page }) => {
    await open(page, '/football/');
    await page.locator('#dd-sports [data-dropdown-toggle]').click();
    await expect(page.locator('#dd-sports a[aria-current="page"]')).toHaveText('Football');
    await expect(page.locator('#dd-sports a[aria-current="page"]')).toHaveCSS('color', BLUE);
  });

  test('mobile menu closes on a click outside it, but not on clicks inside', async ({ page }) => {
    await open(page, '/lacrosse/', PHONE);
    const menu = page.locator('#navMobile');
    await page.click('[data-nav-toggle]');
    await expect(menu).toHaveClass(/\bopen\b/);
    await menu.locator('.nav-mobile-label').first().click();
    await expect(menu).toHaveClass(/\bopen\b/);
    const bar = await page.locator('nav').boundingBox();
    await page.mouse.click(260, bar.y + bar.height / 2); // empty nav-bar space between logo and hamburger
    await expect(menu).not.toHaveClass(/\bopen\b/);
    await expect(page.locator('[data-nav-toggle]')).toHaveAttribute('aria-expanded', 'false');
  });

  test('mobile menu closes when the window widens past the mobile breakpoint', async ({ page }) => {
    await open(page, '/lacrosse/', PHONE);
    const menu = page.locator('#navMobile');
    await page.click('[data-nav-toggle]');
    await expect(menu).toHaveClass(/\bopen\b/);
    await page.setViewportSize({ width: 1024, height: 900 });
    await expect(menu).not.toHaveClass(/\bopen\b/);
    await page.setViewportSize(PHONE);
    await expect(menu).not.toHaveClass(/\bopen\b/);
    await expect(page.locator('[data-nav-toggle]')).not.toHaveClass(/\bactive\b/);
  });

  test('mobile menu: Sports and Solutions headings look the same', async ({ page }) => {
    await open(page, '/', PHONE);
    await page.click('[data-nav-toggle]');
    const styleOf = (locator) => locator.evaluate((el) => {
      const cs = getComputedStyle(el);
      return ['font-size', 'font-weight', 'letter-spacing', 'text-transform', 'color', 'padding', 'min-height'].map((k) => cs.getPropertyValue(k));
    });
    const headings = page.locator('#navMobile .nav-mobile-label');
    await expect(headings).toHaveText(['Sports', 'Solutions']);
    expect(await styleOf(headings.nth(0))).toEqual(await styleOf(headings.nth(1)));
    expect((await styleOf(headings.nth(0)))[4]).toBe(BLUE);
  });
});

test('index: sport-card text is never cut off or under the arrow, at any width', async ({ page }) => {
  await open(page, '/');
  for (const width of [320, 360, 390, 480, 600, 700, 900, 901, 950, 1000, 1100, 1200, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const problems = await page.locator('.sport-card').evaluateAll((cards) => cards.flatMap((card) => {
      const box = card.getBoundingClientRect(), arrow = card.querySelector('.sport-card-arrow').getBoundingClientRect();
      const name = card.querySelector('h3').textContent;
      const texts = [...card.querySelectorAll('.sport-card-tag, h3, p')].flatMap((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return [...range.getClientRects(), ...(el.matches('.sport-card-tag') ? [el.getBoundingClientRect()] : [])];
      });
      const out = [];
      if (texts.some((t) => t.top < box.top || t.bottom > box.bottom || t.left < box.left || t.right > box.right)) {
        out.push(`${name}: text outside the card`);
      }
      if (texts.some((t) => t.right > arrow.left && t.left < arrow.right && t.bottom > arrow.top && t.top < arrow.bottom)) {
        out.push(`${name}: text under the arrow`);
      }
      return out;
    }));
    expect(problems, `at ${width}px`).toEqual([]);
  }
});
