(function () {
  // ── Config ──
  const PREFIX = 'lohilohi__';
  const CONTRACT_AUTH_KEY = 'lohilohi_contract_auth';
  const CONTRACT_HASH = '1568690823383c442880facc51eee52d86ac34524de740cab96dd3334642c18d';

  const SECTIONS = {
    'roadmap':             4,
    'business-foundation': 4,
    'contract':            4,
    'finances':            4,
    'accounting':          4,
    'brand-deals':         4,
    'merch':               4,
    'content-strategy':    4,
    'calls':               2,
  };

  // ── Storage ──
  function skey(section, cardIdx, type, itemIdx) {
    const base = `${PREFIX}${section}__card${cardIdx}__${type}`;
    return itemIdx !== undefined ? `${base}__${itemIdx}` : base;
  }

  // ── Tabs ──
  function activateTab(tabKey, skipAuth) {
    if (tabKey === 'contract' && !skipAuth) {
      if (localStorage.getItem(CONTRACT_AUTH_KEY) !== CONTRACT_HASH) {
        showContractAuth(() => activateTab('contract', true));
        return;
      }
    }

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

  // ── Contract Auth ──
  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  function showContractAuth(onSuccess) {
    const existing = document.getElementById('auth-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.innerHTML = `
      <div class="auth-card">
        <div class="auth-lock">🔒</div>
        <h2 class="auth-title">Contract</h2>
        <p class="auth-subtitle">This section is protected. Enter the access code to continue.</p>
        <input class="auth-input" type="password" placeholder="Access code" autocomplete="off" />
        <button class="auth-btn" type="button">Unlock</button>
        <p class="auth-error" aria-live="polite"></p>
      </div>`;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('.auth-input');
    const btn   = overlay.querySelector('.auth-btn');
    const error = overlay.querySelector('.auth-error');

    async function attempt() {
      const hash = await sha256(input.value.trim());
      if (hash === CONTRACT_HASH) {
        localStorage.setItem(CONTRACT_AUTH_KEY, CONTRACT_HASH);
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

  // ── Answer Widgets ──
  function flashSaved(card) {
    const ind = card.querySelector('.save-indicator');
    if (!ind) return;
    ind.classList.add('visible');
    clearTimeout(ind._t);
    ind._t = setTimeout(() => ind.classList.remove('visible'), 1600);
  }

  function initCard(card, cardIdx, section) {
    // Checkboxes
    card.querySelectorAll('ul li').forEach((li, itemIdx) => {
      const key = skey(section, cardIdx, 'check', itemIdx);
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'item-check';
      cb.checked = localStorage.getItem(key) === '1';
      cb.title = 'Mark as done';
      cb.addEventListener('change', () => {
        localStorage.setItem(key, cb.checked ? '1' : '0');
        flashSaved(card);
        updateStatus();
      });
      li.classList.add('has-checkbox');
      li.prepend(cb);
    });

    // Notes widget
    const notesKey = skey(section, cardIdx, 'notes');
    const saved = localStorage.getItem(notesKey) || '';

    const wrapper  = document.createElement('div');
    wrapper.className = 'notes-wrapper';

    const display  = document.createElement('div');
    display.className = 'notes-display';
    const dText    = document.createElement('p');
    dText.className = 'notes-display-text';
    const editBtn  = document.createElement('button');
    editBtn.className = 'notes-edit-btn';
    editBtn.type = 'button';
    editBtn.textContent = '✏️ Edit';
    display.append(dText, editBtn);

    const editWrap = document.createElement('div');
    editWrap.className = 'notes-edit-wrap';
    const lbl = document.createElement('label');
    lbl.className = 'notes-label';
    lbl.textContent = 'Notes & Answers';
    const ta = document.createElement('textarea');
    ta.className = 'notes-area';
    ta.placeholder = 'Write your answers, decisions, or notes here…';
    ta.value = saved;
    const ind = document.createElement('span');
    ind.className = 'save-indicator';
    ind.textContent = 'Saved ✓';
    editWrap.append(lbl, ta, ind);

    wrapper.append(display, editWrap);
    card.appendChild(wrapper);

    function resize() { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }

    function toView() {
      if (!ta.value.trim()) return;
      dText.textContent = ta.value;
      display.style.display = 'block';
      editWrap.style.display = 'none';
    }

    function toEdit() {
      display.style.display = 'none';
      editWrap.style.display = 'block';
      requestAnimationFrame(() => { resize(); ta.focus(); ta.selectionStart = ta.selectionEnd = ta.value.length; });
    }

    ta.addEventListener('input', () => { localStorage.setItem(notesKey, ta.value); resize(); flashSaved(card); updateStatus(); });
    ta.addEventListener('blur', toView);
    editBtn.addEventListener('click', toEdit);
    display.addEventListener('click', e => { if (e.target !== editBtn) toEdit(); });

    saved.trim() ? toView() : (display.style.display = 'none', editWrap.style.display = 'block');
  }

  function initAllCards() {
    document.querySelectorAll('.tab-panel[data-section]').forEach(panel => {
      const section = panel.dataset.section;
      panel.querySelectorAll('.content-card').forEach((card, i) => initCard(card, i, section));
    });
  }

  // ── Completion Status ──
  function getStatus(section, cardCount) {
    const pfx = `${PREFIX}${section}__`;
    const keys = Object.keys(localStorage).filter(k => k.startsWith(pfx));
    if (!keys.length) return 'empty';
    const hasData = keys.some(k => { const v = localStorage.getItem(k); return v === '1' || (v && v.trim()); });
    if (!hasData) return 'empty';
    let filled = 0;
    for (let i = 0; i < cardCount; i++) {
      const v = localStorage.getItem(`${pfx}card${i}__notes`);
      if (v && v.trim()) filled++;
    }
    return filled >= cardCount ? 'complete' : 'progress';
  }

  function updateStatus() {
    let anyData = false;

    Object.entries(SECTIONS).forEach(([key, count]) => {
      const status = getStatus(key, count);
      if (status !== 'empty') anyData = true;

      // Overview card color
      const card = document.querySelector(`.section-card[data-target-tab="${key}"]`);
      if (card) {
        card.classList.remove('card-complete', 'card-progress');
        const badge = card.querySelector('.card-status');
        if (status === 'complete') {
          card.classList.add('card-complete');
          if (badge) { badge.className = 'card-status status-active'; badge.textContent = 'Complete ✓'; }
        } else if (status === 'progress') {
          card.classList.add('card-progress');
          if (badge) { badge.className = 'card-status status-pending'; badge.textContent = 'In progress'; }
        }
      }

      // Tab dot
      const tab = document.querySelector(`.tab[data-tab="${key}"]`);
      if (tab) {
        let dot = tab.querySelector('.tab-dot');
        if (!dot) { dot = document.createElement('span'); dot.className = 'tab-dot'; tab.appendChild(dot); }
        dot.className = 'tab-dot' + (status === 'complete' ? ' dot-complete' : status === 'progress' ? ' dot-progress' : '');
      }
    });

    const hint = document.getElementById('export-hint');
    if (hint) hint.style.display = anyData ? 'block' : 'none';
  }

  // ── Export ──
  function exportAnswers() {
    const out = { exported: new Date().toISOString(), title: 'Alohi Business HQ — Survey Answers', sections: {} };
    Object.entries(SECTIONS).forEach(([key, count]) => {
      const pfx = `${PREFIX}${key}__`;
      const section = {};
      for (let i = 0; i < count; i++) {
        const notes = localStorage.getItem(`${pfx}card${i}__notes`) || '';
        const checkKeys = Object.keys(localStorage).filter(k => k.startsWith(`${pfx}card${i}__check__`)).sort();
        section[`card_${i}`] = { notes, checks: checkKeys.map(k => localStorage.getItem(k) === '1') };
      }
      out.sections[key] = section;
    });
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: `alohi-survey-${new Date().toISOString().split('T')[0]}.json` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Lightbox ──
  function initLightbox() {
    document.querySelectorAll('.image-strip img').forEach(img => {
      img.addEventListener('click', () => {
        const lb = document.createElement('div');
        lb.id = 'lightbox';
        const full = document.createElement('img');
        full.src = img.src;
        full.alt = img.alt;
        lb.appendChild(full);
        lb.addEventListener('click', () => lb.remove());
        document.body.appendChild(lb);
      });
    });
  }

  // ── Init ──
  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initAllCards();
    updateStatus();
    const btn = document.getElementById('export-btn');
    if (btn) btn.addEventListener('click', exportAnswers);
    initLightbox();
  });

})();
