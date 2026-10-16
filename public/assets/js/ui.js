/* Small bits shared by every page: theme toggle, preview banner, announcer. */
import { DEMO } from './config.js';
import { local } from './db.js';

// Light / dark ----------------------------------------------------------------
export function initTheme() {
  const saved = local.get('gb-theme');
  if (saved) document.documentElement.dataset.theme = saved;
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const isDark = () => {
    const t = document.documentElement.dataset.theme;
    return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  };
  const sync = () => {
    btn.setAttribute('aria-pressed', String(isDark()));
  };
  btn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    local.set('gb-theme', next);
    sync();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', sync);
  sync();
}

export function initDemoBanner() {
  if (!DEMO) return;
  const b = document.getElementById('demo-banner');
  if (b) b.hidden = false;
}

// Screen-reader announcements (used sparingly) ---------------------------------
export function announce(msg) {
  const el = document.getElementById('announcer');
  if (!el) return;
  el.textContent = '';
  setTimeout(() => { el.textContent = msg; }, 50);
}

export const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
