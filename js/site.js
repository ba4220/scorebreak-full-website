/* Shared behaviour for every page. Markup opts in with data-* attributes:
   - [data-dropdown] wrapping a [data-dropdown-toggle] button: toggles .open on the wrapper
   - [data-nav-toggle]: opens/closes the #navMobile menu
   - [data-modal] (optional data-modal-class, default "open"), opened by [data-modal-open="<id>"],
     closed by [data-modal-close], a backdrop click, or Escape
   - form[data-form="<name>"]: checked with Cloudflare Turnstile, then submitted through SB.api.submitForm
     (js/api.js), which formats the email. A filled honeypot field (bot-field) skips both. Optional
     data-form-confirm="<selector>" is revealed on success (its [data-field] spans are filled
     from the submitted values) and data-form-hide="<selector>" is hidden (defaults to the form).
     A failed send keeps the form filled and outlines its submit button red (.is-error) until a send succeeds.
     Per-form hooks: SB.forms.register(name, { validate(form), onSuccess(form, fields), onError(form, err) }). */
window.SB = window.SB || {};

/* ── Dropdowns ── */
(function() {
  var dropdowns = document.querySelectorAll('[data-dropdown]');
  function setOpen(dd, open) {
    dd.classList.toggle('open', open);
    dd.querySelector('[data-dropdown-toggle]').setAttribute('aria-expanded', String(open));
  }
  dropdowns.forEach(function(dd) {
    setOpen(dd, false);
    dd.querySelector('[data-dropdown-toggle]').addEventListener('click', function(e) {
      e.stopPropagation();
      var open = !dd.classList.contains('open');
      dropdowns.forEach(function(d) { setOpen(d, false); });
      setOpen(dd, open);
    });
  });
  document.addEventListener('click', function() {
    dropdowns.forEach(function(d) { setOpen(d, false); });
  });
})();

/* ── Mobile menu ── */
(function() {
  var toggle = document.querySelector('[data-nav-toggle]');
  var menu = document.getElementById('navMobile');
  if (!toggle || !menu) return;
  function setOpen(open) {
    menu.classList.toggle('open', open);
    toggle.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', String(open));
  }
  toggle.addEventListener('click', function() { setOpen(!menu.classList.contains('open')); });
  menu.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() { setOpen(false); });
  });
  // Clicking anywhere outside the menu and its toggle closes it.
  document.addEventListener('click', function(e) {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
  });
  // Widening past the mobile breakpoint (where the hamburger hides; see components.css) closes it.
  window.matchMedia('(max-width: 900px)').addEventListener('change', function(e) {
    if (!e.matches) setOpen(false);
  });
})();

/* ── Bot check: Cloudflare Turnstile ──
   Loaded on first use, one widget per form. The check runs at submit and yields a single-use token;
   visitors only see a challenge if Cloudflare asks for interaction. */
SB.turnstile = (function() {
  var SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  var loading = null;
  var widgets = new WeakMap();

  function load() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (!loading) {
      loading = new Promise(function(resolve, reject) {
        var script = document.createElement('script');
        script.src = SCRIPT;
        script.async = true;
        script.onload = function() { resolve(window.turnstile); };
        script.onerror = function() {
          loading = null;
          reject(new Error('Turnstile failed to load'));
        };
        document.head.appendChild(script);
      });
    }
    return loading;
  }

  function widgetFor(form, ts) {
    var widget = widgets.get(form);
    if (widget) return widget;
    var box = document.createElement('div');
    box.className = 'sb-turnstile';
    var submit = form.querySelector('[type="submit"]');
    submit.parentNode.insertBefore(box, submit);
    widget = { pending: null, used: false };
    function settle(err, token) {
      var pending = widget.pending;
      widget.pending = null;
      if (pending) err ? pending.reject(err) : pending.resolve(token);
    }
    widget.id = ts.render(box, {
      sitekey: SB.config.turnstileSiteKey,
      execution: 'execute',
      appearance: 'interaction-only',
      theme: 'dark',
      callback: function(token) { settle(null, token); },
      'error-callback': function(code) { settle(new Error('Turnstile error ' + code)); return true; },
      'timeout-callback': function() { settle(new Error('Turnstile challenge timed out')); }
    });
    widgets.set(form, widget);
    return widget;
  }

  // Loads the script and renders the widget ahead of submit (called on first focus in a form).
  function prepare(form) {
    return load().then(function(ts) { widgetFor(form, ts); });
  }

  // Resolves with a fresh token for this form; tokens are single-use, so every call runs a new check.
  function token(form) {
    if (!SB.config.turnstileSiteKey) return Promise.resolve(null);
    return load().then(function(ts) {
      var widget = widgetFor(form, ts);
      return new Promise(function(resolve, reject) {
        widget.pending = { resolve: resolve, reject: reject };
        if (widget.used) ts.reset(widget.id);
        widget.used = true;
        ts.execute(widget.id);
      });
    });
  }

  return { prepare: prepare, token: token };
})();

/* ── Forms ── */
SB.forms = (function() {
  var HONEYPOT = 'bot-field';
  var hooks = {};

  function target(form, attr) {
    var selector = form.getAttribute(attr);
    return selector ? document.querySelector(selector) : null;
  }
  // One entry per named field, in form order, with the label and the text the visitor saw.
  function entriesOf(form) {
    return Array.prototype.filter.call(form.elements, function(el) {
      return el.name && el.name !== HONEYPOT && !/^(submit|button|hidden)$/.test(el.type);
    }).map(function(el) {
      var label = el.id && form.querySelector('label[for="' + el.id + '"]');
      var value = el.value.trim();
      return {
        name: el.name,
        label: label ? label.textContent.replace(/\(optional\)|\*/g, '').trim() : el.name,
        value: value,
        text: el.tagName === 'SELECT' && value ? el.selectedOptions[0].textContent.trim() : value,
        type: el.tagName === 'TEXTAREA' ? 'textarea' : el.type
      };
    });
  }
  function fieldsOf(entries) {
    var fields = {};
    entries.forEach(function(e) { fields[e.name] = e.value; });
    return fields;
  }
  // Fills every [data-field="<name>"] inside container with that submitted value.
  function fill(container, fields) {
    container.querySelectorAll('[data-field]').forEach(function(el) {
      el.textContent = fields[el.getAttribute('data-field')] || '';
    });
  }
  // Whitespace-only input counts as empty, so `required` rejects it.
  function clearBlanks(form) {
    form.querySelectorAll('input, textarea').forEach(function(el) {
      if (el.value && !el.value.trim()) el.value = '';
    });
  }
  function setError(form, failed) {
    var submit = form.querySelector('[type="submit"]');
    if (submit) submit.classList.toggle('is-error', failed);
  }
  function reset(form) {
    form.reset();
    setError(form, false);
    (target(form, 'data-form-hide') || form).hidden = false;
    var confirm = target(form, 'data-form-confirm');
    if (confirm) confirm.hidden = true;
  }
  function showConfirmation(form, fields) {
    var confirm = target(form, 'data-form-confirm');
    if (!confirm) return;
    fill(confirm, fields);
    (target(form, 'data-form-hide') || form).hidden = true;
    confirm.hidden = false;
    var rect = confirm.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      confirm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  document.querySelectorAll('form[data-form]').forEach(function(form) {
    var name = form.getAttribute('data-form');
    form.addEventListener('focusin', function() {
      if (SB.config.turnstileSiteKey) SB.turnstile.prepare(form).catch(function() {});
    }, { once: true });
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var hook = hooks[name] || {};
      clearBlanks(form);
      if (!(hook.validate ? hook.validate(form) : form.reportValidity())) return;
      var entries = entriesOf(form);
      var fields = fieldsOf(entries);
      var trap = form.elements[HONEYPOT];
      var submit = form.querySelector('[type="submit"]');
      if (submit) submit.disabled = true;
      // Started inside .then so an error thrown while building or sending the message also reaches .catch.
      Promise.resolve().then(function() {
        // Bots that fill the hidden honeypot field get a fake success and nothing is sent.
        if (trap && trap.value) return { ok: true };
        return SB.turnstile.token(form).then(function(token) {
          return SB.api.submitForm(name, entries, token);
        });
      }).then(function(result) {
        setError(form, false);
        showConfirmation(form, fields);
        if (hook.onSuccess) hook.onSuccess(form, fields, result);
      }).catch(function(err) {
        // Keep what the visitor typed so they can retry; the red outline marks the failed send.
        console.error('[SB.forms] ' + name + ' failed', err);
        setError(form, true);
        if (hook.onError) hook.onError(form, err);
      }).finally(function() {
        if (submit) submit.disabled = false;
      });
    });
  });

  return {
    register: function(name, formHooks) { hooks[name] = formHooks; },
    reset: reset,
    fill: fill,
    fieldsOf: fieldsOf
  };
})();

/* ── Modals ── */
SB.modal = (function() {
  function openClass(modal) {
    return modal.getAttribute('data-modal-class') || 'open';
  }
  function open(id) {
    var modal = document.getElementById(id);
    modal.querySelectorAll('form[data-form]').forEach(SB.forms.reset);
    modal.classList.add(openClass(modal));
    document.body.style.overflow = 'hidden';
  }
  function close(modal) {
    if (!modal || !modal.classList.contains(openClass(modal))) return;
    modal.classList.remove(openClass(modal));
    var anotherOpen = Array.prototype.some.call(document.querySelectorAll('[data-modal]'), function(m) {
      return m.classList.contains(openClass(m));
    });
    if (!anotherOpen) document.body.style.overflow = '';
    modal.dispatchEvent(new CustomEvent('sb:modal-close'));
  }

  document.addEventListener('click', function(e) {
    var opener = e.target.closest('[data-modal-open]');
    if (opener) {
      e.preventDefault();
      open(opener.getAttribute('data-modal-open'));
      return;
    }
    var closer = e.target.closest('[data-modal-close]');
    if (closer) {
      close(closer.closest('[data-modal]'));
      return;
    }
    if (e.target.hasAttribute('data-modal')) close(e.target);
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') document.querySelectorAll('[data-modal]').forEach(close);
  });

  return {
    open: open,
    close: function(id) { close(document.getElementById(id)); }
  };
})();
