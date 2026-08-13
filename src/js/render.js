function fmtNumber(n) {
  return new Intl.NumberFormat('uk-UA').format(n);
}

function fmtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function renderRoute(state) {
  document.getElementById('routeFrom').textContent = state.route.from;
  document.getElementById('routeTo').textContent = state.route.to;
  document.getElementById('routeDate').textContent = fmtDate(state.target_date);
}

export function renderStats(state) {
  const { savings, goit, english } = state.stats;

  document.getElementById('savingsCurrent').textContent = fmtNumber(savings.current);
  document.getElementById('savingsTarget').textContent = fmtNumber(savings.target);
  const savingsPct = savings.target > 0
    ? Math.min(100, Math.round((savings.current / savings.target) * 100))
    : 0;
  document.getElementById('savingsBar').style.setProperty('--value', savingsPct + '%');
  document.getElementById('savingsPct').textContent = savingsPct + '%';

  document.getElementById('goitPct').textContent = goit.percent;
  document.getElementById('goitTags').textContent = goit.tags;
  document.getElementById('goitBar').style.setProperty('--value', goit.percent + '%');

  document.getElementById('englishLevel').textContent = english.level;
  document.getElementById('englishTarget').textContent = english.target;
  document.getElementById('englishBar').style.setProperty('--value', english.percent + '%');
}

export function renderWeatherLive(weather) {
  document.getElementById('weatherIcon').textContent = weather.icon;
  document.getElementById('weatherTemp').textContent = weather.temp;
  document.getElementById('weatherDesc').textContent = weather.desc;
  document.getElementById('weatherHumidity').textContent = weather.humidity;
  document.getElementById('weatherWind').textContent = weather.wind;
  document.getElementById('weatherFeels').textContent = weather.feels;

  const updatedEl = document.getElementById('weatherUpdated');
  if (updatedEl) {
    const time = weather.fetchedAt.toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    });
    updatedEl.textContent = `Оновлено о ${time}`;
  }
}

export function renderWeatherError() {
  const updatedEl = document.getElementById('weatherUpdated');
  if (updatedEl) {
    updatedEl.textContent = 'Не вдалося оновити погоду';
  }
}

export function renderQuote(state) {
  document.getElementById('quoteText').textContent = state.quote;
}

export function renderChecklist(state, { unlocked, onToggle, onRemove }) {
  const list = document.getElementById('checklistItems');
  list.innerHTML = '';

  state.checklist.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'checklist__item';
    li.innerHTML = `
      <label>
        <input type="checkbox" ${item.done ? 'checked' : ''} ${unlocked ? '' : 'disabled'}>
        <span class="checklist__box"></span>
        <span class="checklist__text">${escapeHtml(item.text)}</span>
      </label>
      <button type="button" class="checklist__remove" title="Видалити пункт" aria-label="Видалити пункт">×</button>
    `;

    const checkbox = li.querySelector('input');
    checkbox.addEventListener('change', () => onToggle(item.id));

    const removeBtn = li.querySelector('.checklist__remove');
    removeBtn.addEventListener('click', () => onRemove(item.id));

    list.appendChild(li);
  });
}

export function renderAll(state, handlers) {
  renderRoute(state);
  renderStats(state);
  renderQuote(state);
  renderChecklist(state, handlers);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
