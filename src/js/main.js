document.documentElement.style.setProperty(
  '--hero-bg-url',
  `url(${import.meta.env.BASE_URL}img/hero-sagrada.jpg)`
);

import '../scss/styles.scss';

import { loadInitialState, onStateChange, saveState, subscribeRealtime, getState } from './store.js';
import { isUnlocked, onAuthChange, restoreSession, lock } from './auth.js';
import { openPasswordModal } from './passwordModal.js';
import { renderAll } from './render.js';
import { startCountdown, setCountdownTarget } from './countdown.js';
import { showToast } from './toast.js';
import { openEditForm } from './editForms.js';

const lockToggle = document.getElementById('lockToggle');
const lockLabel = document.getElementById('lockLabel');
const syncStatus = document.getElementById('syncStatus');
const checklistAddForm = document.getElementById('checklistAddForm');
const checklistAddInput = document.getElementById('checklistAddInput');

/* ---------------------------------------------------------------------- */
/* Розблокування редагування                                              */
/* ---------------------------------------------------------------------- */

function updateLockUI() {
  const unlocked = isUnlocked();
  lockToggle.classList.toggle('is-unlocked', unlocked);
  lockLabel.textContent = unlocked ? 'Редагування увімкнено' : 'Увійти';
  const state = getState();
  if (state) {
    checklistHandlers.unlocked = unlocked;
    renderAll(state, checklistHandlers);
  }
}

async function ensureUnlocked() {
  if (isUnlocked()) return true;
  return openPasswordModal();
}

lockToggle.addEventListener('click', async () => {
  if (isUnlocked()) {
    lock();
    showToast('Редагування заблоковано');
    updateLockUI();
    return;
  }
  const ok = await ensureUnlocked();
  if (ok) updateLockUI();
});

onAuthChange(updateLockUI);

/* ---------------------------------------------------------------------- */
/* Збереження стану з обробкою помилок пароля                             */
/* ---------------------------------------------------------------------- */

async function saveWithGuard(nextState) {
  const unlocked = await ensureUnlocked();
  if (!unlocked) {
    throw new Error('CANCELLED');
  }

  try {
    await saveState(nextState);
    showToast('Збережено ✓', 'success');
  } catch (err) {
    if (err.message === 'INVALID_PASSWORD') {
      lock();
      showToast('Пароль більше не діє. Увійдіть ще раз.', 'error');
      const ok = await ensureUnlocked();
      if (ok) {
        await saveState(nextState);
        showToast('Збережено ✓', 'success');
        return;
      }
    }
    showToast(err.message || 'Не вдалося зберегти', 'error');
    throw err;
  }
}

/* ---------------------------------------------------------------------- */
/* Чек-лист: тумблер / видалення / додавання                              */
/* ---------------------------------------------------------------------- */

const checklistHandlers = {
  unlocked: false,
  onToggle: async (id) => {
    const state = getState();
    const draft = structuredClone(state);
    const item = draft.checklist.find((i) => i.id === id);
    if (!item) return;
    item.done = !item.done;
    try {
      await saveWithGuard(draft);
    } catch {
      /* toast вже показано */
    }
  },
  onRemove: async (id) => {
    const state = getState();
    const draft = structuredClone(state);
    draft.checklist = draft.checklist.filter((i) => i.id !== id);
    try {
      await saveWithGuard(draft);
    } catch {
      /* toast вже показано */
    }
  },
};

checklistAddForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = checklistAddInput.value.trim();
  if (!text) return;

  const unlocked = await ensureUnlocked();
  if (!unlocked) return;

  const state = getState();
  const draft = structuredClone(state);
  draft.checklist.push({ id: crypto.randomUUID(), text, done: false });

  try {
    await saveWithGuard(draft);
    checklistAddInput.value = '';
  } catch {
    /* toast вже показано */
  }
});

/* ---------------------------------------------------------------------- */
/* Олівці редагування карток                                              */
/* ---------------------------------------------------------------------- */

document.querySelectorAll('.edit-pencil').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const type = btn.dataset.edit;
    const unlocked = await ensureUnlocked();
    if (!unlocked) return;

    const state = getState();
    openEditForm(type, state, async (draft) => {
      await saveWithGuard(draft);
    });
  });
});

/* ---------------------------------------------------------------------- */
/* Рендер стану + realtime + відлік                                       */
/* ---------------------------------------------------------------------- */

onStateChange((state) => {
  checklistHandlers.unlocked = isUnlocked();
  renderAll(state, checklistHandlers);
  setCountdownTarget(state.target_date);
});

async function bootstrap() {
  await restoreSession();

  try {
    syncStatus.textContent = 'завантаження…';
    const state = await loadInitialState();
    startCountdown(state.target_date);
    subscribeRealtime();
    syncStatus.textContent = 'синхронізовано в реальному часі';
    syncStatus.classList.add('is-live');
  } catch (err) {
    syncStatus.textContent = 'офлайн: перевірте підключення до Supabase';
    syncStatus.classList.add('is-error');
    showToast(err.message, 'error');
  }

  updateLockUI();
}

bootstrap();

/* ---------------------------------------------------------------------- */
/* Мобільне меню + перемикач теми (як і раніше)                           */
/* ---------------------------------------------------------------------- */

const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  mainNav.querySelectorAll('.main-nav__link').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('theme-light');
  });
}

const sections = document.querySelectorAll('main > section[id]');
const navLinks = document.querySelectorAll('.main-nav__link');

if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
          });
        }
      });
    },
    { rootMargin: '-40% 0px -50% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
}
