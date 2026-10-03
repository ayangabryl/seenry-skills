/* Local Menu fixture. No storage, network requests or application actions belong in the motion kit. */
(function (root, factory) {
 const api = factory();
 if (typeof module === 'object' && module.exports) module.exports = api;
 else root.SeenryMenuDemo = api;
})(typeof window === 'object' ? window : globalThis, function () {
 'use strict';
 const COPY_LIMIT = 2, NAME_LIMIT = 60;
 const seed = [
  {id: 'roadmap', name: 'Q3 roadmap', kind: 'doc', note: 'Sample document'},
  {id: 'hiring', name: 'Hiring plan', kind: 'table', note: 'Sample spreadsheet'}
 ];
 const initialState = () => ({files: seed.map(file => ({...file})), deleted: [], copies: 0, message: ''});
 function nameError(value) {
  if (!value.trim()) return 'Enter a file name.';
  if (/[\u0000-\u001f\u007f]/u.test(value)) return 'Use a single line without control characters.';
  if ([...value.trim()].length > NAME_LIMIT) return `Use ${NAME_LIMIT} characters or fewer.`;
  return '';
 }
 function duplicateName(files, source) {
  // A readable suffix still fits the same name limit, including emoji and CJK.
  for (let n = 1; ; n++) {
   const suffix = n === 1 ? ' copy' : ` copy ${n}`;
   const name = [...source].slice(0, NAME_LIMIT - suffix.length).join('') + suffix;
   if (!files.some(file => file.name === name)) return name;
  }
 }
 function update(state, action) {
  if (action.type === 'reset') return {...initialState(), message: 'Preview reset. Two original sample files restored.'};
  if (action.type === 'undo') {
   const last = state.deleted.at(-1);
   if (!last) return state;
   const files = state.files.slice(); files.splice(Math.min(last.index, files.length), 0, last.file);
   return {...state, files, deleted: state.deleted.slice(0, -1), message: `Restored “${last.file.name}”.`};
  }
  const index = state.files.findIndex(file => file.id === action.id), file = state.files[index];
  if (!file) return state; // A stale activation cannot mutate a different row.
  if (action.type === 'rename') {
   if (nameError(action.name)) return state;
   const name = action.name.trim();
   return {...state, files: state.files.map(row => row.id === file.id ? {...row, name} : row), message: name === file.name ? 'File name unchanged.' : `Renamed “${file.name}” to “${name}”.`};
  }
  if (action.type === 'duplicate') {
   if (state.copies >= COPY_LIMIT) return {...state, message: 'Two copies created in this preview. Reset to duplicate again.'};
   const copy = {...file, id: `copy-${state.copies + 1}`, name: duplicateName(state.files, file.name), note: 'Local sample copy'};
   const files = state.files.slice(); files.splice(index + 1, 0, copy);
   return {...state, files, copies: state.copies + 1, message: `Created “${copy.name}”.${state.copies + 1 === COPY_LIMIT ? ' Copy limit reached; Reset to duplicate again.' : ''}`};
  }
  if (action.type === 'delete') return {...state, files: state.files.filter(row => row.id !== file.id), deleted: [...state.deleted, {file, index}], message: `Deleted “${file.name}” from this preview. Undo is available.`};
  return state;
 }

 function mount(stage, S) {
  const doc = stage.ownerDocument, find = selector => stage.querySelector(selector);
  const list = find('[data-menu-files]'), menu = find('#menu-1'), editor = find('[data-menu-editor]');
  const input = find('[data-menu-name]'), form = find('[data-menu-form]'), error = find('[data-menu-error]');
  const reset = find('[data-menu-reset]'), undo = find('[data-menu-undo]');
  const rows = new Map([...list.children].map(row => [row.dataset.menuFile, row]));
  const template = list.firstElementChild.cloneNode(true);
  let state = initialState(), selectedId = state.files[0].id, editingId = null;
  const acceptedClicks = new WeakSet();
  const triggerFor = id => state.files.some(file => file.id === id) ? rows.get(id)?.querySelector('[data-menu-trigger]') : null;
  const focusRow = id => (triggerFor(id) || triggerFor(state.files[0]?.id) || reset).focus({preventScroll: true});
  const closeMenu = () => S.close(menu, {instant: true, silent: true});
  const clearError = () => { error.textContent = ''; error.hidden = true; input.removeAttribute('aria-invalid'); };
  function render() {
   const currentIds = new Set(state.files.map(file => file.id));
   for (const [id, row] of rows) if (!currentIds.has(id)) row.remove();
   state.files.forEach((file, index) => {
    let row = rows.get(file.id);
    if (!row) { row = template.cloneNode(true); rows.set(file.id, row); }
    row.dataset.menuFile = file.id;
    row.querySelector('[data-menu-file-name]').textContent = file.name;
    row.querySelector('[data-menu-file-note]').textContent = file.note;
    row.querySelector('.file-icon use').setAttribute('href', `#i-${file.kind}`);
    const trigger = row.querySelector('[data-menu-trigger]');
    trigger.id = file.id === 'roadmap' ? 'menu-trigger' : `menu-trigger-${file.id}`;
    trigger.setAttribute('aria-label', `More actions for ${file.name}`);
    // Keep surviving controls mounted; reinsert only when the accepted order changed.
    if (list.children[index] !== row) list.insertBefore(row, list.children[index] || null);
   });
   find('[data-menu-count]').textContent = `${state.files.length} ${state.files.length === 1 ? 'file' : 'files'}`;
   find('[data-menu-empty]').hidden = state.files.length !== 0;
   find('[data-menu-status]').textContent = state.message;
   find('[data-menu-budget]').textContent = `Copies: ${state.copies} of ${COPY_LIMIT}. Reset to start again.`;
   const duplicate = menu.querySelector('[data-menu-action="duplicate"]');
   duplicate.disabled = state.copies >= COPY_LIMIT;
   find('[data-menu-limit]').hidden = !duplicate.disabled;
   const last = state.deleted.at(-1);
   find('[data-menu-recovery]').hidden = !last;
   find('[data-menu-deleted]').textContent = last ? `${state.deleted.length} deleted. Restore “${last.file.name}”.` : '';
   undo.setAttribute('aria-label', last ? `Undo delete of ${last.file.name}` : 'Undo last delete');
   const selected = state.files.find(file => file.id === selectedId);
   if (selected) menu.setAttribute('aria-label', `${selected.name} actions`);
  }
  function finishEdit(restoreFocus = true) {
   const id = editingId; editingId = null;
   input.value = ''; clearError();
   if (editor.open) editor.close();
   if (restoreFocus) focusRow(id);
  }
  function beginEdit(id) {
   const file = state.files.find(row => row.id === id);
   if (!file || editor.open) return;
   editingId = id; clearError(); input.value = file.name;
   editor.showModal(); input.focus({preventScroll: true}); input.select();
  }
  function activate(trigger, keyboard) {
   const id = trigger.closest('[data-menu-file]').dataset.menuFile;
   if (!state.files.some(file => file.id === id)) return;
   if (selectedId !== id) closeMenu();
   selectedId = id; render(); S.toggle(menu, trigger, keyboard === undefined ? undefined : {keyboard});
  }
  // Capture acceptance before the generic menu click handler starts closing.
  // A repeated/stale click on a retired item cannot create another local action.
  menu.addEventListener('click', event => {
   if (menu.dataset.stOpen === 'true' && !menu.inert) acceptedClicks.add(event);
  }, true);
  // This listener runs after the runtime's menu-item listener on the menu itself.
  // Its explicit instant close retires any already-started exit before a new task.
  stage.addEventListener('click', event => {
   const trigger = event.target.closest('[data-menu-trigger]');
   if (trigger && stage.contains(trigger)) {
    event.preventDefault(); event.stopPropagation(); activate(trigger, event.isTrusted ? event.detail === 0 : undefined); return;
   }
   const item = event.target.closest('[data-menu-action]');
   if (!item || !menu.contains(item) || item.disabled || !acceptedClicks.has(event)) return;
   const id = selectedId, type = item.dataset.menuAction;
   if (!state.files.some(file => file.id === id)) return;
   closeMenu();
   if (type === 'rename') { beginEdit(id); return; }
   const index = state.files.findIndex(file => file.id === id);
   state = update(state, {type, id}); render();
   focusRow(type === 'delete' ? state.files[Math.min(index, state.files.length - 1)]?.id : id);
  });
  stage.addEventListener('keydown', event => {
   const trigger = event.target.closest('[data-menu-trigger]');
   if (!trigger || !['ArrowDown', 'ArrowUp'].includes(event.key)) return;
   event.preventDefault(); event.stopPropagation();
   const id = trigger.closest('[data-menu-file]').dataset.menuFile;
   if (selectedId !== id) closeMenu();
   selectedId = id; render(); S.open(menu, trigger, {keyboard: true});
   const items = [...menu.querySelectorAll('[role="menuitem"]')].filter(item => !item.disabled);
   (event.key === 'ArrowUp' ? items.at(-1) : items[0])?.focus({preventScroll: true});
  });
  form.addEventListener('submit', event => {
   event.preventDefault();
   if (editingId === null || !editor.open) return;
   const message = nameError(input.value);
   if (message) { error.textContent = message; error.hidden = false; input.setAttribute('aria-invalid', 'true'); input.focus({preventScroll: true}); return; }
   state = update(state, {type: 'rename', id: editingId, name: input.value}); render(); finishEdit();
  });
  input.addEventListener('input', clearError);
  find('[data-menu-cancel]').addEventListener('click', () => finishEdit());
  editor.addEventListener('cancel', event => { event.preventDefault(); finishEdit(); });
  // A nested native Rename owns Escape; the gallery detail must remain open.
  editor.addEventListener('keydown', event => { if (event.key === 'Escape') event.stopPropagation(); });
  editor.addEventListener('close', () => {
   // Native close is queued. An old close event must not cancel a later rename.
   if (editor.open || editingId === null) return;
   finishEdit();
  });
  undo.addEventListener('click', () => {
   const id = state.deleted.at(-1)?.file.id;
   if (!id) return;
   closeMenu(); state = update(state, {type: 'undo'}); render(); focusRow(id);
  });
  reset.addEventListener('click', () => {
   closeMenu(); finishEdit(false); state = update(state, {type: 'reset'}); selectedId = state.files[0].id; render(); reset.focus({preventScroll: true});
  });
  render();
  return {
   replay() { const trigger = triggerFor(state.files[0]?.id); if (trigger) activate(trigger); else { state = {...state, message: 'No sample files remain. Undo a deletion or Reset the preview.'}; render(); reset.focus({preventScroll: true}); } },
   suspend() { closeMenu(); finishEdit(false); },
   // Read-only snapshot for focused fixture checks and gallery inspection.
   getState: () => JSON.parse(JSON.stringify(state))
  };
 }
 return {COPY_LIMIT, NAME_LIMIT, initialState, nameError, update, mount};
});
