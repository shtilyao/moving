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

export function renderWeather(state) {
  const w = state.weather;
  document.getElementById('weatherTemp').textContent = w.temp;
  document.getElementById('weatherDesc').textContent = w.desc;
  document.getElementById('weatherHumidity').textContent = w.humidity;
  document.getElementById('weatherWind').textContent = w.wind;
  document.getElementById('weatherFeels').textContent = w.feels;
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
  renderWeather(state);
  renderQuote(state);
  renderChecklist(state, handlers);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
