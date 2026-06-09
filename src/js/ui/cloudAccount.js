import { getUser } from '../services/supabaseClient.js';

const LOGIN_SELECTORS = [
  '#authEmail',
  '#authPassword',
  '#signUpBtn',
  '#signInBtn',
];

function setElementsHidden(selectors, hidden) {
  selectors.forEach(selector => {
    const element = document.querySelector(selector);
    if (element) element.hidden = hidden;
  });
}

function setCloudStatus(message) {
  const status = document.querySelector('#cloudStatus');
  if (status) status.textContent = message;
}

export async function refreshCloudAccountUi() {
  const user = await getUser();
  const connected = Boolean(user);

  setElementsHidden(LOGIN_SELECTORS, connected);

  const syncButton = document.querySelector('#syncBtn');
  const signOutButton = document.querySelector('#signOutBtn');

  if (syncButton) syncButton.hidden = false;
  if (signOutButton) signOutButton.hidden = !connected;

  setCloudStatus(
    connected
      ? `Conta conectada: ${user.email}`
      : 'Entre para salvar e sincronizar seu inventário.'
  );

  return user;
}
