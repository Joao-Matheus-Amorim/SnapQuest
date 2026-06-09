const AUTH_SELECTOR = '#authEmail, #authPassword, #signUpBtn, #signInBtn';
const CONNECTED_TEXT = 'Conectado:';

function injectStyles() {
  if (document.getElementById('cloudAccountUiStyles')) return;

  const style = document.createElement('style');
  style.id = 'cloudAccountUiStyles';
  style.textContent = `
    .bottom-nav { grid-template-columns: repeat(5, 1fr); }
    .cloud-panel.cloud-connected { border-color: rgba(121,242,192,.5); background: rgba(121,242,192,.08); }
    .cloud-panel.cloud-connected #authEmail,
    .cloud-panel.cloud-connected #authPassword,
    .cloud-panel.cloud-connected #signUpBtn,
    .cloud-panel.cloud-connected #signInBtn { display: none !important; }
  `;
  document.head.appendChild(style);
}

function ensureAccountScreen() {
  const existing = document.getElementById('account');
  const cloudPanel = document.querySelector('.cloud-panel');
  const home = document.getElementById('home');
  if (!cloudPanel || !home) return existing;

  const account = existing || document.createElement('section');
  account.id = 'account';
  account.className = 'screen';

  if (!existing) {
    account.innerHTML = `
      <div class="hero">
        <h2>Conta e nuvem.</h2>
        <p>Entre para salvar lutadores e cartas na nuvem e continuar de onde parou.</p>
      </div>
    `;
    home.after(account);
  }

  account.appendChild(cloudPanel);
  return account;
}

function ensureAccountNavButton() {
  const nav = document.getElementById('bottomNav');
  if (!nav || nav.querySelector('[data-go="account"]')) return;

  const button = document.createElement('button');
  button.className = 'navbtn';
  button.dataset.go = 'account';
  button.type = 'button';
  button.innerHTML = '<b>☁️</b>Conta';
  button.addEventListener('click', () => {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.toggle('active', screen.id === 'account'));
    document.querySelectorAll('.navbtn').forEach(item => item.classList.toggle('active', item === button));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  nav.querySelector('[data-go="home"]')?.after(button);
}

function setAuthVisible(visible) {
  document.querySelectorAll(AUTH_SELECTOR).forEach(element => {
    element.hidden = !visible;
  });
}

function updateCloudAccountUi() {
  const status = document.getElementById('cloudStatus');
  if (!status) return;

  const isConnected = status.textContent.trim().startsWith(CONNECTED_TEXT);
  setAuthVisible(!isConnected);

  const panel = status.closest('.cloud-panel');
  if (panel) panel.classList.toggle('cloud-connected', isConnected);
}

function initCloudAccountUi() {
  injectStyles();
  ensureAccountScreen();
  ensureAccountNavButton();
  updateCloudAccountUi();

  const status = document.getElementById('cloudStatus');
  if (!status) return;

  const observer = new MutationObserver(updateCloudAccountUi);
  observer.observe(status, { childList: true, characterData: true, subtree: true });

  document.getElementById('signOutBtn')?.addEventListener('click', () => {
    setAuthVisible(true);
    status.closest('.cloud-panel')?.classList.remove('cloud-connected');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCloudAccountUi, { once: true });
} else {
  initCloudAccountUi();
}
