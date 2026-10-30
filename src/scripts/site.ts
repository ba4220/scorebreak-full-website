/* Shared behaviour for every page. Markup opts in with data-* attributes:
   - [data-dropdown] wrapping a [data-dropdown-toggle] button: toggles .open on the wrapper
   - [data-nav-toggle]: opens/closes the #navMobile menu
   - [data-modal] (optional data-modal-class, default "open"), opened by [data-modal-open="<id>"],
     closed by [data-modal-close], a backdrop click, or Escape
   - form[data-form="<name>"]: checked with Cloudflare Turnstile, then submitted through SB.api.submitForm
     (api.ts), which formats the email. A filled honeypot field (bot-field) skips both. Optional
     data-form-confirm="<selector>" is revealed on success (its [data-field] spans are filled
     from the submitted values) and data-form-hide="<selector>" is hidden (defaults to the form).
     A failed send keeps the form filled and outlines its submit button red (.is-error) until a send succeeds.
     Per-form hooks: SB.forms.register(name, { validate(form), onSuccess(form, fields), onError(form, err) }).
   Everything is also exposed on window.SB for page scripts and tests. */
import { api, config, fieldsOf, type Fields, type FormEntry } from './api';

/* ── Dropdowns ── */
{
  const dropdowns = document.querySelectorAll<HTMLElement>('[data-dropdown]');
  const setOpen = (dd: HTMLElement, open: boolean) => {
    dd.classList.toggle('open', open);
    dd.querySelector('[data-dropdown-toggle]')!.setAttribute('aria-expanded', String(open));
  };
  dropdowns.forEach((dd) => {
    setOpen(dd, false);
    dd.querySelector('[data-dropdown-toggle]')!.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !dd.classList.contains('open');
      dropdowns.forEach((d) => setOpen(d, false));
      setOpen(dd, open);
    });
  });
  document.addEventListener('click', () => {
    dropdowns.forEach((d) => setOpen(d, false));
  });
}

/* ── Mobile menu ── */
{
  const toggle = document.querySelector<HTMLElement>('[data-nav-toggle]');
  const menu = document.getElementById('navMobile');
  if (toggle && menu) {
    const setOpen = (open: boolean) => {
      menu.classList.toggle('open', open);
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });
    // Clicking anywhere outside the menu and its toggle closes it.
    document.addEventListener('click', (e) => {
      const target = e.target as Node;
      if (!menu.contains(target) && !toggle.contains(target)) {
        setOpen(false);
      }
    });
    // Widening past the mobile breakpoint (where the hamburger hides; see components.css) closes it.
    window.matchMedia('(max-width: 900px)').addEventListener('change', (e) => {
      if (!e.matches) {
        setOpen(false);
      }
    });
  }
}

/* ── Bot check: Cloudflare Turnstile ──
   Loaded on first use, one widget per form. The check runs at submit and yields a single-use token;
   visitors only see a challenge if Cloudflare asks for interaction. */
interface TurnstileApi {
  render(box: HTMLElement, options: Record<string, unknown>): string;
  execute(id: string): void;
  reset(id: string): void;
}
interface Widget {
  id?: string;
  pending: { resolve: (token: string) => void; reject: (err: Error) => void } | null;
  used: boolean;
}

const turnstile = (() => {
  const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  let loading: Promise<TurnstileApi> | null = null;
  const widgets = new WeakMap<HTMLFormElement, Widget>();

  function load(): Promise<TurnstileApi> {
    if (window.turnstile) {
      return Promise.resolve(window.turnstile);
    }
    if (!loading) {
      loading = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = SCRIPT;
        script.async = true;
        script.onload = () => resolve(window.turnstile!);
        script.onerror = () => {
          loading = null;
          reject(new Error('Turnstile failed to load'));
        };
        document.head.appendChild(script);
      });
    }
    return loading;
  }

  function widgetFor(form: HTMLFormElement, ts: TurnstileApi): Widget {
    const existing = widgets.get(form);
    if (existing) {
      return existing;
    }
    const box = document.createElement('div');
    box.className = 'sb-turnstile';
    const submit = form.querySelector('[type="submit"]')!;
    submit.parentNode!.insertBefore(box, submit);
    const widget: Widget = { pending: null, used: false };
    const settle = (err: Error | null, token?: string) => {
      const pending = widget.pending;
      widget.pending = null;
      if (pending) {
        if (err) {
          pending.reject(err);
        } else {
          pending.resolve(token!);
        }
      }
    };
    widget.id = ts.render(box, {
      sitekey: config.turnstileSiteKey,
      execution: 'execute',
      appearance: 'interaction-only',
      theme: 'dark',
      callback: (token: string) => settle(null, token),
      'error-callback': (code: string) => {
        settle(new Error(`Turnstile error ${code}`));
        return true;
      },
      'timeout-callback': () => settle(new Error('Turnstile challenge timed out')),
    });
    widgets.set(form, widget);
    return widget;
  }

  // Loads the script and renders the widget ahead of submit (called on first focus in a form).
  async function prepare(form: HTMLFormElement): Promise<void> {
    widgetFor(form, await load());
  }

  // Resolves with a fresh token for this form; tokens are single-use, so every call runs a new check.
  async function token(form: HTMLFormElement): Promise<string | null> {
    if (!config.turnstileSiteKey) {
      return null;
    }
    const ts = await load();
    const widget = widgetFor(form, ts);
    return new Promise((resolve, reject) => {
      widget.pending = { resolve, reject };
      if (widget.used) {
        ts.reset(widget.id!);
      }
      widget.used = true;
      ts.execute(widget.id!);
    });
  }

  return { prepare, token };
})();

/* ── Forms ── */
export interface FormHooks {
  validate?(form: HTMLFormElement): boolean;
  onSuccess?(form: HTMLFormElement, fields: Fields, result: unknown): void;
  onError?(form: HTMLFormElement, err: unknown): void;
}

type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const forms = (() => {
  const HONEYPOT = 'bot-field';
  const hooks: Record<string, FormHooks> = {};

  function target(form: HTMLFormElement, attr: string): HTMLElement | null {
    const selector = form.getAttribute(attr);
    return selector ? document.querySelector<HTMLElement>(selector) : null;
  }
  // One entry per named field, in form order, with the label and the text the visitor saw.
  function entriesOf(form: HTMLFormElement): FormEntry[] {
    return (Array.from(form.elements) as FieldElement[])
      .filter((el) => el.name && el.name !== HONEYPOT && !/^(submit|button|hidden)$/.test(el.type))
      .map((el) => {
        const label = el.id && form.querySelector(`label[for="${el.id}"]`);
        const value = el.value.trim();
        return {
          name: el.name,
          label: label ? label.textContent!.replace(/\(optional\)|\*/g, '').trim() : el.name,
          value,
          text: el instanceof HTMLSelectElement && value ? el.selectedOptions[0].textContent!.trim() : value,
          type: el instanceof HTMLTextAreaElement ? 'textarea' : el.type,
        };
      });
  }
  // Fills every [data-field="<name>"] inside container with that submitted value.
  function fill(container: HTMLElement, fields: Fields) {
    container.querySelectorAll('[data-field]').forEach((el) => {
      el.textContent = fields[el.getAttribute('data-field')!] || '';
    });
  }
  // Whitespace-only input counts as empty, so `required` rejects it.
  function clearBlanks(form: HTMLFormElement) {
    form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach((el) => {
      if (el.value && !el.value.trim()) {
        el.value = '';
      }
    });
  }
  function setError(form: HTMLFormElement, failed: boolean) {
    form.querySelector('[type="submit"]')?.classList.toggle('is-error', failed);
  }
  function reset(form: HTMLFormElement) {
    form.reset();
    setError(form, false);
    (target(form, 'data-form-hide') || form).hidden = false;
    const confirm = target(form, 'data-form-confirm');
    if (confirm) {
      confirm.hidden = true;
    }
  }
  function showConfirmation(form: HTMLFormElement, fields: Fields) {
    const confirm = target(form, 'data-form-confirm');
    if (!confirm) {
      return;
    }
    fill(confirm, fields);
    (target(form, 'data-form-hide') || form).hidden = true;
    confirm.hidden = false;
    const rect = confirm.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      confirm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach((form) => {
    const name = form.getAttribute('data-form')!;
    form.addEventListener('focusin', () => {
      if (config.turnstileSiteKey) {
        turnstile.prepare(form).catch(() => {});
      }
    }, { once: true });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const hook = hooks[name] || {};
      clearBlanks(form);
      if (!(hook.validate ? hook.validate(form) : form.reportValidity())) {
        return;
      }
      const entries = entriesOf(form);
      const fields = fieldsOf(entries);
      const trap = form.elements.namedItem(HONEYPOT) as HTMLInputElement | null;
      const submit = form.querySelector<HTMLButtonElement>('[type="submit"]');
      if (submit) {
        submit.disabled = true;
      }
      // Started inside .then so an error thrown while building or sending the message also reaches .catch.
      Promise.resolve().then(async () => {
        // Bots that fill the hidden honeypot field get a fake success and nothing is sent.
        if (trap && trap.value) {
          return { ok: true };
        }
        const token = await turnstile.token(form);
        return api.submitForm(name, entries, token);
      }).then((result) => {
        setError(form, false);
        showConfirmation(form, fields);
        hook.onSuccess?.(form, fields, result);
      }).catch((err) => {
        // Keep what the visitor typed so they can retry; the red outline marks the failed send.
        console.error(`[SB.forms] ${name} failed`, err);
        setError(form, true);
        hook.onError?.(form, err);
      }).finally(() => {
        if (submit) {
          submit.disabled = false;
        }
      });
    });
  });

  return {
    register(name: string, formHooks: FormHooks) {
      hooks[name] = formHooks;
    },
    reset,
    fill,
    fieldsOf,
  };
})();

/* ── Modals ── */
const modal = (() => {
  const openClass = (m: Element) => m.getAttribute('data-modal-class') || 'open';
  function open(id: string) {
    const m = document.getElementById(id)!;
    m.querySelectorAll<HTMLFormElement>('form[data-form]').forEach(forms.reset);
    m.classList.add(openClass(m));
    document.body.style.overflow = 'hidden';
  }
  function close(m: Element | null) {
    if (!m || !m.classList.contains(openClass(m))) {
      return;
    }
    m.classList.remove(openClass(m));
    const anotherOpen = Array.from(document.querySelectorAll('[data-modal]')).some((other) => other.classList.contains(openClass(other)));
    if (!anotherOpen) {
      document.body.style.overflow = '';
    }
    m.dispatchEvent(new CustomEvent('sb:modal-close'));
  }

  document.addEventListener('click', (e) => {
    const target = e.target as Element;
    const opener = target.closest('[data-modal-open]');
    if (opener) {
      e.preventDefault();
      open(opener.getAttribute('data-modal-open')!);
      return;
    }
    const closer = target.closest('[data-modal-close]');
    if (closer) {
      close(closer.closest('[data-modal]'));
      return;
    }
    if (target.hasAttribute('data-modal')) {
      close(target);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('[data-modal]').forEach(close);
    }
  });

  return {
    open,
    close: (id: string) => close(document.getElementById(id)),
  };
})();

export const SB = { config, api, turnstile, forms, modal };
export type SBNamespace = typeof SB;

declare global {
  interface Window {
    SB: SBNamespace;
    turnstile?: TurnstileApi;
  }
}
window.SB = SB;
