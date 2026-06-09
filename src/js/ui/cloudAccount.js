const AUTH_SELECTOR = '#authEmail, #authPassword, #signUpBtn, #signInBtn';
const CONNECTED_TEXT = 'Conectado:';
const DISCONNECTED_TEXT = 'Nuvem desconectada.';

function injectCloudAccountStyles() {
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

function setAuthVisible(visible) {
  document.querySelectorAll(AUTH_SELECTOR).forEach(element => {
    element.hidden = !visible;
  });
}

function updateCloudAccountUi() {
  const status = document.getElementById('cloudStatus');
  if (!status) return;

  const panel = status.closest('.cloud-panel');
  const text = status.textContent.trim();
  const wasConnected = panel?.classList.contains('cloud-connected');
  const isConnected = text.startsWith(CONNECTED_TEXT) || (wasConnected && text !== DISCONNECTED_TEXT);

  setAuthVisible(!isConnected);
  if (panel) panel.classList.toggle('cloud-connected', isConnected);
}

function initCloudAccountUi() {
  injectCloudAccountStyles();

  const status = document.getElementById('cloudStatus');
  if (!status) return;

  updateCloudAccountUi();

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
