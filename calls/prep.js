(function () {
  const NAMESPACE = document.body.dataset.prepKey || 'unknown';
  const PREFIX = `lohilohi__${NAMESPACE}__`;

  function storageKey(sectionKey, qIdx) {
    return `${PREFIX}${sectionKey}__q${qIdx}`;
  }

  function flashSaved(indicator) {
    indicator.classList.add('visible');
    clearTimeout(indicator._t);
    indicator._t = setTimeout(() => indicator.classList.remove('visible'), 1600);
  }

  // ── Init all questions ──
  function initQuestions() {
    document.querySelectorAll('.question-block').forEach(block => {
      const sectionKey = block.closest('.prep-section').dataset.sectionKey;
      const qIdx = block.dataset.qIdx;
      const key = storageKey(sectionKey, qIdx);
      const saved = localStorage.getItem(key) || '';

      const ta = block.querySelector('.answer-area');
      const ind = block.querySelector('.save-indicator');

      ta.value = saved;
      autoResize(ta);

      ta.addEventListener('input', () => {
        localStorage.setItem(key, ta.value);
        autoResize(ta);
        flashSaved(ind);
      });
    });
  }

  function autoResize(ta) {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }

  // ── Export ──
  function exportAnswers() {
    const title = document.title;
    const out = { exported: new Date().toISOString(), title, answers: {} };

    document.querySelectorAll('.prep-section').forEach(section => {
      const sectionKey = section.dataset.sectionKey;
      const sectionTitle = section.querySelector('.prep-section-title').textContent;
      out.answers[sectionKey] = { title: sectionTitle, questions: [] };

      section.querySelectorAll('.question-block').forEach((block, qIdx) => {
        const key = storageKey(sectionKey, qIdx);
        const questionText = block.querySelector('.question-text').textContent.trim();
        const answer = localStorage.getItem(key) || '';
        out.answers[sectionKey].questions.push({ question: questionText, answer });
      });
    });

    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const filename = `${NAMESPACE}-${new Date().toISOString().split('T')[0]}.json`;
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Init ──
  document.addEventListener('DOMContentLoaded', () => {
    initQuestions();

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportAnswers);

    const printBtn = document.getElementById('print-btn');
    if (printBtn) printBtn.addEventListener('click', () => window.print());
  });
})();
