let container = null;

function ensureContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-stack';
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, type = 'info') {
  const root = ensureContainer();
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = message;
  root.appendChild(el);

  requestAnimationFrame(() => el.classList.add('is-visible'));

  setTimeout(() => {
    el.classList.remove('is-visible');
    setTimeout(() => el.remove(), 300);
  }, 3200);
}
