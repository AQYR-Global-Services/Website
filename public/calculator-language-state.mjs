// A single-use, five-minute handoff within this tab for language navigation.
// Store only scoring controls, never free-text searches or enquiry details.
const key = 'aqyr-calculator-language-handoff';
function supported(control) {
  return /^pc-[\w-]+$/.test(control.id) && (control.tagName === 'SELECT' ||
    ['checkbox', 'radio', 'number', 'date'].includes(control.type) ||
    ['pc-state', 'pc-occupation', 'pc-partner-occupation', 'pc-regional-postcode'].includes(control.id));
}
export function captureCalculatorControls(controls) {
  return [...controls].filter(supported).map(control => ({ id: control.id,
    value: ['checkbox', 'radio'].includes(control.type) ? control.checked : control.value }));
}
export function restoreCalculatorControls(controls, saved) {
  if (!Array.isArray(saved) || saved.length > 200) return;
  const byId = new Map(saved.filter(row => row && typeof row.id === 'string').map(row => [row.id, row.value]));
  for (const control of controls) {
    if (!supported(control) || !byId.has(control.id)) continue;
    const value = byId.get(control.id);
    if (['checkbox', 'radio'].includes(control.type)) {
      if (typeof value === 'boolean') control.checked = value;
    } else if (typeof value === 'string' && value.length < 100) {
      if (control.tagName === 'SELECT') {
        if ([...control.options].some(option => option.value === value && !option.disabled)) control.value = value;
      } else if (control.id === 'pc-state') {
        if (['vic', 'nsw', 'qld', 'wa', 'sa', 'tas', 'act', 'nt'].includes(value)) control.value = value;
      } else if (value === '' || /^(?:\d{1,8}(?:\.\d{1,2})?|\d{4}-\d{2}-\d{2})$/.test(value)) control.value = value;
    }
  }
}
export function saveCalculatorHandoff(storage, controls, target, now = Date.now()) {
  try { storage.setItem(key, JSON.stringify({ target, at: now, controls: captureCalculatorControls(controls) })); } catch {}
}
export function takeCalculatorHandoff(storage, target, now = Date.now()) {
  try {
    const raw = storage.getItem(key);
    storage.removeItem(key);
    const value = JSON.parse(raw);
    if (value?.target === target && Number.isFinite(value.at) && value.at <= now && now - value.at < 300000 &&
        Array.isArray(value.controls) && value.controls.length <= 200) return value.controls;
  } catch {}
  return [];
}
