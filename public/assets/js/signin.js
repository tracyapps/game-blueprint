/* START PAGE: sign in with name + email → emailed link or 6-digit code. */
import { CONFIG, DEMO } from './config.js';
import { getUser, sendSignIn, verifyCode, signOut, local } from './db.js';
import { initTheme, initDemoBanner } from './ui.js';

initTheme();
initDemoBanner();

const $ = (s) => document.querySelector(s);
const stepStart = $('#step-start');
const stepCheck = $('#step-check');
const stepBack = $('#step-back');
const err = $('#signin-error');

document.querySelectorAll('[data-owner]').forEach((el) => { el.textContent = CONFIG.ownerName; });

function showStep(el) {
  for (const s of [stepStart, stepCheck, stepBack]) s.hidden = s !== el;
  el.querySelector('h2')?.focus();
}

function showError(msg) {
  err.textContent = msg;
  err.hidden = !msg;
}

(async () => {
  const user = await getUser();
  if (user) {
    $('#back-name').textContent = user.name || user.email;
    showStep(stepBack);
    return;
  }
  const last = local.get('gb-last-email');
  if (last) $('#email').value = last;
  const lastName = local.get('gb-pending-name');
  if (lastName) $('#name').value = lastName;
})();

$('#signin-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('');
  const name = $('#name').value.trim();
  const email = $('#email').value.trim();
  if (!name || !email || !$('#email').checkValidity()) {
    showError('Please enter your name and a valid email address.');
    (!name ? $('#name') : $('#email')).focus();
    return;
  }
  const btn = $('#signin-submit');
  btn.disabled = true;
  btn.textContent = 'Sending…';
  try {
    local.set('gb-last-email', email);
    const r = await sendSignIn(name, email);
    if (r.demo) { location.href = 'survey.html'; return; }
    $('#sent-to').textContent = email;
    showStep(stepCheck);
  } catch (ex) {
    const rate = /rate|too many|seconds/i.test(ex.message || '');
    showError(rate
      ? 'Too many sign-in emails were requested. Wait a minute, then try again.'
      : `We couldn’t send the email: ${ex.message || ex}`);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Email me a sign-in link';
  }
});

$('#code-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = $('#code').value.replace(/\s/g, '');
  const cerr = $('#code-error');
  cerr.hidden = true;
  if (!/^\d{6,8}$/.test(code)) {
    cerr.textContent = 'The code is the 6-digit number in the email.';
    cerr.hidden = false;
    $('#code').focus();
    return;
  }
  try {
    await verifyCode(local.get('gb-last-email'), code);
    location.href = 'survey.html';
  } catch (ex) {
    cerr.textContent = 'That code didn’t work or has expired. Check the newest email, or send a new one.';
    cerr.hidden = false;
    $('#code').focus();
  }
});

$('#use-different').addEventListener('click', () => showStep(stepStart));
$('#continue').addEventListener('click', () => { location.href = 'survey.html'; });
$('#not-me').addEventListener('click', async () => { await signOut(); showStep(stepStart); });

if (DEMO) {
  $('#signin-submit').textContent = 'Start (preview mode)';
}
