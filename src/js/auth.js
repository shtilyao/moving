import { supabase } from './supabase.js';

const STORAGE_KEY = 'bcn_site_password';

let cachedPassword = localStorage.getItem(STORAGE_KEY) || null;
let unlocked = false;

const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(unlocked));
}

export function onAuthChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isUnlocked() {
  return unlocked;
}

export function getPassword() {
  return cachedPassword;
}

export async function tryPassword(pwd) {
  const { data, error } = await supabase.rpc('verify_site_password', { pwd });

  if (error) {
    throw new Error('Не вдалося перевірити пароль. Перевірте підключення до Supabase.');
  }

  if (data === true) {
    cachedPassword = pwd;
    unlocked = true;
    localStorage.setItem(STORAGE_KEY, pwd);
    notify();
    return true;
  }

  return false;
}

export function lock() {
  cachedPassword = null;
  unlocked = false;
  localStorage.removeItem(STORAGE_KEY);
  notify();
}

// При старті, якщо в localStorage є пароль — тихо перевіряємо його валідність.
export async function restoreSession() {
  if (!cachedPassword) return;

  try {
    const ok = await tryPassword(cachedPassword);
    if (!ok) {
      lock();
    }
  } catch {
    // Немає з'єднання — залишаємо як є, спробуємо пізніше при реальному запиті.
    unlocked = true;
    notify();
  }
}
