(function () {
  const PAGE_KEY = document.body.dataset.section || 'home';

  function storageKey(cardIdx, type, itemIdx) {
    const base = `lohilohi__${PAGE_KEY}__card${cardIdx}__${type}`;
    return itemIdx !== undefined ? `${base}__${itemIdx}` : base;
  }

  function flashSaved(card) {
    const ind = card.querySelector('.save-indicator');
    if (!ind) return;
    ind.classList.add('visible');
    clearTimeout(ind._t);
    ind._t = setTimeout(() => ind.classList.remove('visible'), 1600);
  }

  function buildNotesWidget(card, cardIdx) {
    const notesKey = storageKey(cardIdx, 'notes');
    const saved = localStorage.getItem(notesKey) || '';

    const wrapper = document.createElement('div');
    wrapper.className = 'notes-wrapper';

    // ── View mode ──
    const display = document.createElement('div');
    display.className = 'notes-display';

    const displayText = document.createElement('p');
    displayText.className = 'notes-display-text';

    const editBtn = document.createElement('button');
    editBtn.className = 'notes-edit-btn';
    editBtn.type = 'button';
    editBtn.textContent = '✏️ Edit';

    display.append(displayText, editBtn);

    // ── Edit mode ──
    const editWrap = document.createElement('div');
    editWrap.className = 'notes-edit-wrap';

    const label = document.createElement('label');
    label.className = 'notes-label';
    label.textContent = 'Notes & Answers';

    const ta = document.createElement('textarea');
    ta.className = 'notes-area';
    ta.placeholder = 'Write your answers, decisions, or notes here…';
    ta.value = saved;

    const saveInd = document.createElement('span');
    saveInd.className = 'save-indicator';
    saveInd.textContent = 'Saved ✓';

    editWrap.append(label, ta, saveInd);
    wrapper.append(display, editWrap);
    card.appendChild(wrapper);

    // ── State helpers ──
    function autoResize() {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    }

    function toViewMode() {
      if (!ta.value.trim()) return; // nothing to show — stay editable
      displayText.textContent = ta.value;
      display.style.display = 'block';
      editWrap.style.display = 'none';
    }

    function toEditMode() {
      display.style.display = 'none';
      editWrap.style.display = 'block';
      requestAnimationFrame(() => {
        autoResize();
        ta.focus();
        ta.selectionStart = ta.selectionEnd = ta.value.length;
      });
    }

    // ── Events ──
    ta.addEventListener('input', () => {
      localStorage.setItem(notesKey, ta.value);
      autoResize();
      flashSaved(card);
    });

    ta.addEventListener('blur', toViewMode);

    editBtn.addEventListener('click', toEditMode);
    display.addEventListener('click', (e) => {
      if (e.target !== editBtn) toEditMode();
    });

    // ── Init ──
    if (saved.trim()) {
      toViewMode();
    } else {
      display.style.display = 'none';
      editWrap.style.display = 'block';
    }
  }

  function initCard(card, cardIdx) {
    // Checkboxes on list items
    card.querySelectorAll('ul li').forEach((li, itemIdx) => {
      const key = storageKey(cardIdx, 'check', itemIdx);
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'item-check';
      cb.checked = localStorage.getItem(key) === '1';
      cb.title = 'Mark as done';
      cb.addEventListener('change', () => {
        localStorage.setItem(key, cb.checked ? '1' : '0');
        flashSaved(card);
      });
      li.classList.add('has-checkbox');
      li.prepend(cb);
    });

    // Notes widget
    buildNotesWidget(card, cardIdx);
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.content-card').forEach(initCard);
  });
})();
