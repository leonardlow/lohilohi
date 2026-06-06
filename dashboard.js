(function () {
  const PREFIX = 'lohilohi__';

  const SECTIONS = [
    { key: 'roadmap',             cards: 4 },
    { key: 'business-foundation', cards: 4 },
    { key: 'contract',            cards: 4 },
    { key: 'finances',            cards: 4 },
    { key: 'accounting',          cards: 4 },
    { key: 'brand-deals',         cards: 4 },
    { key: 'merch',               cards: 4 },
    { key: 'content-strategy',    cards: 4 },
    { key: 'calls',               cards: 2 },
  ];

  // ── Completion logic ──
  function getSectionStatus(sectionKey, cardCount) {
    const sectionPrefix = `${PREFIX}${sectionKey}__`;
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith(sectionPrefix));

    if (allKeys.length === 0) return 'empty';

    const hasAnyData = allKeys.some(k => {
      const v = localStorage.getItem(k);
      return v === '1' || (v && v.trim().length > 0);
    });

    if (!hasAnyData) return 'empty';

    // Green = all note fields filled in
    let filledNotes = 0;
    for (let i = 0; i < cardCount; i++) {
      const v = localStorage.getItem(`${sectionPrefix}card${i}__notes`);
      if (v && v.trim().length > 0) filledNotes++;
    }

    return filledNotes >= cardCount ? 'complete' : 'progress';
  }

  function updateCards() {
    SECTIONS.forEach(({ key, cards }) => {
      const card = document.querySelector(`.section-card[href*="${key}"]`);
      if (!card) return;

      const status = getSectionStatus(key, cards);
      card.classList.remove('card-complete', 'card-progress');

      const badge = card.querySelector('.card-status');

      if (status === 'complete') {
        card.classList.add('card-complete');
        if (badge) { badge.className = 'card-status status-active'; badge.textContent = 'Complete ✓'; }
      } else if (status === 'progress') {
        card.classList.add('card-progress');
        if (badge) { badge.className = 'card-status status-pending'; badge.textContent = 'In progress'; }
      }
    });

    // Show/hide export button hint
    const anyData = SECTIONS.some(({ key, cards }) => getSectionStatus(key, cards) !== 'empty');
    const hint = document.getElementById('export-hint');
    if (hint) hint.style.display = anyData ? 'block' : 'none';
  }

  // ── Export ──
  function exportAnswers() {
    const out = {
      exported: new Date().toISOString(),
      title: 'Alohi Business HQ — Survey Answers',
      sections: {}
    };

    SECTIONS.forEach(({ key, cards }) => {
      const sectionPrefix = `${PREFIX}${key}__`;
      const sectionData = {};

      for (let i = 0; i < cards; i++) {
        const notes = localStorage.getItem(`${sectionPrefix}card${i}__notes`) || '';
        const checkKeys = Object.keys(localStorage)
          .filter(k => k.startsWith(`${sectionPrefix}card${i}__check__`))
          .sort();
        const checks = checkKeys.map(k => localStorage.getItem(k) === '1');

        sectionData[`card_${i}`] = { notes, checks };
      }

      out.sections[key] = sectionData;
    });

    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alohi-survey-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateCards();

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportAnswers);

    // Re-check status when returning from a section page
    window.addEventListener('focus', updateCards);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') updateCards();
    });
  });
})();
