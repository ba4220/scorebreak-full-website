/* The one place form data leaves the page. Every form submits through SB.api.submitForm(formName, entries),
   which turns it into a ready-to-send email request:
     { form, category, title, replyTo, body, fields }
   - category: which ScoreBreak inbox it lands in (MAIL below)
   - title:    email subject
   - replyTo:  the submitter's email, so a reply goes straight to them
   - body:     plain-text email body, one "Label: value" line per field
   - fields:   the raw values, keyed by input name
   - turnstileToken: Cloudflare Turnstile token; the API must verify it with Siteverify before sending
   Wire the real API call in SB.api.send. */

// One per named form field, in form order; text is what the visitor saw (e.g. an option's label).
export interface FormEntry {
  name: string;
  label: string;
  value: string;
  text: string;
  type: string;
}

export type Fields = Record<string, string>;

export interface Message {
  form: string;
  category: string;
  title: string;
  replyTo: string | null;
  body: string;
  fields: Fields;
  turnstileToken?: string | null;
}

export const config = {
  // Cloudflare Turnstile site key (public). Its secret key belongs only on the API. The real key only works on
  // the hostnames registered for the widget, so local development uses Cloudflare's always-passing test key.
  turnstileSiteKey: /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
    ? '1x00000000000000000000AA'
    : '0x4AAAAAAFsh1-4bXRbaMMU5',
};

const MAIL: Record<string, { category: string; title: (f: Fields) => string }> = {
  'contact-sales': { category: 'sales', title: (f) => `Contact request: ${f.firstName} ${f.lastName}` },
  'demo-request': { category: 'sales', title: (f) => `Demo request: ${f.organization}` },
  'soc2-request': { category: 'sales', title: (f) => `SOC 2 report request: ${f.email}` },
  'support-request': { category: 'support', title: (f) => `Support request: ${f.name}` },
  'waitlist': { category: 'gridiron-waitlist', title: (f) => `Gridiron waitlist: ${f.first_name} ${f.last_name}, ${f.school}` },
};

export function fieldsOf(entries: FormEntry[]): Fields {
  return Object.fromEntries(entries.map((e) => [e.name, e.value]));
}

function buildMessage(formName: string, entries: FormEntry[]): Message {
  const mail = MAIL[formName];
  if (!mail) {
    throw new Error(`No MAIL config for form "${formName}"`);
  }
  const fields = fieldsOf(entries);
  const emailEntry = entries.find((e) => e.type === 'email');

  const lines: string[] = [];
  for (const e of entries) {
    const text = e.text || '—';
    if (e.type === 'textarea') {
      lines.push('', `${e.label}:`, text);
    } else {
      lines.push(`${e.label}: ${text}`);
    }
  }
  lines.push('', `Sent from: ${window.location.href}`);

  return {
    form: formName,
    category: mail.category,
    title: mail.title(fields),
    replyTo: emailEntry ? emailEntry.value : null,
    body: lines.join('\n'),
    fields,
  };
}

export const api = {
  MAIL,
  buildMessage,

  // FAKE: nothing is sent yet. Replace with the real request, e.g.
  //   const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(message) });
  //   if (!r.ok) throw new Error(`HTTP ${r.status}`);
  //   return r.json();
  send(message: Message): Promise<unknown> {
    console.info('[SB.api] send', message);
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ok: true }), 300);
    });
  },

  // Goes through api.send (not a local reference) so window.SB.api.send can be swapped, as the tests do.
  submitForm(formName: string, entries: FormEntry[], turnstileToken?: string | null): Promise<unknown> {
    const message = buildMessage(formName, entries);
    message.turnstileToken = turnstileToken || null;
    return api.send(message);
  },
};
