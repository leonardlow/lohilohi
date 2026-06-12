(function () {

  // ── Config ──
  const SITE_AUTH_KEY  = 'lohilohi_site_auth';
  const SITE_HASH      = '1568690823383c442880facc51eee52d86ac34524de740cab96dd3334642c18d';
  const NOTES_PREFIX   = 'lohilohi__tab-notes__';

  // ── Crypto ──
  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  // ── Site-wide Auth ──
  function showSiteAuth(onSuccess) {
    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.innerHTML = `
      <div class="auth-card">
        <div class="auth-lock">🌺</div>
        <h2 class="auth-title">Alohi Business HQ</h2>
        <p class="auth-subtitle">Enter your access code to continue.</p>
        <input class="auth-input" type="password" placeholder="Access code" autocomplete="off" />
        <button class="auth-btn" type="button">Enter</button>
        <p class="auth-error" aria-live="polite"></p>
      </div>`;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('.auth-input');
    const btn   = overlay.querySelector('.auth-btn');
    const error = overlay.querySelector('.auth-error');

    async function attempt() {
      const hash = await sha256(input.value.trim());
      if (hash === SITE_HASH) {
        localStorage.setItem(SITE_AUTH_KEY, SITE_HASH);
        overlay.style.transition = 'opacity 0.3s ease';
        overlay.style.opacity = '0';
        setTimeout(() => { overlay.remove(); onSuccess(); }, 300);
      } else {
        error.textContent = 'Incorrect code. Try again.';
        input.classList.add('auth-shake');
        input.value = '';
        setTimeout(() => input.classList.remove('auth-shake'), 400);
      }
    }

    btn.addEventListener('click', attempt);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
    setTimeout(() => input.focus(), 50);
  }

  function checkAuth(onSuccess) {
    if (localStorage.getItem(SITE_AUTH_KEY) === SITE_HASH) {
      onSuccess();
    } else {
      showSiteAuth(onSuccess);
    }
  }

  // ── Tabs ──
  function activateTab(tabKey) {
    document.querySelectorAll('.tab').forEach(t =>
      t.classList.toggle('active', t.dataset.tab === tabKey));
    document.querySelectorAll('.tab-panel').forEach(p =>
      p.classList.toggle('active', p.id === `tab-${tabKey}`));
    history.replaceState(null, '', `#${tabKey}`);
    window.scrollTo(0, 0);
  }

  function initTabs() {
    document.querySelectorAll('.tab[data-tab]').forEach(tab =>
      tab.addEventListener('click', () => activateTab(tab.dataset.tab)));

    document.querySelectorAll('.section-card[data-target-tab]').forEach(card => {
      card.addEventListener('click', () => activateTab(card.dataset.targetTab));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') activateTab(card.dataset.targetTab);
      });
    });

    document.querySelectorAll('.banner-link[data-target-tab]').forEach(link =>
      link.addEventListener('click', () => activateTab(link.dataset.targetTab)));

    const hash = location.hash.replace('#', '');
    if (hash && document.querySelector(`.tab[data-tab="${hash}"]`)) {
      activateTab(hash);
    }
  }

  // ── Countdown Timers ──
  function initCountdowns() {
    const targets = {
      'countdown-exit':     new Date('2026-07-17'),
      'countdown-notice':   new Date('2027-03-02'),
      'countdown-contract': new Date('2027-04-01'),
    };
    const now = new Date();
    Object.entries(targets).forEach(([id, target]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const days = Math.ceil((target - now) / 86400000);
      el.textContent = days > 0 ? `${days}` : '0';
    });
  }

  // ── Per-Tab Notes ──
  function initTabNotes() {
    document.querySelectorAll('.tab-notes[data-notes-key]').forEach(wrapper => {
      const key = NOTES_PREFIX + wrapper.dataset.notesKey;
      const saved = localStorage.getItem(key) || '';
      const ta = wrapper.querySelector('.tab-notes-area');
      const ind = wrapper.querySelector('.tab-notes-indicator');
      if (!ta) return;

      ta.value = saved;
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';

      ta.addEventListener('input', () => {
        localStorage.setItem(key, ta.value);
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
        if (ind) {
          ind.classList.add('visible');
          clearTimeout(ind._t);
          ind._t = setTimeout(() => ind.classList.remove('visible'), 1600);
        }
      });
    });
  }

  // ── Action Item Checkboxes ──
  function initActionItems() {
    document.querySelectorAll('.action-item[data-action-id]').forEach(item => {
      const key = `lohilohi__action__${item.dataset.actionId}`;
      const cb = item.querySelector('.action-check');
      if (!cb) return;
      cb.checked = localStorage.getItem(key) === '1';
      if (cb.checked) item.classList.add('action-done');
      cb.addEventListener('change', () => {
        localStorage.setItem(key, cb.checked ? '1' : '0');
        item.classList.toggle('action-done', cb.checked);
      });
    });
  }

  // ── Lightbox ──
  function initLightbox() {
    document.querySelectorAll('.image-strip img').forEach(img => {
      img.addEventListener('click', () => {
        const lb = document.createElement('div');
        lb.id = 'lightbox';
        const full = document.createElement('img');
        full.src = img.src; full.alt = img.alt;
        lb.appendChild(full);
        lb.addEventListener('click', () => lb.remove());
        document.body.appendChild(lb);
      });
    });
  }

  // ── Init ──
  function boot() {
    initTabs();
    initCountdowns();
    initTabNotes();
    initActionItems();
    initLightbox();
  }

  document.addEventListener('DOMContentLoaded', () => {
    checkAuth(boot);
  });

})();
