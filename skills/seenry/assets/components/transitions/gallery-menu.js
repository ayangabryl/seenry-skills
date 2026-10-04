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
   return {...state, files, deleted: state.deleted.slice(0, -1), message: 'Restored file.'};
  }
  const index = state.files.findIndex(file => file.id === action.id), file = state.files[index];
  if (!file) return state; // A stale activation cannot mutate a different row.
  if (action.type === 'rename') {
   if (nameError(action.name)) return state;
   const name = action.name.trim();
   return {...state, files: state.files.map(row => row.id === file.id ? {...row, name} : row), message: name === file.name ? 'File name unchanged.' : 'Renamed file.'};
  }
  if (action.type === 'duplicate') {
   if (state.copies >= COPY_LIMIT) return {...state, message: 'Copy limit reached.'};
   const copy = {...file, id: `copy-${state.copies + 1}`, name: duplicateName(state.files, file.name), note: 'Local sample copy'};
   const files = state.files.slice(); files.splice(index + 1, 0, copy);
   return {...state, files, copies: state.copies + 1, message: `Created a copy.${state.copies + 1 === COPY_LIMIT ? ' Copy limit reached.' : ''}`};
  }
  if (action.type === 'delete') return {...state, files: state.files.filter(row => row.id !== file.id), deleted: [...state.deleted, {file, index}], message: 'Deleted file.'};
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
  const focusRow = id => focusAndReveal(triggerFor(id) || triggerFor(state.files[0]?.id) || reset);
  function focusAndReveal(target) {
   target.focus({preventScroll: true});
   // Keep visible rows still. An accepted result must reveal its keyboard focus
   // immediately, but a synchronous host focus redirect owns the next view.
   const ownsFocus = () => target.isConnected && doc.activeElement === target;
   if (!ownsFocus()) return;
   const validBox = box => box && [box.left, box.top, box.right, box.bottom].every(Number.isFinite) && box.right > box.left && box.bottom > box.top;
   try {
   // An empty/nonfinite target has no usable painted box to reveal.
   if (!validBox(target.getBoundingClientRect())) return;
   const view = doc.defaultView, modal = target.closest(':modal');
   if (!view || !modal && typeof view.scrollBy !== 'function') return;
   const viewport = view.visualViewport;
   const visible = {left: viewport?.offsetLeft || 0, top: viewport?.offsetTop || 0};
   visible.right = visible.left + (viewport?.width || doc.documentElement.clientWidth);
   visible.bottom = visible.top + (viewport?.height || view.innerHeight);
   if (!validBox(visible)) return;
   const reveal = (scroller, box, x = true, y = true) => {
    if (!ownsFocus()) return;
    const rect = target.getBoundingClientRect(), gap = 4; // Include the focus ring.
    if (!validBox(rect) || !validBox(box)) return;
    const offset = (start, end, low, high) => start < low + gap ? start - low - gap : end > high - gap ? end - high + gap : 0;
    const left = x ? offset(rect.left, rect.right, box.left, box.right) : 0;
    const top = y ? offset(rect.top, rect.bottom, box.top, box.bottom) : 0;
    if (left || top) scroller.scrollBy({left, top, behavior: 'instant'});
   };
   // Preflight the entire applicable chain before scrolling any inner clip.
   // Unsupported geometry/APIs stay focus-only; an unverified native fallback
   // could scroll behind a modal or mix layout and transformed viewport spaces.
   const clips = [];
   for (let node = target.parentElement; node; node = node.parentElement) {
    const style = view.getComputedStyle(node);
    if (style.transform && style.transform !== 'none' || style.scale && style.scale !== 'none' || style.rotate && style.rotate !== 'none' || style.zoom && style.zoom !== 'normal' && Number(style.zoom) !== 1) return;
    if (node === doc.body || node === doc.documentElement) continue;
    const x = /^(auto|scroll|hidden)$/.test(style.overflowX), y = /^(auto|scroll|hidden)$/.test(style.overflowY);
    if (x || y) {
     const rect = node.getBoundingClientRect();
     const box = {left: rect.left + node.clientLeft, top: rect.top + node.clientTop};
     box.right = box.left + node.clientWidth; box.bottom = box.top + node.clientHeight;
     if (node === modal) {
      box.left = Math.max(box.left, visible.left); box.top = Math.max(box.top, visible.top);
      box.right = Math.min(box.right, visible.right); box.bottom = Math.min(box.bottom, visible.bottom);
     }
     if (!validBox(box) || typeof node.scrollBy !== 'function') return;
     clips.push({node, box, x, y});
    }
    if (node === modal) break;
   }
   // Reveal inside-out, stopping at the native modal's proven boundary.
   for (const {node, box, x, y} of clips) reveal(node, box, x, y);
   if (modal) return;
   if (!ownsFocus()) return;
   const rect = target.getBoundingClientRect();
   for (const chrome of doc.querySelectorAll('.top, .library-tools')) {
    const style = view.getComputedStyle(chrome), box = chrome.getBoundingClientRect();
    if ((style.position === 'fixed' || style.position === 'sticky' && box.top <= Math.max(visible.top, parseFloat(style.top) || 0) + 1)
     && box.right > rect.left && box.left < rect.right && box.bottom > visible.top && box.top < visible.bottom) visible.top = Math.max(visible.top, box.bottom);
   }
   reveal(view, visible);
   } catch (_) { /* Optional reveal failure leaves accepted state and focus intact. */ }
  }
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
   find('[data-menu-budget]').textContent = `Copies: ${state.copies} of ${COPY_LIMIT}.`;
   const duplicate = menu.querySelector('[data-menu-action="duplicate"]');
   duplicate.disabled = state.copies >= COPY_LIMIT;
   find('[data-menu-limit]').hidden = !duplicate.disabled;
   const last = state.deleted.at(-1);
   find('[data-menu-recovery]').hidden = !last;
   find('[data-menu-deleted]').textContent = last ? `${state.deleted.length} deleted. Next: “${last.file.name}”.` : '';
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
   closeMenu(); state = update(state, {type: 'undo'}); render();
   // Repeated recovery keeps its action point; the last Undo returns to the file.
   if (state.deleted.length) focusAndReveal(undo); else focusRow(id);
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
