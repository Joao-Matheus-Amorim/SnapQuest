import { refreshCloudAccountUi } from './cloudAccount.js';

function scheduleRefresh() {
  setTimeout(() => {
    refreshCloudAccountUi().catch(() => {});
  }, 350);
}

function bootCloudAccountUi() {
  refreshCloudAccountUi().catch(() => {});

  [
    '#signUpBtn',
    '#signInBtn',
    '#syncBtn',
    '#signOutBtn',
  ].forEach(selector => {
    document.querySelector(selector)?.addEventListener('click', scheduleRefresh);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootCloudAccountUi, { once: true });
} else {
  bootCloudAccountUi();
}
