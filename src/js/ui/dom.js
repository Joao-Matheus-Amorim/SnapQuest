export const $ = (query, root = document) => root.querySelector(query);
export const $$ = (query, root = document) => Array.from(root.querySelectorAll(query));

export function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
}

export function go(screenId) {
  $$('.screen').forEach(screen => screen.classList.toggle('active', screen.id === screenId));
  $$('.navbtn').forEach(button => button.classList.toggle('active', button.dataset.go === screenId));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
