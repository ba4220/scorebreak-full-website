/* The one place form data leaves the page. Every form submits through SB.api.submitForm(formName, entries),
   which turns it into a ready-to-send email request:
     { form, category, title, replyTo, body, fields }
   - category: which ScoreBreak inbox it lands in (MAIL below)
   - title:    email subject
   - replyTo:  the submitter's email, so a reply goes straight to them
   - body:     plain-text email body, one "Label: value" line per field
   - fields:   the raw values, keyed by input name
   Wire the real API call in SB.api.send. */
window.SB = window.SB || {};

(function() {
  var MAIL = {
    'contact-sales':   { category: 'sales',   title: function(f) { return 'Contact request: ' + f.firstName + ' ' + f.lastName; } },
    'demo-request':    { category: 'sales',   title: function(f) { return 'Demo request: ' + f.organization; } },
    'soc2-request':    { category: 'sales',   title: function(f) { return 'SOC 2 report request: ' + f.email; } },
    'support-request': { category: 'support', title: function(f) { return 'Support request: ' + f.name; } },
    'waitlist':        { category: 'gridiron-waitlist', title: function(f) { return 'Gridiron waitlist: ' + f.first_name + ' ' + f.last_name + ', ' + f.school; } }
  };

  // entries: [{ name, label, value, text, type }] from SB.forms; text is what the visitor saw (e.g. an option's label).
  function buildMessage(formName, entries) {
    var mail = MAIL[formName];
    if (!mail) throw new Error('No MAIL config for form "' + formName + '"');
    var fields = SB.forms.fieldsOf(entries);
    var emailEntry = entries.filter(function(e) { return e.type === 'email'; })[0];

    var lines = [];
    entries.forEach(function(e) {
      var text = e.text || '—';
      if (e.type === 'textarea') {
        lines.push('', e.label + ':', text);
      } else {
        lines.push(e.label + ': ' + text);
      }
    });
    lines.push('', 'Sent from: ' + window.location.href);

    return {
      form: formName,
      category: mail.category,
      title: mail.title(fields),
      replyTo: emailEntry ? emailEntry.value : null,
      body: lines.join('\n'),
      fields: fields
    };
  }

  SB.api = {
    MAIL: MAIL,
    buildMessage: buildMessage,

    // FAKE: nothing is sent yet. Replace with the real request, e.g.
    //   return fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(message) })
    //     .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    send: function(message) {
      console.info('[SB.api] send', message);
      return new Promise(function(resolve) {
        setTimeout(function() { resolve({ ok: true }); }, 300);
      });
    },

    submitForm: function(formName, entries) {
      return SB.api.send(buildMessage(formName, entries));
    }
  };
})();
