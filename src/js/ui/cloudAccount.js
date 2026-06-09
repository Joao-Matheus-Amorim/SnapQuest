const AUTH_SELECTOR = '#authEmail, #authPassword, #signUpBtn, #signInBtn';
const CONNECTED_TEXT = 'Conectado:';

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
