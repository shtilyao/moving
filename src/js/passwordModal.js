import { tryPassword } from './auth.js';
import { showToast } from './toast.js';

let modalEl = null;
let resolver = null;

function build() {
  const wrap = document.createElement('div');
  wrap.className = 'pw-modal';
  wrap.innerHTML = `
    <div class="pw-modal__backdrop"></div>
    <form class="pw-modal__box" novalidate>
      <h3 class="pw-modal__title">Пароль редагування</h3>
      <p class="pw-modal__hint">Введіть спільний пароль, щоб додавати й змінювати пункти.</p>
      <input class="pw-modal__input" type="password" name="password" placeholder="Пароль" autocomplete="current-password" required>
      <p class="pw-modal__error" hidden></p>
      <div class="pw-modal__actions">
        <button type="button" class="btn btn--ghost" data-action="cancel">Скасувати</button>
        <button type="submit" class="btn btn--primary" data-action="submit">Увійти</button>
      </div>
    </form>
  `;
  document.body.appendChild(wrap);
  return wrap;
}

function close(result) {
  if (modalEl) {
    modalEl.classList.remove('is-open');
    setTimeout(() => {
      modalEl?.remove();
      modalEl = null;
    }, 200);
  }
  if (resolver) {
    resolver(result);
    resolver = null;
  }
}

export function openPasswordModal() {
  if (modalEl) return Promise.resolve(false);

  modalEl = build();
  const form = modalEl.querySelector('form');
  const input = modalEl.querySelector('input');
  const errorEl = modalEl.querySelector('.pw-modal__error');
  const backdrop = modalEl.querySelector('.pw-modal__backdrop');
  const cancelBtn = modalEl.querySelector('[data-action="cancel"]');
  const submitBtn = modalEl.querySelector('[data-action="submit"]');

  requestAnimationFrame(() => {
    modalEl.classList.add('is-open');
    input.focus();
  });

  backdrop.addEventListener('click', () => close(false));
  cancelBtn.addEventListener('click', () => close(false));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pwd = input.value.trim();
    if (!pwd) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Перевірка…';
    errorEl.hidden = true;

    try {
      const ok = await tryPassword(pwd);
      if (ok) {
        showToast('Редагування розблоковано ✓', 'success');
        close(true);
      } else {
        errorEl.textContent = 'Невірний пароль. Спробуйте ще раз.';
        errorEl.hidden = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Увійти';
        input.select();
      }
    } catch (err) {
      errorEl.textContent = err.message || 'Помилка перевірки. Перевірте з’єднання.';
      errorEl.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Увійти';
    }
  });

  return new Promise((resolve) => {
    resolver = resolve;
  });
}
