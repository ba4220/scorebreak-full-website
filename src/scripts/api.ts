/* The one place form data leaves the page. Every form submits through SB.api.submitForm(formName, entries),
   which POSTs an email request to the ScoreBreak API (<API_HOST>/api/marketing_site/mails):
     { type, title, body, email, token }
   - type:  which ScoreBreak inbox it lands in: general (ben@), support (support@), test (radek@, used by `astro dev`)
   - title: email subject, at most 200 characters
   - body:  plain-text email body, one "Label: value" line per field, at most 10000 characters
   - email: the submitter's email, sent as Reply-To
   - token: Cloudflare Turnstile token, single-use; the API verifies it */

// One per named form field, in form order; text is what the visitor saw (e.g. an option's label).
export interface FormEntry {
  name: string;
  label: string;
  value: string;
  text: string;
  type: string;
}

export type Fields = Record<string, string>;

type MailType = 'general' | 'support' | 'test';

export interface Message {
  type: MailType;
  title: string;
  body: string;
  email: string;
  token: string | null;
}

export const config = {
  // Cloudflare Turnstile site key (public); its secret lives only on the API. Works only on the widget's
  // registered hostnames (localhost included).
  turnstileSiteKey: '0x4AAAAAAFsh1-4bXRbaMMU5',
  // Set per build: the staging deploy script passes PUBLIC_API_HOST; `astro dev` defaults to the staging API.
  apiHost: import.meta.env.PUBLIC_API_HOST || (import.meta.env.DEV ? 'https://staging-api2.scorebreak.io' : 'https://api2.scorebreak.io'),
};

const MAIL: Record<string, { type: MailType; title: (f: Fields) => string }> = {
  'contact-sales': { type: 'general', title: (f) => `Contact request: ${f.firstName} ${f.lastName}` },
  'demo-request': { type: 'general', title: (f) => `Demo request: ${f.organization}` },
  'soc2-request': { type: 'general', title: (f) => `SOC 2 report request: ${f.email}` },
  'support-request': { type: 'support', title: (f) => `Support request: ${f.name}` },
  'waitlist': { type: 'general', title: (f) => `Gridiron waitlist: ${f.first_name} ${f.last_name}, ${f.school}` },
};

// A non-2xx response from the mail API; data is the parsed JSON body (null if it wasn't JSON).
export class ApiError extends Error {
  constructor(public status: number, public data: unknown) {
    super(`HTTP ${status}: ${JSON.stringify(data)}`);
  }
}

export function fieldsOf(entries: FormEntry[]): Fields {
  return Object.fromEntries(entries.map((e) => [e.name, e.value]));
}

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

function buildMessage(formName: string, entries: FormEntry[]): Message {
  const mail = MAIL[formName];
  if (!mail) {
    throw new Error(`No MAIL config for form "${formName}"`);
  }
  const fields = fieldsOf(entries);
  const emailEntry = entries.find((e) => e.type === 'email');
  if (!emailEntry) {
    throw new Error(`Form "${formName}" has no email field`);
  }

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
    type: import.meta.env.DEV ? 'test' : mail.type,
    title: clip(mail.title(fields), 200),
    body: clip(lines.join('\n'), 10000),
    email: emailEntry.value,
    token: null,
  };
}

export const api = {
  MAIL,
  buildMessage,

  // Rejects with ApiError on any non-2xx (422 validation/invalid token, 429 rate limit, 500); the form keeps its
  // input for a retry, which runs a fresh Turnstile check.
  async send(message: Message): Promise<unknown> {
    const url = `${config.apiHost}/api/marketing_site/mails`;
    if (import.meta.env.DEV) {
      console.info('[SB.api] POST', url, message);
    }
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    const text = await r.text();
    if (import.meta.env.DEV) {
      console.info(`[SB.api] ${r.status}`, text);
    }
    let data: unknown = null;
    try {
      data = JSON.parse(text);
    } catch {
      // Not JSON (e.g. a proxy's HTML error page); the status alone decides the message.
    }
    if (!r.ok) {
      throw new ApiError(r.status, data);
    }
    return data;
  },

  // Goes through api.send (not a local reference) so window.SB.api.send can be swapped, as the tests do.
  submitForm(formName: string, entries: FormEntry[], turnstileToken?: string | null): Promise<unknown> {
    const message = buildMessage(formName, entries);
    message.token = turnstileToken || null;
    return api.send(message);
  },
};
