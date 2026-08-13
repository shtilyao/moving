import { supabase } from './supabase.js';
import { getPassword } from './auth.js';

let state = null;
const listeners = new Set();

export function getState() {
  return state;
}

export function onStateChange(fn) {
  listeners.add(fn);
  if (state) fn(state);
  return () => listeners.delete(fn);
}

function setState(next) {
  state = next;
  listeners.forEach((fn) => fn(state));
}

export async function loadInitialState() {
  const { data, error } = await supabase
    .from('site_data')
    .select('data')
    .eq('id', 1)
    .single();

  if (error) {
    throw new Error('Не вдалося завантажити дані з Supabase: ' + error.message);
  }

  setState(data.data);
  return data.data;
}

export function subscribeRealtime() {
  const channel = supabase
    .channel('site_data_changes')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'site_data', filter: 'id=eq.1' },
      (payload) => {
        if (payload.new && payload.new.data) {
          setState(payload.new.data);
        }
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/**
 * Записує новий стан у Supabase. Кидає помилку, якщо пароль невірний
 * або пароль ще не введений.
 */
export async function saveState(nextState) {
  const pwd = getPassword();

  if (!pwd) {
    throw new Error('NO_PASSWORD');
  }

  const { data, error } = await supabase.rpc('update_site_data', {
    pwd,
    new_data: nextState,
  });

  if (error) {
    if (error.message && error.message.includes('invalid password')) {
      throw new Error('INVALID_PASSWORD');
    }
    throw new Error('Не вдалося зберегти зміни: ' + error.message);
  }

  // Оптимістично оновлюємо локально одразу — realtime підхопить те саме трохи пізніше.
  setState(data);
  return data;
}
