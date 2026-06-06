(function () {
  const AUTH_KEY = 'lohilohi_contract_auth';
  // Replace this hash with the output of the browser console snippet
  const CORRECT_HASH = '1568690823383c442880facc51eee52d86ac34524de740cab96dd3334642c18d';

  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  function buildOverlay() {
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
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #auth-overlay {
        position: fixed;
        inset: 0;
        background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 1.5rem;
      }
      .auth-card {
        background: #fff;
        border-radius: 16px;
        padding: 2.5rem 2rem;
        max-width: 360px;
        width: 100%;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      }
      .auth-lock { font-size: 2.5rem; margin-bottom: 0.75rem; }
      .auth-title {
        font-family: 'Inter', sans-serif;
        font-size: 1.25rem;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 0.4rem;
      }
      .auth-subtitle {
        font-family: 'Inter', sans-serif;
        font-size: 0.875rem;
        color: #64748b;
        margin-bottom: 1.5rem;
        line-height: 1.5;
      }
      .auth-input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 10px;
        font-family: 'Inter', sans-serif;
        font-size: 1rem;
        text-align: center;
        letter-spacing: 0.15em;
        color: #1e293b;
        outline: none;
        margin-bottom: 0.875rem;
        transition: border-color 0.15s ease;
      }
      .auth-input:focus { border-color: #8b5cf6; }
      .auth-btn {
        width: 100%;
        padding: 0.75rem;
        background: linear-gradient(135deg, #7c3aed, #ec4899);
        color: white;
        border: none;
        border-radius: 10px;
        font-family: 'Inter', sans-serif;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.15s ease;
      }
      .auth-btn:hover { opacity: 0.9; }
      .auth-error {
        margin-top: 0.75rem;
        font-family: 'Inter', sans-serif;
        font-size: 0.8rem;
        color: #dc2626;
        min-height: 1.2em;
      }
      @keyframes shake {
        0%,100% { transform: translateX(0); }
        20%,60% { transform: translateX(-6px); }
        40%,80% { transform: translateX(6px); }
      }
      .auth-shake { animation: shake 0.35s ease; }
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);

    const input = overlay.querySelector('.auth-input');
    const btn = overlay.querySelector('.auth-btn');
    const error = overlay.querySelector('.auth-error');

    async function attempt() {
      const hash = await sha256(input.value.trim());
      if (hash === CORRECT_HASH) {
        localStorage.setItem(AUTH_KEY, CORRECT_HASH);
        overlay.style.transition = 'opacity 0.3s ease';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
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

  // Already authenticated this session
  if (localStorage.getItem(AUTH_KEY) === CORRECT_HASH && CORRECT_HASH !== 'PLACEHOLDER') return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildOverlay);
  } else {
    buildOverlay();
  }
})();
