/* Football (Gridiron) waitlist: custom field validation, then a confirmation overlay with a referral link.
   Submission itself goes through the shared form handling in site.ts. */
import { SB } from './site';

const form = document.getElementById('waitlist-form') as HTMLFormElement;
const confirmation = document.getElementById('confirmation')!;
const referralLinkText = document.getElementById('referral-link-text')!;
const copyBtn = document.getElementById('copy-btn')!;
let currentReferralLink = '';

function generateCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join('');
}

function flagInvalid(el: HTMLElement) {
  el.style.borderColor = '#FF5A5A';
  const clear = () => {
    el.style.borderColor = '';
  };
  el.addEventListener('input', clear, { once: true });
  el.addEventListener('change', clear, { once: true });
}

function resetCopyBtn() {
  copyBtn.classList.remove('copied');
  copyBtn.innerHTML = `
      <svg id="copy-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="5" y="5" width="7" height="7" rx="1"/>
        <path d="M9 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h2"/>
      </svg>
      Copy`;
}

SB.forms.register('waitlist', {
  // Same rules as the browser's `required` check, shown as red borders instead of tooltips.
  validate(form) {
    const empty = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[required]')).filter((el) => !el.value);
    empty.forEach(flagInvalid);
    if (empty.length) {
      return false;
    }

    const email = document.getElementById('email') as HTMLInputElement;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      flagInvalid(email);
      email.focus();
      return false;
    }
    return true;
  },
  onSuccess(_form, fields) {
    currentReferralLink = `scorebreakgridiron.com/ref/${generateCode(8)}`;
    referralLinkText.textContent = currentReferralLink;
    SB.forms.fill(confirmation, fields);
    resetCopyBtn();
    SB.modal.open('confirmation');
  },
});

confirmation.addEventListener('sb:modal-close', () => form.reset());

copyBtn.addEventListener('click', async () => {
  const fullLink = `https://${currentReferralLink}`;
  try {
    await navigator.clipboard.writeText(fullLink);
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = fullLink;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  copyBtn.classList.add('copied');
  copyBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M2 7l3.5 3.5L12 3"/>
      </svg>
      Copied!`;
  setTimeout(resetCopyBtn, 2200);
});
