function isoToDateInput(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

const FORM_BUILDERS = {
  route: (state) => ({
    fields: `
      <div class="edit-form__row">
        <div class="edit-form__field">
          <label class="edit-form__label">Звідки</label>
          <input name="from" value="${escAttr(state.route.from)}" required>
        </div>
        <div class="edit-form__field">
          <label class="edit-form__label">Куди</label>
          <input name="to" value="${escAttr(state.route.to)}" required>
        </div>
      </div>
      <div class="edit-form__field">
        <label class="edit-form__label">Дата вильоту</label>
        <input type="date" name="date" value="${isoToDateInput(state.target_date)}" required>
      </div>
    `,
    apply: (form, draft) => {
      draft.route.from = form.from.value.trim();
      draft.route.to = form.to.value.trim();
      const date = form.date.value;
      if (date) draft.target_date = new Date(date + 'T00:00:00').toISOString();
    },
  }),

  savings: (state) => ({
    fields: `
      <div class="edit-form__row">
        <div class="edit-form__field">
          <label class="edit-form__label">Накопичено, €</label>
          <input type="number" min="0" step="1" name="current" value="${state.stats.savings.current}" required>
        </div>
        <div class="edit-form__field">
          <label class="edit-form__label">Ціль, €</label>
          <input type="number" min="1" step="1" name="target" value="${state.stats.savings.target}" required>
        </div>
      </div>
    `,
    apply: (form, draft) => {
      draft.stats.savings.current = Number(form.current.value) || 0;
      draft.stats.savings.target = Number(form.target.value) || 1;
    },
  }),

  goit: (state) => ({
    fields: `
      <div class="edit-form__row">
        <div class="edit-form__field">
          <label class="edit-form__label">Прогрес, %</label>
          <input type="number" min="0" max="100" name="percent" value="${state.stats.goit.percent}" required>
        </div>
        <div class="edit-form__field">
          <label class="edit-form__label">Технології</label>
          <input name="tags" value="${escAttr(state.stats.goit.tags)}">
        </div>
      </div>
    `,
    apply: (form, draft) => {
      draft.stats.goit.percent = clamp(Number(form.percent.value) || 0, 0, 100);
      draft.stats.goit.tags = form.tags.value.trim();
    },
  }),

  english: (state) => ({
    fields: `
      <div class="edit-form__row">
        <div class="edit-form__field">
          <label class="edit-form__label">Поточний рівень</label>
          <input name="level" value="${escAttr(state.stats.english.level)}" required>
        </div>
        <div class="edit-form__field">
          <label class="edit-form__label">Ціль</label>
          <input name="target" value="${escAttr(state.stats.english.target)}" required>
        </div>
      </div>
      <div class="edit-form__field">
        <label class="edit-form__label">Прогрес до цілі, %</label>
        <input type="number" min="0" max="100" name="percent" value="${state.stats.english.percent}">
      </div>
    `,
    apply: (form, draft) => {
      draft.stats.english.level = form.level.value.trim();
      draft.stats.english.target = form.target.value.trim();
      draft.stats.english.percent = clamp(Number(form.percent.value) || 0, 0, 100);
    },
  }),

  quote: (state) => ({
    fields: `
      <div class="edit-form__field">
        <label class="edit-form__label">Текст цитати</label>
        <textarea name="quote" maxlength="200" required>${escHtml(state.quote)}</textarea>
      </div>
    `,
    apply: (form, draft) => {
      draft.quote = form.quote.value.trim();
    },
  }),
};

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function escAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Відкриває інлайн-форму редагування в елементі #editSlot-{type}.
 * onSave(draftState) — викликається з новим повним об'єктом стану після сабміту.
 * Повертає функцію close() для примусового закриття ззовні.
 */
export function openEditForm(type, state, onSave) {
  const slot = document.getElementById(`editSlot-${type}`);
  const builder = FORM_BUILDERS[type];
  if (!slot || !builder) return () => {};

  const { fields, apply } = builder(state);

  slot.innerHTML = `
    <form class="edit-form__inner">
      ${fields}
      <div class="edit-form__actions">
        <button type="button" class="btn btn--ghost" data-action="cancel">Скасувати</button>
        <button type="submit" class="btn btn--primary" data-action="submit">Зберегти</button>
      </div>
    </form>
  `;
  slot.hidden = false;

  const form = slot.querySelector('form');
  const submitBtn = slot.querySelector('[data-action="submit"]');
  const cancelBtn = slot.querySelector('[data-action="cancel"]');

  function close() {
    slot.hidden = true;
    slot.innerHTML = '';
  }

  cancelBtn.addEventListener('click', close);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Збереження…';

    const draft = structuredClone(state);
    apply(form, draft);

    try {
      await onSave(draft);
      close();
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Зберегти';
      throw err;
    }
  });

  form.querySelector('input, textarea')?.focus();

  return close;
}
