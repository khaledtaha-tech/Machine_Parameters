async function fetchServerRecords() {
  try {
    const response = await fetch('api.php');
    if (response.ok) {
      const serverData = await response.json();
      if (Array.isArray(serverData) && serverData.length > 0) {
        const seen = new Set(records.map(r => r.id));
        let newAdded = false;
        for (const item of serverData) {
          if (item && item.id && !seen.has(item.id)) {
            records.push(item);
            seen.add(item.id);
            newAdded = true;
          }
        }
        if (newAdded) {
          save();
          renderDashboard();
          renderRecords();
          renderMaterials();
        }
      }
    }
  } catch (e) {
    console.log('Running in local offline mode');
  }
}

async function postRecordToServer(record) {
  try {
    const response = await fetch('api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    if (!response.ok) throw new Error('Server rejected record');
  } catch (e) {
    console.log('Failed to sync record to server, saved locally');
  }
}

async function saveAllRecordsToServer() {
  save();
  toast('Saving all records to database...');
  let successCount = 0;
  for (const record of records) {
    try {
      await fetch('api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      successCount++;
    } catch (err) {
      console.warn('Sync failed for item:', record.id);
    }
  }
  toast(`✔ All ${records.length} records safely saved & synced!`);
}

const STORAGE_KEY = 'processControlRecordsV2';
const LIBRARY_KEY = 'processControlParameterLibraryV2';
const THEME_KEY = 'processControlThemeV1';

const defaultLibrary = [
  ['pvc57', 'PVC 57', 'kg', 'common', 'Formula'],
  ['caco3', 'Calcium Carbonate', 'kg', 'common', 'Formula'],
  ['stabilizer', 'Stabilizer', 'kg', 'common', 'Formula'],
  ['tio2', 'Titanium Dioxide, 134a', 'kg', 'common', 'Formula'],
  ['lp551', 'Lub., LP-551', 'kg', 'common', 'Formula'],
  ['sag12', 'Lub., SAG-Lub 12', 'kg', 'common', 'Formula'],
  ['finaluxg1', 'Lub., Finalux G1', 'kg', 'common', 'Formula'],
  ['finaluxg322', 'Lub., Finalux G322', 'kg', 'common', 'Formula'],
  ['pewax', 'PE Wax', 'kg', 'common', 'Formula'],
  ['esbo', 'ESBO', 'kg', 'common', 'Formula'],
  ['calciumstearate', 'Calcium Stearate', 'kg', 'common', 'Formula'],
  ['productweight', 'Product Weight', 'kg', 'common', 'Product'],
  ['cycle', 'Cycle / Cut Time', 's', 'common', 'Process'],
  ['meltTemp', 'Melt Temperature', '°C', 'common', 'Temperature'],
  ['zone1', 'Zone 1 Set / Actual', '°C', 'common', 'Temperature'],
  ['zone2', 'Zone 2 Set / Actual', '°C', 'common', 'Temperature'],
  ['zone3', 'Zone 3 Set / Actual', '°C', 'common', 'Temperature'],
  ['zone4', 'Zone 4 Set / Actual', '°C', 'common', 'Temperature'],
  ['zone5', 'Zone 5 Set / Actual', '°C', 'common', 'Temperature'],
  ['zone6', 'Zone 6 Set / Actual', '°C', 'common', 'Temperature'],
  ['motorload', 'Motor Load', 'A / %', 'common', 'Machine'],
  ['screwspeedcommon', 'Screw Speed', 'rpm', 'common', 'Machine'],
  ['meltpressure', 'Melt Pressure', 'bar', 'common', 'Machine'],
  ['filling', 'Filling Time', 's', 'fittings', 'Injection'],
  ['cooling', 'Cooling Time', 's', 'fittings', 'Injection'],
  ['refilling', 'Refilling Time', 's', 'fittings', 'Injection'],
  ['shotsize', 'Shot Size', 'mm', 'fittings', 'Injection'],
  ['cushion', 'Cushion', 'mm', 'fittings', 'Injection'],
  ['holdp1', 'Hold Pressure P1', 'bar / s', 'fittings', 'Injection'],
  ['holdp2', 'Hold Pressure P2', 'bar / s', 'fittings', 'Injection'],
  ['runnerweight', 'Runner Weight', 'kg', 'fittings', 'Product'],
  ['nozzle', 'Nozzle Temp Set / Actual', '°C', 'fittings', 'Temperature'],
  ['oiltemp', 'Oil Temperature', '°C', 'fittings', 'Machine'],
  ['injectionspeed', 'Injection Speed', '%', 'fittings', 'Injection'],
  ['backpressure', 'Back Pressure', 'bar', 'fittings', 'Injection'],
  ['clampingforce', 'Clamping Force', 'T', 'fittings', 'Machine'],
  ['screwspeed', 'Extruder Screw Speed', 'rpm', 'pipe', 'Extrusion'],
  ['linespeed', 'Line Speed', 'm/min', 'pipe', 'Extrusion'],
  ['hauloff', 'Haul-off Speed', 'm/min', 'pipe', 'Extrusion'],
  ['output', 'Output', 'kg/h', 'pipe', 'Extrusion'],
  ['vacuum', 'Vacuum Pressure', 'bar', 'pipe', 'Sizing & Cooling'],
  ['waterTemp1', 'Cooling Tank 1 Water Temp', '°C', 'pipe', 'Sizing & Cooling'],
  ['waterTemp2', 'Cooling Tank 2 Water Temp', '°C', 'pipe', 'Sizing & Cooling'],
  ['dieTemp', 'Die Head Temperature', '°C', 'pipe', 'Temperature'],
  ['adapterTemp', 'Adapter Temperature', '°C', 'pipe', 'Temperature'],
  ['od', 'Outside Diameter', 'mm', 'pipe', 'Product'],
  ['thickness', 'Wall Thickness', 'mm', 'pipe', 'Product'],
  ['meterweight', 'Meter Weight', 'kg/m', 'pipe', 'Product'],
  ['cutlength', 'Cut / Coil Length', 'm', 'pipe', 'Product'],
  ['printer', 'Printing Condition', 'text', 'pipe', 'Downstream'],
  ['cutter', 'Cutter / Winder Condition', 'text', 'pipe', 'Downstream']
].map(([id, name, unit, department, group]) => ({ id, name, unit, department, group }));

const templates = {
  fittings: ['pvc57', 'caco3', 'stabilizer', 'tio2', 'lp551', 'sag12', 'finaluxg1', 'finaluxg322', 'pewax', 'esbo', 'calciumstearate', 'productweight', 'cycle', 'runnerweight', 'filling', 'cooling', 'refilling', 'shotsize', 'cushion', 'holdp1', 'holdp2', 'injectionspeed', 'backpressure', 'nozzle', 'zone1', 'zone2', 'zone3', 'zone4', 'zone5', 'oiltemp', 'screwspeedcommon', 'motorload'],
  pipe: ['pvc57', 'caco3', 'stabilizer', 'tio2', 'lp551', 'sag12', 'finaluxg1', 'finaluxg322', 'pewax', 'esbo', 'calciumstearate', 'od', 'thickness', 'meterweight', 'cutlength', 'productweight', 'cycle', 'output', 'screwspeed', 'linespeed', 'hauloff', 'meltpressure', 'meltTemp', 'dieTemp', 'adapterTemp', 'zone1', 'zone2', 'zone3', 'zone4', 'zone5', 'vacuum', 'waterTemp1', 'waterTemp2', 'motorload', 'printer', 'cutter'],
  formulaOnly: ['pvc57', 'caco3', 'stabilizer', 'tio2', 'lp551', 'sag12', 'finaluxg1', 'finaluxg322', 'pewax', 'esbo', 'calciumstearate'],
  common: ['pvc57', 'caco3', 'stabilizer', 'tio2', 'lp551', 'sag12', 'finaluxg1', 'finaluxg322', 'pewax', 'esbo', 'calciumstearate', 'cycle', 'meltTemp', 'zone1', 'zone2', 'zone3', 'zone4', 'zone5', 'motorload']
};

const baselineLabels = {
  running_with_before: 'Running — previous conditions available',
  running_no_before: 'Running — previous conditions not available',
  machine_stopped: 'Machine stopped before the trial'
};

function safeJson(text, fallback) {
  try { return text ? JSON.parse(text) : fallback; } catch { return fallback; }
}

function loadAllRecords() {
  const candidateKeys = [
    'processControlRecordsV2',
    'processControlRecords',
    'processControlRecordsV1',
    'process_control_records',
    'records'
  ];
  const merged = [];
  const seen = new Set();

  for (const key of candidateKeys) {
    const stored = safeJson(localStorage.getItem(key), []);
    if (Array.isArray(stored)) {
      for (const item of stored) {
        if (!item) continue;
        const recordId = item.id || `${item.date}-${item.machine}-${item.product}`;
        if (!seen.has(recordId)) {
          seen.add(recordId);
          merged.push(item);
        }
      }
    }
  }
  return merged;
}

function loadAllLibrary() {
  const candidateKeys = [
    'processControlParameterLibraryV2',
    'processControlParameterLibrary',
    'processControlParameterLibraryV1',
    'parameterLibrary',
    'library'
  ];
  for (const key of candidateKeys) {
    const stored = safeJson(localStorage.getItem(key), null);
    if (Array.isArray(stored) && stored.length > 0) return stored;
  }
  return defaultLibrary;
}

let records = loadAllRecords();
let library = loadAllLibrary();

for (const item of defaultLibrary) {
  if (!library.some(existing => existing.id === item.id)) library.push(item);
}
const sharedCycle = library.find(item => item.id === 'cycle');
if (sharedCycle) Object.assign(sharedCycle, { name: 'Cycle / Cut Time', department: 'common', group: 'Process' });

localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));

let activeParameters = [];
let activeProduction = null;
let activeImportMeta = null;
let selectedRecordId = null;
let editingRecordId = null;
let pendingImport = null;
let wizard = { step: 'type', type: '', trialStatus: 'completed', department: '', baselineMode: 'running_with_before' };

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const cap = value => value ? value.charAt(0).toUpperCase() + value.slice(1) : '';

function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function normalize(value = '') {
  return String(value).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
}

function isBlank(value) { return value === null || value === undefined || String(value).trim() === ''; }
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }
function saveLibrary() { localStorage.setItem(LIBRARY_KEY, JSON.stringify(library)); }

function toast(message) {
  const element = $('#toast');
  if (!element) return;
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 2600);
}

function switchView(view) {
  $$('.view').forEach(element => element.classList.remove('active'));
  $(`#${view}View`).classList.add('active');
  $$('.nav-btn').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  $('#pageTitle').textContent = ({ dashboard: 'Dashboard', 'new-record': 'New Record', records: 'Records', materials: 'Trial Materials Audit', settings: 'Parameter Library' })[view] || 'Dashboard';
  if (view === 'records') renderRecords();
  if (view === 'dashboard') renderDashboard();
  if (view === 'materials') renderMaterials();
  if (view === 'settings') renderLibrary();
}

function applyTheme(theme) {
  const selected = theme === 'light' ? 'light' : 'dark';
  document.body.dataset.theme = selected;
  if ($('#themeToggle')) $('#themeToggle').textContent = selected === 'dark' ? 'Light' : 'Dark';
  localStorage.setItem(THEME_KEY, selected);
}

function getBaselineMode() {
  return $('#recordType').value === 'trial' ? (activeImportMeta?.baselineMode || wizard.baselineMode || 'running_with_before') : '';
}

function trialHasBefore() {
  return $('#recordType').value === 'trial' && $('#trialStatus')?.value !== 'planned' && getBaselineMode() === 'running_with_before';
}

function updateFieldRequirements() {
  const isOperating = $('#recordType').value === 'operating';
  const isExecutedTrial = $('#recordType').value === 'trial' && $('#trialStatus')?.value !== 'planned';

  if (isOperating || isExecutedTrial) {
    $('#machine')?.setAttribute('required', 'required');
    $('#product')?.setAttribute('required', 'required');
  } else {
    $('#machine')?.removeAttribute('required');
    $('#product')?.removeAttribute('required');
  }
}

function openNewRecordWizard(prefill = {}) {
  editingRecordId = null;
  wizard = {
    step: prefill.step || 'type',
    type: prefill.type || '',
    trialStatus: prefill.trialStatus || 'completed',
    department: prefill.department || '',
    baselineMode: prefill.baselineMode || 'running_with_before'
  };
  renderWizard();
  if (!$('#newRecordWizard').open) $('#newRecordWizard').showModal();
}

function wizardChoice(value, title, subtitle, icon) {
  return `<button class="wizard-choice" type="button" data-choice="${esc(value)}"><span class="choice-icon">${icon}</span><span><strong>${esc(title)}</strong><small>${esc(subtitle)}</small></span></button>`;
}

function renderWizard() {
  const content = $('#wizardContent');
  const back = $('#wizardBack');
  const progress = $('#wizardProgress');

  let steps = ['type', 'department'];
  if (wizard.type === 'trial') {
    steps.push('execution_status');
    if (wizard.trialStatus !== 'planned') steps.push('baseline');
  }
  steps.push('source');

  const currentIndex = Math.max(0, steps.indexOf(wizard.step));
  progress.innerHTML = steps.map((step, index) => `<span class="${index <= currentIndex ? 'active' : ''}"></span>`).join('');
  back.classList.toggle('hidden', wizard.step === 'type');

  if (wizard.step === 'type') {
    $('#wizardTitle').textContent = 'What do you want to record?';
    content.innerHTML = `<p class="wizard-lead">Choose whether this is a normal operating run or a trial.</p><div class="wizard-grid">${wizardChoice('operating', 'Normal Operating Conditions', 'One set of reference production parameters.', 'O')}${wizardChoice('trial', 'Trial', 'A controlled trial (tested on machine or raw materials proof).', 'T')}</div>`;
  } else if (wizard.step === 'department') {
    $('#wizardTitle').textContent = 'Which production section?';
    content.innerHTML = `<p class="wizard-lead">Select the section (Pipes Extrusion or Fittings Injection).</p><div class="wizard-grid">${wizardChoice('pipe', 'Pipes', 'Extrusion lines and pipe production.', 'P')}${wizardChoice('fittings', 'Fittings', 'Injection machines and fittings.', 'F')}</div>`;
  } else if (wizard.step === 'execution_status') {
    $('#wizardTitle').textContent = 'Has this trial been executed on the machine, or is it raw materials preparation only?';
    content.innerHTML = `<p class="wizard-lead">Prove raw materials consumption even before running the trial.</p><div class="wizard-grid baseline-grid">${wizardChoice('completed', 'Executed / Tested on Machine', 'The trial was run on the line; operating conditions, speeds and results are ready.', 'OK')}${wizardChoice('planned', 'Raw Materials Prepared Only (Proof of Materials)', 'Materials are batched & mixed; machine has not run yet. Log raw materials now to prevent inventory shortage.', 'MAT')}</div>`;
  } else if (wizard.step === 'baseline') {
    $('#wizardTitle').textContent = 'What was the machine status before the trial?';
    content.innerHTML = `<p class="wizard-lead">Controls how before & after conditions are compared.</p><div class="wizard-grid baseline-grid">${wizardChoice('running_with_before', 'Running — previous conditions available', 'Compare Normal/Before vs Trial/After and calculate differences.', 'A')}${wizardChoice('running_no_before', 'Running — no previous conditions available', 'Import Trial / After values only; Before is ignored.', 'B')}${wizardChoice('machine_stopped', 'Machine was stopped before the trial', 'Import startup / trial values only.', 'C')}</div>`;
  } else {
    $('#wizardTitle').textContent = 'How will you enter the record?';
    content.innerHTML = `<p class="wizard-lead">Excel import populates the form for review; it never saves automatically.</p><div class="wizard-grid">${wizardChoice('excel', 'Import from Excel', 'Read the workbook sheet and show a full preview.', 'X')}${wizardChoice('manual', 'Manual Entry', 'Open a form preloaded with standard parameters.', 'M')}</div>`;
  }
}

function handleWizardChoice(value) {
  if (wizard.step === 'type') {
    wizard.type = value;
    wizard.step = 'department';
  } else if (wizard.step === 'department') {
    wizard.department = value;
    if (wizard.type === 'operating') {
      wizard.step = 'source';
    } else {
      wizard.step = 'execution_status';
    }
  } else if (wizard.step === 'execution_status') {
    wizard.trialStatus = value;
    if (value === 'planned') {
      wizard.step = 'source';
    } else {
      wizard.step = 'baseline';
    }
  } else if (wizard.step === 'baseline') {
    wizard.baselineMode = value;
    wizard.step = 'source';
  } else if (value === 'manual') {
    $('#newRecordWizard').close();
    prepareBlankRecord(wizard);
    return;
  } else if (value === 'excel') {
    $('#newRecordWizard').close();
    $('#excelFileInput').value = '';
    $('#excelFileInput').click();
    return;
  }
  renderWizard();
}

function wizardBack() {
  if (wizard.step === 'source') {
    if (wizard.type === 'operating') wizard.step = 'department';
    else if (wizard.trialStatus === 'planned') wizard.step = 'execution_status';
    else wizard.step = 'baseline';
  } else if (wizard.step === 'baseline') {
    wizard.step = 'execution_status';
  } else if (wizard.step === 'execution_status') {
    wizard.step = 'department';
  } else if (wizard.step === 'department') {
    wizard.step = 'type';
  }
  renderWizard();
}

function setClassification({ type, department, baselineMode, trialStatus }) {
  $('#recordType').value = type || 'operating';
  $('#department').value = department || 'pipe';
  if ($('#trialStatus')) $('#trialStatus').value = trialStatus || 'completed';
  wizard.type = $('#recordType').value;
  wizard.department = $('#department').value;
  wizard.trialStatus = $('#trialStatus')?.value || 'completed';
  wizard.baselineMode = baselineMode || wizard.baselineMode || 'running_with_before';
  renderModeSummary();
  updateFieldRequirements();
}

function renderModeSummary() {
  const trial = $('#recordType').value === 'trial';
  const isPlanned = trial && $('#trialStatus')?.value === 'planned';
  const mode = getBaselineMode();

  if ($('#trialStatusWrapper')) {
    $('#trialStatusWrapper').style.display = trial ? 'grid' : 'none';
  }

  let valueRule = !trial ? 'Use Normal / Before Trial values.' : isPlanned ? 'Raw Materials Prepared Only — formulation recorded for audit; operating parameters will be filled upon machine run.' : mode === 'running_with_before' ? 'Use Before and After values and calculate differences.' : 'Use Trial / After values only; Before values are ignored.';

  $('#recordModeSummary').innerHTML = `<div><strong>${trial ? (isPlanned ? 'Trial (Raw Materials Proof Only)' : 'Executed Trial') : 'Operating Conditions'} · ${cap($('#department').value)}</strong><small>${trial ? (isPlanned ? 'Materials Logged — Machine run pending' : baselineLabels[mode]) : 'Normal production record'} — ${valueRule}</small></div><button class="text-btn" id="changeModeBtn" type="button">Change</button>`;
  $('#changeModeBtn').addEventListener('click', () => openNewRecordWizard({ type: $('#recordType').value, department: $('#department').value, baselineMode: mode, trialStatus: $('#trialStatus')?.value }));
  if ($('#parameterHelp')) $('#parameterHelp').textContent = valueRule;
  updateFieldRequirements();
}

function prepareBlankRecord(classification) {
  editingRecordId = null;
  activeImportMeta = { source: 'manual', baselineMode: classification.type === 'trial' ? classification.baselineMode : '' };
  activeProduction = null;
  activeParameters = [];
  $('#recordForm').reset();
  $('#formSectionTitle').textContent = 'Record Classification';
  $('#saveRecordSubmitBtn').textContent = 'Save Record';
  setClassification(classification);
  $('#recordDate').value = new Date().toISOString().slice(0, 10);

  if (classification.trialStatus === 'planned') {
    activeParameters = [];
    templates.formulaOnly.forEach(id => addParameter(library.find(item => item.id === id)));
    renderParameterTable();
  } else {
    loadTemplate(false);
  }

  renderProductionPanel();
  switchView('new-record');
}

function editRecord(id) {
  const record = records.find(item => item.id === id);
  if (!record) return;
  editingRecordId = id;
  activeImportMeta = record.importMeta || { source: 'manual', baselineMode: record.baselineMode || '' };
  activeProduction = record.production || null;
  activeParameters = (record.parameters || []).map(p => ({ ...p, rowId: uid() }));

  $('#recordForm').reset();
  $('#formSectionTitle').textContent = `Editing: ${record.product} (${record.trialNo || record.machine || 'Draft'})`;
  $('#saveRecordSubmitBtn').textContent = 'Update & Save Changes';

  setClassification({
    type: record.type || 'operating',
    department: record.department || 'pipe',
    baselineMode: record.baselineMode || 'running_with_before',
    trialStatus: record.status || (record.type === 'trial' ? 'completed' : '')
  });

  const fields = ['recordDate', 'trialNo', 'machine', 'workers', 'product', 'formulaCode', 'color', 'cavities', 'batches', 'preparingDate', 'mixingDate', 'pelletizingDate', 'materialHandover', 'receivedByDoc', 'purpose', 'observations', 'conclusion'];
  fields.forEach(f => {
    const val = record[f] || (f === 'recordDate' ? record.date : '');
    if ($('#' + f) && !isBlank(val)) $('#' + f).value = val;
  });

  renderParameterTable();
  renderProductionPanel();
  switchView('new-record');
  toast('Record loaded for full editing.');
}

function openRecord(id) {
  const record = records.find(item => item.id === id);
  if (!record) return;
  selectedRecordId = id;
  const content = $('#recordDetailContent');
  if (content) {
    const meta = recordMeta(record);
    const infoHtml = meta.map(([k, v]) => `<div class="detail-box"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('');
    content.innerHTML = `
      <div class="detail-grid">${infoHtml}</div>
      ${record.purpose ? `<div class="detail-box" style="margin-top:8px;"><span>Purpose</span><p>${esc(record.purpose)}</p></div>` : ''}
      ${productionHtml(record, false)}
      <div style="margin-top:12px;">${recordParameterTable(record, false)}</div>
      ${(record.observations || record.conclusion) ? `
        <div class="detail-grid" style="margin-top:12px;">
          ${record.observations ? `<div class="detail-box"><span>Observations</span><p>${esc(record.observations)}</p></div>` : ''}
          ${record.conclusion ? `<div class="detail-box"><span>Conclusion</span><p>${esc(record.conclusion)}</p></div>` : ''}
        </div>
      ` : ''}
    `;
  }
  $('#recordDialog')?.showModal();
}

function filteredLibrary() {
  const department = $('#department').value;
  return library.filter(parameter => parameter.department === 'common' || parameter.department === department);
}

function renderPicker() {
  const available = filteredLibrary().filter(parameter => !activeParameters.some(active => active.libraryId === parameter.id));
  const groups = {};
  available.forEach(parameter => (groups[parameter.group || 'Other'] ??= []).push(parameter));
  $('#parameterPicker').innerHTML = Object.entries(groups).map(([group, items]) => `<optgroup label="${esc(group)}">${items.map(item => `<option value="${esc(item.id)}">${esc(item.name)} (${esc(item.unit || '-')})</option>`).join('')}</optgroup>`).join('') || '<option value="">No available parameters</option>';
}

function addParameter(item) {
  if (!item || activeParameters.some(active => active.libraryId === item.id)) return;
  activeParameters.push({ rowId: uid(), libraryId: item.id, name: item.name, unit: item.unit, group: item.group || 'Other', valueType: 'Comparison', scope: item.department, before: '', after: '', value: '' });
}

function loadTemplate(showToast = true) {
  activeParameters = [];
  const tmpl = ($('#recordType').value === 'trial' && $('#trialStatus')?.value === 'planned') ? templates.formulaOnly : (templates[$('#department').value] || []);
  tmpl.forEach(id => addParameter(library.find(item => item.id === id)));
  renderParameterTable();
  if (showToast) toast('Standard parameters loaded');
}

function difference(before, after) {
  const a = String(before || '').trim();
  const b = String(after || '').trim();
  if (!a && !b) return { label: '—', kind: 'neutral' };
  if (!a && b) return { label: 'Added', kind: 'added' };
  if (a && !b) return { label: 'Removed', kind: 'removed' };
  const na = parseNumber(a), nb = parseNumber(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) {
    if (na === nb) return { label: 'No Change', kind: 'same' };
    const delta = nb - na;
    const percent = na === 0 ? null : delta / Math.abs(na) * 100;
    return { label: `${delta > 0 ? '+' : ''}${round(delta)}${percent === null ? '' : ` (${percent > 0 ? '+' : ''}${percent.toFixed(1)}%)`}`, kind: delta > 0 ? 'increase' : 'decrease' };
  }
  return normalize(a) === normalize(b) ? { label: 'No Change', kind: 'same' } : { label: `${a} -> ${b}`, kind: 'changed' };
}

function renderParameterTable() {
  const trial = $('#recordType').value === 'trial';
  const withBefore = trialHasBefore();
  const table = $('#parameterTable');
  if (!activeParameters.length) {
    table.innerHTML = '<div class="empty">No parameters added yet. Import Excel or load standard parameters.</div>';
    renderPicker();
    return;
  }

  table.innerHTML = activeParameters.map(parameter => {
    const calculated = normalize(parameter.valueType) === 'calculated';
    const rowClass = trial && withBefore ? 'comparison' : 'single';
    let values;
    if (trial && withBefore) {
      const diff = difference(parameter.before, parameter.after);
      values = `<input class="param-before" value="${esc(parameter.before || '')}" placeholder="Normal / Before" ${calculated ? 'readonly' : ''}/><input class="param-after" value="${esc(parameter.after || '')}" placeholder="Trial / After" ${calculated ? 'readonly' : ''}/><span class="difference ${diff.kind}">${esc(diff.label)}</span>`;
    } else if (trial) {
      values = `<input class="param-after wide-value" value="${esc(parameter.after || parameter.value || '')}" placeholder="${getBaselineMode() === 'machine_stopped' ? 'Startup / Trial Value' : 'Trial / Batch Value'}" ${calculated ? 'readonly' : ''}/>`;
    } else {
      values = `<input class="param-value wide-value" value="${esc(parameter.value || '')}" placeholder="Normal / Operating Value" ${calculated ? 'readonly' : ''}/>`;
    }
    return `<div class="param-row ${rowClass}" data-id="${parameter.rowId}"><div class="param-label"><strong>${esc(parameter.name)}</strong><small>${esc(parameter.group || '')} · ${esc(parameter.unit || 'No unit')}${calculated ? ' · Calculated' : ''}</small></div><input class="param-unit" value="${esc(parameter.unit || '')}" placeholder="Unit"/>${values}<button type="button" class="remove-btn">x</button></div>`;
  }).join('');

  $$('.param-row').forEach(row => {
    const parameter = activeParameters.find(item => item.rowId === row.dataset.id);
    row.querySelector('.param-unit').addEventListener('input', event => parameter.unit = event.target.value);
    row.querySelector('.param-before')?.addEventListener('input', event => { parameter.before = event.target.value; updateRowDifference(row, parameter); refreshCalculations(false); });
    row.querySelector('.param-after')?.addEventListener('input', event => { parameter.after = event.target.value; updateRowDifference(row, parameter); refreshCalculations(false); });
    row.querySelector('.param-value')?.addEventListener('input', event => { parameter.value = event.target.value; refreshCalculations(false); });
    row.querySelector('.remove-btn').addEventListener('click', () => { activeParameters = activeParameters.filter(item => item.rowId !== parameter.rowId); refreshCalculations(); });
  });
  renderPicker();
}

function updateRowDifference(row, parameter) {
  const element = row.querySelector('.difference');
  if (!element) return;
  const result = difference(parameter.before, parameter.after);
  element.className = `difference ${result.kind}`;
  element.textContent = result.label;
}

function parseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  const match = String(value || '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : NaN;
}

function round(value, digits = 2) { return Number(Number(value).toFixed(digits)); }

function parameterValue(parameter, field) {
  if (field === 'before') return parameter.before;
  if (field === 'after') return parameter.after || parameter.value;
  return parameter.value || parameter.after;
}

function findParameterValue(parameters, field, patterns) {
  const parameter = parameters.find(item => patterns.some(pattern => pattern.test(normalize(item.name))));
  return parameter ? parseNumber(parameterValue(parameter, field)) : NaN;
}

function calculatePipeOutput(parameters, field) {
  const speed = findParameterValue(parameters, field, [/haul off speed/, /hauloff speed/, /line speed/, /tractor speed/, /puller speed/]);
  let meterWeight = findParameterValue(parameters, field, [/meter weight/, /weight per meter/, /kg m/]);
  let productWeight = findParameterValue(parameters, field, [/product weight/, /pipe weight/, /weight of (one )?pipe/]);
  const length = findParameterValue(parameters, field, [/cut (coil )?length/, /pipe length/, /^length$/]);
  const cycle = findParameterValue(parameters, field, [/cycle( cut)? time/, /cut time/, /time (to|of) cut/]);
  if (!Number.isFinite(meterWeight) && Number.isFinite(productWeight) && Number.isFinite(length) && length > 0) meterWeight = productWeight / length;
  if (!Number.isFinite(productWeight) && Number.isFinite(meterWeight) && Number.isFinite(length)) productWeight = meterWeight * length;
  const bySpeed = Number.isFinite(speed) && Number.isFinite(meterWeight) ? speed * 60 * meterWeight : NaN;
  const byCycle = Number.isFinite(cycle) && cycle > 0 && Number.isFinite(productWeight) ? productWeight * 3600 / cycle : NaN;
  if (!Number.isFinite(bySpeed) && !Number.isFinite(byCycle)) return null;
  const result = {
    bySpeed: Number.isFinite(bySpeed) ? round(bySpeed) : null,
    byCycle: Number.isFinite(byCycle) ? round(byCycle) : null,
    speed: Number.isFinite(speed) ? speed : null,
    meterWeight: Number.isFinite(meterWeight) ? round(meterWeight, 4) : null,
    productWeight: Number.isFinite(productWeight) ? round(productWeight, 4) : null,
    length: Number.isFinite(length) ? length : null,
    cycle: Number.isFinite(cycle) ? cycle : null
  };
  if (result.bySpeed !== null && result.byCycle !== null) result.differencePercent = round(Math.abs(result.bySpeed - result.byCycle) / Math.min(result.bySpeed, result.byCycle) * 100, 1);
  return result;
}

function refreshCalculations(renderTable = true) {
  if ($('#department').value !== 'pipe' || ($('#recordType').value === 'trial' && $('#trialStatus')?.value === 'planned')) {
    activeProduction = null;
  } else {
    const oldChoice = activeProduction?.adoptedMethod || '';
    activeProduction = {
      before: $('#recordType').value === 'trial' && trialHasBefore() ? calculatePipeOutput(activeParameters, 'before') : null,
      current: calculatePipeOutput(activeParameters, $('#recordType').value === 'trial' ? 'after' : 'value'),
      adoptedMethod: oldChoice
    };
    if (activeProduction.current) {
      if (activeProduction.current.bySpeed === null) activeProduction.adoptedMethod = 'cycle';
      if (activeProduction.current.byCycle === null) activeProduction.adoptedMethod = 'speed';
    }
  }
  if (renderTable) renderParameterTable();
  renderProductionPanel();
}

function productionCards(result, label) {
  if (!result) return '';
  return `<div class="production-set"><h4>${esc(label)}</h4><div class="rate-cards">${result.bySpeed !== null ? `<div><span>By Haul-off Speed</span><strong>${result.bySpeed.toFixed(2)} kg/h</strong></div>` : ''}${result.byCycle !== null ? `<div><span>By Cycle / Cut Time</span><strong>${result.byCycle.toFixed(2)} kg/h</strong></div>` : ''}</div></div>`;
}

function renderProductionPanel() {
  const panel = $('#productionRatePanel');
  const current = activeProduction?.current;
  if ($('#department').value !== 'pipe' || !current) {
    panel.classList.add('hidden');
    panel.innerHTML = '';
    return;
  }
  const both = current.bySpeed !== null && current.byCycle !== null;
  panel.classList.remove('hidden');
  panel.innerHTML = `<div class="production-head"><div><span class="eyebrow">PIPE PRODUCTION RATE</span><h3>Calculated Production Output</h3></div>${both ? `<span class="difference changed">Difference ${current.differencePercent}%</span>` : ''}</div>${activeProduction.before ? productionCards(activeProduction.before, 'Normal / Before Trial') : ''}${productionCards(current, $('#recordType').value === 'trial' ? 'Trial / After' : 'Normal Operation')}${both ? `<div class="rate-choice"><strong>Which result do you want to adopt?</strong><label><input type="radio" name="activeOutputMethod" value="speed" ${activeProduction.adoptedMethod === 'speed' ? 'checked' : ''}/> ${current.bySpeed.toFixed(2)} kg/h — Haul-off speed</label><label><input type="radio" name="activeOutputMethod" value="cycle" ${activeProduction.adoptedMethod === 'cycle' ? 'checked' : ''}/> ${current.byCycle.toFixed(2)} kg/h — Cycle / cut time</label></div>` : ''}`;
  $$('input[name="activeOutputMethod"]').forEach(input => input.addEventListener('change', event => activeProduction.adoptedMethod = event.target.value));
}

function normalizeScope(value) {
  const text = normalize(value).replace(/\s+/g, '');
  if (!text || text === 'all' || text === 'common' || text === 'pipefitting' || text === 'pipeandfitting' || text === 'pipesfittings') return 'common';
  if (text.includes('fitting')) return 'fittings';
  if (text.includes('pipe')) return 'pipe';
  return 'common';
}

function scopeMatches(scope, department) { return scope === 'common' || scope === department; }

function isInformationName(name) {
  return /^(trial no|trial number|record date|trial date|date|trial or normal run date|running date|date of trial|purpose|trial purpose|machine|machine id|machine line|line|number of workers|no of workers|workers|no of people|number of people|worker count|product|product name|product code|formula code|code|color|no of cavities|number of cavities|cavities|no of batches|number of batches|batches|preparing date|date of mixing|mixing date|date of pelletizing|pelletizing date|material handover|handover status|received by \/ doc no|received by|doc no|observations|findings|conclusion|recommendation|result)$/.test(normalize(name));
}

function valueType(value, parameterName) {
  if (isInformationName(parameterName)) return 'Information';
  const type = normalize(value);
  if (type.includes('calculat')) return 'Calculated';
  if (type.includes('information') || type === 'info') return 'Information';
  if (type.includes('comparison') || type.includes('compare')) return 'Comparison';
  return 'Comparison';
}

function findColumn(headers, aliases) {
  const normalizedHeaders = headers.map(normalize);
  for (const alias of aliases) {
    const exact = normalizedHeaders.indexOf(normalize(alias));
    if (exact >= 0) return exact;
  }
  for (const alias of aliases) {
    const target = normalize(alias);
    const partial = normalizedHeaders.findIndex(header => header.includes(target) || target.includes(header));
    if (partial >= 0) return partial;
  }
  return -1;
}

function assignInformation(target, name, value) {
  if (isBlank(value)) return;
  const key = normalize(name);
  const map = {
    'trial no': 'trialNo', 'trial number': 'trialNo',
    'record date': 'recordDate', 'trial date': 'recordDate', 'date': 'recordDate',
    'trial or normal run date': 'recordDate', 'running date': 'recordDate', 'date of trial': 'recordDate',
    'purpose': 'purpose', 'trial purpose': 'purpose',
    'machine': 'machine', 'machine id': 'machine', 'machine line': 'machine', 'line': 'machine',
    'number of workers': 'workers', 'no of workers': 'workers', 'workers': 'workers', 'worker count': 'workers',
    'no of people': 'workers', 'number of people': 'workers',
    'product': 'product', 'product name': 'product',
    'product code': 'formulaCode', 'formula code': 'formulaCode', 'code': 'formulaCode',
    'color': 'color', 'no of cavities': 'cavities', 'number of cavities': 'cavities', 'cavities': 'cavities',
    'no of batches': 'batches', 'number of batches': 'batches', 'batches': 'batches',
    'preparing date': 'preparingDate',
    'date of mixing': 'mixingDate', 'mixing date': 'mixingDate',
    'date of pelletizing': 'pelletizingDate', 'pelletizing date': 'pelletizingDate',
    'material handover': 'materialHandover', 'handover status': 'materialHandover',
    'received by / doc no': 'receivedByDoc', 'received by': 'receivedByDoc', 'doc no': 'receivedByDoc',
    'observations': 'observations', 'findings': 'observations',
    'conclusion': 'conclusion', 'recommendation': 'conclusion', 'result': 'conclusion'
  };
  const field = map[key];
  if (field) target[field] = String(value).trim();
  else target.extraInformation.push({ name, value: String(value).trim() });
}

function chooseSheet(workbook, department) {
  const names = workbook.SheetNames || [];
  const preferred = department === 'pipe' ? ['pipes', 'pipe'] : ['fittings', 'fitting'];
  let name = names.find(sheet => preferred.includes(normalize(sheet)));
  if (!name) name = names.find(sheet => preferred.some(candidate => normalize(sheet).includes(candidate)));
  if (!name && names.length === 1) name = names[0];
  if (!name) throw new Error(`The workbook does not contain a ${department === 'pipe' ? 'Pipes' : 'Fittings'} sheet.`);
  return name;
}

function parseExcelWorkbook(workbook, classification) {
  const sheetName = chooseSheet(workbook, classification.department);
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: false, defval: '' });
  const headerRowIndex = rows.findIndex(row => row.some(cell => ['parameter', 'parameter name', 'field', 'item'].includes(normalize(cell))) && row.some(cell => /before|normal|trial|after|value type/.test(normalize(cell))));
  if (headerRowIndex < 0) throw new Error('Could not find the parameter table headers in the selected sheet.');
  const headers = rows[headerRowIndex];
  const columns = {
    parameter: findColumn(headers, ['Parameter', 'Parameter Name', 'Field', 'Item']),
    group: findColumn(headers, ['Group', 'Category', 'Section']),
    unit: findColumn(headers, ['Unit', 'UOM']),
    scope: findColumn(headers, ['Applies To', 'Applicable To', 'Scope', 'Department', 'Used For', 'Process']),
    valueType: findColumn(headers, ['Value Type', 'Data Type', 'Type']),
    normal: findColumn(headers, ['Normal / Before Trial', 'Normal Before Trial', 'Normal Operation Value', 'Normal Operation', 'Before Trial', 'Before']),
    trial: findColumn(headers, ['Trial / After Trial', 'Trial After Trial', 'Trial Value', 'After Trial', 'After'])
  };
  if (columns.parameter < 0) throw new Error('The Parameter column is missing.');

  const result = {
    sheetName,
    information: { extraInformation: [] },
    parameters: [],
    calculatedRows: [],
    ignoredBeforeCount: 0,
    skippedCount: 0,
    sourceFile: '',
    classification
  };
  const cell = (row, index) => index >= 0 ? row[index] : '';

  for (const row of rows.slice(headerRowIndex + 1)) {
    let rawName = String(cell(row, columns.parameter) || '').trim();
    if (!rawName) continue;

    let extractedUnit = '';
    const unitMatch = rawName.match(/\(([^)]+)\)$/);
    if (unitMatch) {
      extractedUnit = unitMatch[1].trim();
      rawName = rawName.replace(/\(([^)]+)\)$/, '').trim();
    }

    const name = rawName;
    const type = valueType(cell(row, columns.valueType), name);
    const scope = normalizeScope(cell(row, columns.scope));
    if (!scopeMatches(scope, classification.department)) { result.skippedCount += 1; continue; }
    const normalValue = cell(row, columns.normal);
    const trialValue = cell(row, columns.trial);

    const libItem = library.find(item => normalize(item.name) === normalize(name));
    const unit = String(cell(row, columns.unit) || extractedUnit || libItem?.unit || '').trim();
    const group = String(cell(row, columns.group) || (type === 'Information' ? 'Information' : 'Imported')).trim();

    if (type === 'Information' || isInformationName(name)) {
      const informationValue = classification.type === 'trial' ? (isBlank(normalValue) ? trialValue : normalValue) : (isBlank(normalValue) ? trialValue : normalValue);
      assignInformation(result.information, name, informationValue);
      continue;
    }
    if (type === 'Calculated') {
      result.calculatedRows.push({ name, unit, group, scope, valueType: type, before: normalValue, after: trialValue, value: normalValue });
      continue;
    }

    const parameter = { rowId: uid(), libraryId: null, name, unit, group, scope, valueType: type, before: '', after: '', value: '' };
    if (classification.type === 'operating') {
      if (isBlank(normalValue) && isBlank(trialValue)) continue;
      parameter.value = String(!isBlank(normalValue) ? normalValue : trialValue).trim();
    } else if (classification.trialStatus === 'planned') {
      if (!isFormulaMaterial(group, name)) continue;
      parameter.after = String(trialValue || normalValue || '').trim();
    } else if (classification.baselineMode === 'running_with_before') {
      if (isBlank(normalValue) && isBlank(trialValue)) continue;
      parameter.before = String(normalValue || '').trim();
      parameter.after = String(trialValue || '').trim();
    } else {
      if (isBlank(trialValue) && isBlank(normalValue)) continue;
      parameter.after = String(!isBlank(trialValue) ? trialValue : normalValue).trim();
    }
    result.parameters.push(parameter);
  }

  const field = classification.type === 'trial' ? 'after' : 'value';
  result.production = (classification.department === 'pipe' && classification.trialStatus !== 'planned') ? {
    before: classification.type === 'trial' && classification.baselineMode === 'running_with_before' ? calculatePipeOutput(result.parameters, 'before') : null,
    current: calculatePipeOutput(result.parameters, field),
    adoptedMethod: ''
  } : null;
  if (result.production?.current?.bySpeed === null) result.production.adoptedMethod = 'cycle';
  if (result.production?.current?.byCycle === null) result.production.adoptedMethod = 'speed';
  return result;
}

function readExcelFile(file) {
  if (!window.XLSX) { toast('Excel reader did not load. Check the internet connection and try again.'); return; }
  const reader = new FileReader();
  reader.onload = event => {
    try {
      const workbook = XLSX.read(event.target.result, { type: 'array', cellDates: true });
      pendingImport = parseExcelWorkbook(workbook, { ...wizard });
      pendingImport.sourceFile = file.name;
      renderImportPreview();
      $('#importPreviewDialog').showModal();
    } catch (error) {
      toast(error.message || 'The Excel file could not be read.');
    }
  };
  reader.onerror = () => toast('The Excel file could not be opened.');
  reader.readAsArrayBuffer(file);
}

function previewTable(data) {
  const trial = data.classification.type === 'trial';
  const withBefore = trial && data.classification.trialStatus !== 'planned' && data.classification.baselineMode === 'running_with_before';
  const header = withBefore ? '<th>Normal / Before</th><th>Trial / After</th><th>Difference</th>' : `<th>${trial ? 'Trial / After' : 'Normal / Before'}</th>`;
  const rows = data.parameters.map(parameter => {
    let values;
    if (withBefore) {
      const diff = difference(parameter.before, parameter.after);
      values = `<td>${esc(parameter.before || '—')}</td><td>${esc(parameter.after || '—')}</td><td><span class="difference ${diff.kind}">${esc(diff.label)}</span></td>`;
    } else values = `<td>${esc(trial ? parameter.after : parameter.value)}</td>`;
    return `<tr><td>${esc(parameter.group)}</td><td>${esc(parameter.name)}</td><td>${esc(parameter.unit || '—')}</td>${values}</tr>`;
  }).join('');
  return `<div class="preview-table-wrap"><table class="detail-table"><thead><tr><th>Group</th><th>Parameter</th><th>Unit</th>${header}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderImportPreview() {
  const data = pendingImport;
  if (!data) return;
  const info = data.information;
  const isPlanned = data.classification.type === 'trial' && data.classification.trialStatus === 'planned';
  const mode = data.classification.type === 'trial' ? (isPlanned ? 'Planned (Raw Materials Proof)' : baselineLabels[data.classification.baselineMode]) : 'Normal operating conditions';
  const meta = [
    ['File', data.sourceFile], ['Sheet', data.sheetName], ['Record', data.classification.type === 'trial' ? (isPlanned ? 'Planned Trial' : 'Trial') : 'Operating'], ['Department', cap(data.classification.department)], ['Status/Baseline', mode], ['Imported Parameters', String(data.parameters.length)]
  ];
  const information = Object.entries(info).filter(([key, value]) => key !== 'extraInformation' && !isBlank(value)).map(([key, value]) => `<div class="detail-box"><span>${esc(fieldLabel(key))}</span>${esc(value)}</div>`).join('');
  const warnings = [];
  if (data.ignoredBeforeCount) warnings.push(`${data.ignoredBeforeCount} filled Before values will be ignored.`);
  if (data.skippedCount) warnings.push(`${data.skippedCount} rows for another department were skipped.`);
  if (data.calculatedRows.length) warnings.push(`${data.calculatedRows.length} Calculated rows will be recalculated.`);
  let production = '';
  const current = data.production?.current;
  if (current) {
    const both = current.bySpeed !== null && current.byCycle !== null;
    production = `<div class="preview-production"><h4>Pipe Production Rate</h4>${productionCards(current, data.classification.type === 'trial' ? 'Trial / After' : 'Normal Operation')}${both ? `<div class="rate-choice required-choice"><strong>Two valid results were found. Choose the result to adopt:</strong><label><input type="radio" name="previewOutputMethod" value="speed"/> ${current.bySpeed.toFixed(2)} kg/h — Haul-off speed</label><label><input type="radio" name="previewOutputMethod" value="cycle"/> ${current.byCycle.toFixed(2)} kg/h — Cycle / cut time</label><small>Internal difference: ${current.differencePercent}%</small></div>` : ''}</div>`;
  }
  $('#importPreviewContent').innerHTML = `<div class="detail-grid">${meta.map(([label, value]) => `<div class="detail-box"><span>${esc(label)}</span>${esc(value)}</div>`).join('')}</div>${information ? `<h4>Record Information</h4><div class="detail-grid">${information}</div>` : ''}${warnings.length ? `<div class="warning-box">${warnings.map(warning => `<p>${esc(warning)}</p>`).join('')}</div>` : ''}${production}${previewTable(data)}`;
}

function fieldLabel(key) {
  return ({ trialNo: 'Trial No.', recordDate: 'Record Date', formulaCode: 'Formula / Product Code', preparingDate: 'Preparing Date', mixingDate: 'Mixing Date', pelletizingDate: 'Pelletizing Date', extraInformation: 'Extra Information' })[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, char => char.toUpperCase());
}

function toInputDate(value) {
  if (isBlank(value)) return '';
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (match) {
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    return `${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function confirmImport() {
  if (!pendingImport) return;
  const current = pendingImport.production?.current;
  if (current && current.bySpeed !== null && current.byCycle !== null) {
    const selected = document.querySelector('input[name="previewOutputMethod"]:checked')?.value;
    if (!selected) { toast('Choose which pipe production rate you want to adopt.'); return; }
    pendingImport.production.adoptedMethod = selected;
  }

  const classification = pendingImport.classification;
  $('#recordForm').reset();
  activeImportMeta = { source: 'excel', sourceFile: pendingImport.sourceFile, sheetName: pendingImport.sheetName, baselineMode: classification.type === 'trial' ? classification.baselineMode : '', extraInformation: pendingImport.information.extraInformation || [] };
  setClassification(classification);
  const info = pendingImport.information;
  const values = {
    trialNo: info.trialNo, recordDate: toInputDate(info.recordDate) || new Date().toISOString().slice(0, 10), machine: info.machine, workers: info.workers, product: info.product,
    formulaCode: info.formulaCode, color: info.color, cavities: info.cavities, batches: info.batches, preparingDate: toInputDate(info.preparingDate), mixingDate: toInputDate(info.mixingDate), pelletizingDate: toInputDate(info.pelletizingDate),
    materialHandover: info.materialHandover, receivedByDoc: info.receivedByDoc,
    purpose: info.purpose, observations: info.observations, conclusion: info.conclusion
  };
  Object.entries(values).forEach(([id, value]) => { if ($('#' + id) && !isBlank(value)) $('#' + id).value = value; });
  activeParameters = pendingImport.parameters.map(parameter => ({ ...parameter, rowId: uid() }));
  activeProduction = pendingImport.production;
  pendingImport = null;
  $('#importPreviewDialog').close();
  renderParameterTable();
  renderProductionPanel();
  switchView('new-record');
  toast('Excel values loaded for review.');
}

function clearForm() {
  const classification = { type: $('#recordType').value || 'operating', department: $('#department').value || 'pipe', baselineMode: getBaselineMode() || 'running_with_before', trialStatus: $('#trialStatus')?.value || 'completed' };
  prepareBlankRecord(classification);
}

function adoptedProductionValue(production) {
  const current = production?.current;
  if (!current) return null;
  if (production.adoptedMethod === 'speed') return current.bySpeed;
  if (production.adoptedMethod === 'cycle') return current.byCycle;
  return current.bySpeed ?? current.byCycle;
}

function saveRecord(event) {
  event.preventDefault();
  const field = id => $('#' + id)?.value?.trim?.() || $('#' + id)?.value || '';
  const isTrial = field('recordType') === 'trial';
  const isPlanned = isTrial && field('trialStatus') === 'planned';

  if (!isPlanned && $('#department').value === 'pipe' && activeProduction?.current && activeProduction.current.bySpeed !== null && activeProduction.current.byCycle !== null && !activeProduction.adoptedMethod) {
    toast('Choose the pipe production rate to adopt before saving.');
    return;
  }

  const rawProduct = field('product');
  const rawMachine = field('machine');
  const trialNo = field('trialNo');

  const finalProduct = rawProduct || (isPlanned ? (trialNo ? `Trial ${trialNo} (Raw Materials Only)` : 'Raw Materials Batch Trial') : 'Standard Product');
  const finalMachine = rawMachine || (isPlanned ? 'Pending Execution' : 'Unassigned Line');

  const previousRecord = editingRecordId ? records.find(r => r.id === editingRecordId) : null;
  const record = {
    id: previousRecord ? previousRecord.id : uid(),
    createdAt: previousRecord ? previousRecord.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: field('recordType'),
    status: isTrial ? (field('trialStatus') || 'completed') : 'completed',
    department: field('department'),
    date: field('recordDate') || new Date().toISOString().slice(0, 10),
    trialNo: trialNo,
    machine: finalMachine,
    workers: field('workers'),
    product: finalProduct,
    formulaCode: field('formulaCode'),
    color: field('color'),
    cavities: field('cavities'),
    batches: field('batches') || '1',
    preparingDate: field('preparingDate'),
    mixingDate: field('mixingDate'),
    pelletizingDate: field('pelletizingDate'),
    materialHandover: field('materialHandover'),
    receivedByDoc: field('receivedByDoc'),
    purpose: field('purpose'),
    baselineMode: (!isPlanned && isTrial) ? getBaselineMode() : '',
    reviewStatus: previousRecord?.reviewStatus || 'pending',
    observations: field('observations'),
    conclusion: field('conclusion'),
    parameters: activeParameters.map(({ rowId, ...parameter }) => parameter),
    production: activeProduction ? { ...activeProduction, adoptedValue: adoptedProductionValue(activeProduction) } : null,
    importMeta: activeImportMeta,
    revisionOf: previousRecord?.id || null,
    revisionNumber: previousRecord ? (previousRecord.revisionNumber || 1) + 1 : 1
  };

  if (previousRecord) {
    const idx = records.findIndex(r => r.id === editingRecordId);
    if (idx >= 0) records[idx] = record;
  } else {
    records.unshift(record);
  }

  editingRecordId = null;
  toast(previousRecord ? 'Record updated and saved successfully' : 'Record saved successfully');

  save();
  void postRecordToServer(record);
  renderDashboard();
  renderMaterials();
  switchView('records');
}

function renderDashboard() {
  const total = records.length;
  const pipe = records.filter(record => record.department === 'pipe').length;
  const fittings = records.filter(record => record.department === 'fittings').length;
  const common = records.filter(record => record.department === 'common').length;
  const trials = records.filter(record => record.type === 'trial').length;
  if ($('#statTotal')) $('#statTotal').textContent = total;
  if ($('#statPipe')) $('#statPipe').textContent = pipe;
  if ($('#statFitting')) $('#statFitting').textContent = fittings;
  if ($('#statTrials')) $('#statTrials').textContent = trials;
  const percent = number => total ? Math.round(number / total * 100) : 0;
  [['pipe', pipe], ['fitting', fittings], ['common', common]].forEach(([key, number]) => {
    if ($(`#${key}Bar`)) $(`#${key}Bar`).style.width = percent(number) + '%';
    if ($(`#${key}Percent`)) $(`#${key}Percent`).textContent = percent(number) + '%';
  });
  if ($('#recentRecords')) {
    $('#recentRecords').innerHTML = records.slice(0, 5).map(record => `<div class="recent-item"><div class="dept-icon">${record.department === 'pipe' ? 'P' : record.department === 'fittings' ? 'F' : 'C'}</div><div><h4>${esc(record.product)} — ${esc(record.machine)}</h4><p>${cap(record.department)} · ${record.type === 'trial' ? (record.status === 'planned' ? 'Pending Run / Materials Only' : 'Trial') : 'Operating Conditions'}</p></div><small>${esc(record.date)}</small></div>`).join('') || '<div class="empty">No records yet.</div>';
  }
}

function getFilteredRecords() {
  const query = ($('#searchInput')?.value || '').toLowerCase();
  const department = $('#filterDepartment')?.value || 'all';
  const typeFilter = $('#filterType')?.value || 'all';

  return records.filter(record => {
    const matchesDept = (department === 'all' || record.department === department);
    let matchesType = true;
    if (typeFilter === 'operating') matchesType = record.type === 'operating';
    else if (typeFilter === 'trial') matchesType = record.type === 'trial';
    else if (typeFilter === 'trial-completed') matchesType = record.type === 'trial' && record.status !== 'planned';
    else if (typeFilter === 'trial-planned') matchesType = record.type === 'trial' && record.status === 'planned';

    const matchesSearch = [record.machine, record.product, record.formulaCode, record.purpose, record.trialNo, record.status, record.reviewStatus].join(' ').toLowerCase().includes(query);
    return matchesDept && matchesType && matchesSearch;
  });
}

function toggleRecordReview(id) {
  const record = records.find(r => r.id === id);
  if (!record) return;
  const states = ['pending', 'verified', 'flagged'];
  const currentIdx = states.indexOf(record.reviewStatus || 'pending');
  record.reviewStatus = states[(currentIdx + 1) % states.length];
  save();
  void postRecordToServer(record);
  renderRecords();
}

function renderRecords() {
  const data = getFilteredRecords();
  if (!$('#recordsTable')) return;
  $('#recordsTable').innerHTML = `<div class="data-head"><div>Date</div><div>Type</div><div style="text-align:center;">Review Audit</div><div>Product</div><div>Department</div><div>Purpose</div><div>Actions</div></div>${data.map(record => {
    let typeBadge = `<span class="badge ${record.type}">${esc(record.type)}</span>`;
    if (record.type === 'trial' && record.status === 'planned') {
      typeBadge = `<span class="badge planned">Pending Run</span>`;
    }
    const purposeText = record.purpose ? esc(record.purpose) : '<span style="color:var(--muted);">—</span>';
    const isTrial = record.type === 'trial';
    const handoverBtn = isTrial ? `<button class="icon-btn handover-record" data-id="${record.id}" title="Print Material Handover Voucher" style="color:#10b981;font-weight:bold;">Voucher</button>` : '';

    const revStatus = record.reviewStatus || 'pending';
    const statusColor = revStatus === 'verified' ? '#10b981' : (revStatus === 'flagged' ? '#ef4444' : '#f59e0b');
    const statusTitle = revStatus === 'verified' ? 'Verified (Green)' : (revStatus === 'flagged' ? 'Needs Fix / Duplicate (Red)' : 'Pending Review (Yellow)');

    const auditBadge = `<button class="review-toggle-btn" data-id="${record.id}" title="Click to toggle status: ${statusTitle}" style="background:transparent;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:12px;border:1px solid ${statusColor}44;background:${statusColor}15;">
      <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${statusColor};box-shadow:0 0 6px ${statusColor};"></span>
      <small style="color:${statusColor};font-weight:bold;font-size:10.5px;text-transform:capitalize;">${revStatus}</small>
    </button>`;

    return `<div class="data-row"><div>${esc(record.date)}</div><div>${typeBadge}</div><div style="text-align:center;">${auditBadge}</div><div title="${esc(record.product)}">${esc(record.product)}</div><div><span class="badge ${record.department}">${esc(record.department)}</span></div><div title="${esc(record.purpose || '')}" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${purposeText}</div><div class="row-actions"><button class="icon-btn view-record" data-id="${record.id}">View</button><button class="icon-btn edit-record" data-id="${record.id}" style="color:var(--accent);font-weight:bold;">Edit</button><button class="icon-btn pdf-record" data-id="${record.id}">PDF</button>${handoverBtn}<button class="icon-btn delete delete-record" data-id="${record.id}">x</button></div></div>`;
  }).join('') || '<div class="empty">No matching records.</div>'}`;

  $$('.review-toggle-btn').forEach(btn => btn.addEventListener('click', () => toggleRecordReview(btn.dataset.id)));
  $$('.view-record').forEach(button => button.addEventListener('click', () => openRecord(button.dataset.id)));
  $$('.edit-record').forEach(button => button.addEventListener('click', () => editRecord(button.dataset.id)));
  $$('.pdf-record').forEach(button => button.addEventListener('click', () => openPrintSettings(button.dataset.id)));
  $$('.handover-record').forEach(button => button.addEventListener('click', () => openVoucherSettings(button.dataset.id)));
  $$('.delete-record').forEach(button => button.addEventListener('click', () => { if (confirm('Delete this record?')) { records = records.filter(record => record.id !== button.dataset.id); save(); renderRecords(); renderDashboard(); renderMaterials(); } }));
}

function isFormulaMaterial(group = '', name = '') {
  const g = normalize(group);
  const n = normalize(name);
  if (isInformationName(name)) return false;
  if (/formula code|product code|^code$|batch|batches|cavities|total/i.test(n)) return false;
  if (g.includes('formula') || g.includes('raw material') || g.includes('additive') || g.includes('chemical')) return true;
  if (/^(pvc|caco3|calcium carbonate|stabilizer|tio2|titanium|lp551|sag12|finalux|pewax|pe wax|esbo|calcium stearate|pigment|resin|wax|lubricant|hdpe|lldpe)/i.test(n)) return true;
  return false;
}

function extractTrialMaterials() {
  const trialRecords = records.filter(record => record.type === 'trial');
  const details = [];
  const summary = {};

  trialRecords.forEach(record => {
    const batches = parseNumber(record.batches) || 1;
    const logDate = record.preparingDate || record.mixingDate || record.date || '—';
    const trialNo = record.trialNo || '—';
    const product = record.product || '—';
    const machine = record.machine || '—';
    const status = record.status === 'planned' ? 'Pending Run' : 'Executed';

    (record.parameters || []).forEach(param => {
      if (normalize(param.name) === 'total' || normalize(param.valueType) === 'calculated') return;
      if (isFormulaMaterial(param.group, param.name)) {
        const rawVal = param.after || param.value || param.before || '0';
        const numVal = parseNumber(rawVal);
        if (Number.isFinite(numVal) && numVal > 0) {
          const totalQty = round(numVal * batches, 3);
          const matName = param.name.trim();
          const unit = (param.unit || 'kg').trim();

          details.push({
            date: logDate,
            trialNo,
            product,
            machine,
            status,
            material: matName,
            unit,
            unitQty: numVal,
            batches,
            totalQty
          });

          summary[matName] ??= { name: matName, unit, totalQty: 0, count: 0 };
          summary[matName].totalQty += totalQty;
          summary[matName].count += 1;
        }
      }
    });
  });

  return { details, summary: Object.values(summary) };
}

function renderMaterials() {
  const { details, summary } = extractTrialMaterials();
  const search = ($('#materialSearchInput')?.value || '').toLowerCase();
  const filteredDetails = details.filter(item => [item.material, item.product, item.trialNo, item.date, item.machine, item.status].join(' ').toLowerCase().includes(search));

  let totalKg = 0, pvcKg = 0, caco3Kg = 0;
  summary.forEach(item => {
    totalKg += item.totalQty;
    if (/pvc/i.test(item.name)) pvcKg += item.totalQty;
    if (/caco3|calcium/i.test(item.name)) caco3Kg += item.totalQty;
  });

  const totalBatches = records.filter(r => r.type === 'trial').reduce((acc, r) => acc + (parseNumber(r.batches) || 1), 0);
  if ($('#statTrialBatches')) $('#statTrialBatches').textContent = totalBatches;
  if ($('#statTotalMaterialKg')) $('#statTotalMaterialKg').textContent = `${totalKg.toFixed(2)} kg`;
  if ($('#statTotalPvcKg')) $('#statTotalPvcKg').textContent = `${pvcKg.toFixed(2)} kg`;
  if ($('#statTotalCaco3Kg')) $('#statTotalCaco3Kg').textContent = `${caco3Kg.toFixed(2)} kg`;

  if ($('#materialsSummaryTable')) {
    $('#materialsSummaryTable').innerHTML = `<div class="data-head" style="grid-template-columns: 50px 1fr 140px 140px;"><div>#</div><div>Raw Material</div><div>Trials Count</div><div>Total Consumed</div></div>${summary.map((item, idx) => `<div class="data-row" style="grid-template-columns: 50px 1fr 140px 140px;"><div>${idx + 1}</div><div><strong>${esc(item.name)}</strong></div><div>${item.count}</div><div><span class="badge trial">${item.totalQty.toFixed(2)} ${esc(item.unit)}</span></div></div>`).join('') || '<div class="empty">No trial formulation materials recorded yet.</div>'}`;
  }

  if ($('#materialsDetailedTable')) {
    $('#materialsDetailedTable').innerHTML = `<div class="data-head" style="grid-template-columns: 45px 95px 95px 95px 1fr 1fr 85px 75px 95px;"><div>#</div><div>Date</div><div>Trial No</div><div>Status</div><div>Product</div><div>Material</div><div>Qty/Batch</div><div>Batches</div><div>Total Qty</div></div>${filteredDetails.map((item, idx) => `<div class="data-row" style="grid-template-columns: 45px 95px 95px 95px 1fr 1fr 85px 75px 95px;"><div>${idx + 1}</div><div>${esc(item.date)}</div><div><span class="badge trial">${esc(item.trialNo)}</span></div><div><small style="color:${item.status === 'Pending Run' ? '#f59e0b' : 'inherit'}">${esc(item.status)}</small></div><div>${esc(item.product)}</div><div><strong>${esc(item.material)}</strong></div><div>${item.unitQty} ${esc(item.unit)}</div><div>${item.batches}</div><div><strong>${item.totalQty.toFixed(2)} ${esc(item.unit)}</strong></div></div>`).join('') || '<div class="empty">No matching material consumption entries.</div>'}`;
  }
}

function printMaterialsReport() {
  const { details, summary } = extractTrialMaterials();
  const generatedAt = new Date().toLocaleString();
  let totalKg = summary.reduce((sum, item) => sum + item.totalQty, 0);

  const doc = `<!doctype html><html><head><meta charset="utf-8"><title>Trial Raw Materials Consumption Report</title><style>
    @page { size: A4 portrait; margin: 8mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: Arial, sans-serif; color: #142330; font-size: 9.5px; line-height: 1.25; margin: 0; padding: 0; }
    header { border-bottom: 2.5px solid #109f83; padding-bottom: 4px; margin-bottom: 8px; }
    h1 { font-size: 18px; margin: 0 0 3px; color: #109f83; }
    h2 { font-size: 11px; color: #467083; margin: 0; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 8px 0; }
    .summary-card { border: 1px solid #ccd9df; border-radius: 4px; padding: 6px 8px; background: #fafcfc; }
    .summary-card span { display: block; color: #6b8290; font-size: 7.5px; text-transform: uppercase; margin-bottom: 2px; }
    .summary-card strong { font-size: 11px; color: #142330; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; table-layout: fixed; }
    th, td { border: 1px solid #bdcdd5; padding: 4px 6px; text-align: left; vertical-align: middle; }
    th { background: #eaf3f5; font-size: 9px; font-weight: 700; color: #214352; }
    td { font-size: 8.5px; }
    .footer { margin-top: 8px; color: #738894; font-size: 7.5px; text-align: right; }
  </style></head><body>
    <header><h1>Trial Raw Materials Consumption Audit</h1><h2>Non-Inventory Trial Raw Materials Record</h2></header>
    <div class="summary-grid">
      <div class="summary-card"><span>Total Raw Materials</span><strong>${totalKg.toFixed(2)} kg</strong></div>
      <div class="summary-card"><span>Materials Types</span><strong>${summary.length} items</strong></div>
      <div class="summary-card"><span>Logged Entries</span><strong>${details.length} logs</strong></div>
      <div class="summary-card"><span>Audit Status</span><strong>Verified</strong></div>
    </div>
    <h3 style="margin:8px 0 3px;font-size:11px;color:#214352;">Consolidated Material Summary</h3>
    <table><thead><tr><th style="width:40px;">#</th><th>Raw Material</th><th style="width:100px;">Trials Count</th><th style="width:130px;">Total Consumed</th></tr></thead><tbody>
      ${summary.map((item, idx) => `<tr><td>${idx + 1}</td><td><strong>${esc(item.name)}</strong></td><td>${item.count}</td><td><strong>${item.totalQty.toFixed(2)} ${esc(item.unit)}</strong></td></tr>`).join('')}
    </tbody></table>
    <h3 style="margin:12px 0 3px;font-size:11px;color:#214352;">Detailed Consumption Log</h3>
    <table><thead><tr><th style="width:30px;">#</th><th style="width:75px;">Date</th><th style="width:75px;">Trial No</th><th style="width:75px;">Status</th><th>Product</th><th>Material</th><th style="width:65px;">Qty/Batch</th><th style="width:50px;">Batches</th><th style="width:75px;">Total Qty</th></tr></thead><tbody>
      ${details.map((item, idx) => `<tr><td>${idx + 1}</td><td>${esc(item.date)}</td><td>${esc(item.trialNo)}</td><td>${esc(item.status)}</td><td>${esc(item.product)}</td><td>${esc(item.material)}</td><td>${item.unitQty} ${esc(item.unit)}</td><td>${item.batches}</td><td><strong>${item.totalQty.toFixed(2)} ${esc(item.unit)}</strong></td></tr>`).join('')}
    </tbody></table>
    <div class="footer">Generated ${esc(generatedAt)}</div>
    <script>window.addEventListener('load', () => setTimeout(() => window.print(), 200));<\/script>
  </body></html>`;

  const reportWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!reportWindow) { toast('Allow pop-ups to print the report.'); return; }
  reportWindow.document.write(doc);
  reportWindow.document.close();
}

function importJsonFile(file) {
  const reader = new FileReader();
  reader.onload = event => {
    try {
      const data = JSON.parse(event.target.result);
      if (!Array.isArray(data)) throw new Error('Invalid JSON format: array expected.');
      let added = 0;
      for (const item of data) {
        if (!item || !item.id) continue;
        const imported = { ...item, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), revisionOf: item.id, revisionNumber: (item.revisionNumber || 1) + 1 };
        records.push(imported);
        void postRecordToServer(imported);
        added += 1;
      }
      save();
      renderDashboard();
      renderRecords();
      renderMaterials();
      toast(`Successfully imported ${added} new records.`);
    } catch (err) {
      toast('Failed to import JSON file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function recordParameterTable(record, printable = false, hideOptions = { hideFormulation: false, hiddenParams: [], hiddenMeta: [] }) {
  const trial = record.type === 'trial';
  const withBefore = trial && record.status !== 'planned' && (record.baselineMode || 'running_with_before') === 'running_with_before';
  if (!(record.parameters || []).length) return '';

  let header = '';
  if (printable) {
    header = withBefore ? '<th>Normal / Before Trial</th><th>Trial / After Trial</th>' : `<th>${trial ? 'Trial / After Trial' : 'Normal / Before Trial'}</th>`;
  } else {
    header = withBefore ? '<th>Normal / Before Trial</th><th>Trial / After Trial</th>' : `<th>${trial ? 'Trial / After Trial' : 'Normal / Before Trial'}</th>`;
  }

  const displayParameters = (record.parameters || []).filter(parameter => {
    if (printable) {
      if (hideOptions.hideFormulation && isFormulationParameter(parameter)) return false;
      if (hideOptions.hiddenParams.includes(parameter.name)) return false;
    }
    const a = String(parameter.before || '').trim();
    const b = String(parameter.after || parameter.value || '').trim();
    return a !== '' || b !== '';
  });

  if (displayParameters.length === 0) {
    return `<div class="notes-box" style="padding:4px; font-size:10px;"><p>No parameter records available.</p></div>`;
  }

  const rows = displayParameters.map(parameter => {
    let values;
    if (withBefore) {
      const beforeVal = parameter.before ? esc(parameter.before) : '<span style="color:#94a3b8;">-</span>';
      const afterVal = (parameter.after || parameter.value) ? esc(parameter.after || parameter.value) : '<span style="color:#94a3b8;">-</span>';
      values = `<td>${beforeVal}</td><td>${afterVal}</td>`;
    } else {
      const val = (trial ? (parameter.after || parameter.value) : (parameter.before || parameter.value));
      values = `<td>${val ? esc(val) : '<span style="color:#94a3b8;">-</span>'}</td>`;
    }

    const unitText = parameter.unit ? ` <span style="color:#64748b; font-weight:normal;">(${esc(parameter.unit)})</span>` : '';
    const fullName = `${esc(parameter.name)}${unitText}`;

    if (printable) {
      return `<tr><td>${esc(parameter.group || '')}</td><td>${fullName}</td>${values}</tr>`;
    } else {
      return `<tr><td>${esc(parameter.group || '')}</td><td>${esc(parameter.name)}</td><td>${esc(parameter.unit || '')}</td>${values}</tr>`;
    }
  }).join('');

  const theadHTML = printable 
    ? (withBefore ? `<tr><th style="width:25%;">Group</th><th style="width:45%;">Parameter</th><th style="width:15%;">Normal / Before</th><th style="width:15%;">Trial / After</th></tr>` : `<tr><th style="width:30%;">Group</th><th style="width:50%;">Parameter</th><th style="width:20%;">${trial ? 'Trial / After Trial' : 'Normal / Before Trial'}</th></tr>`)
    : `<tr><th>Group</th><th>Parameter</th><th>Unit</th>${header}</tr>`;

  return `<table class="${printable ? 'print-table' : 'detail-table'}"><thead>${theadHTML}</thead><tbody>${rows}</tbody></table>`;
}

function isFormulationParameter(parameter) {
  return normalize(parameter.group).includes('formul') || isFormulaMaterial(parameter.group, parameter.name);
}

function reportParameterSection(record, title, predicate, hideOptions) {
  const parameters = (record.parameters || []).filter(predicate);
  if (!parameters.length) return '';
  return `<section class="print-section"><h3>${esc(title)}</h3>${recordParameterTable({ ...record, parameters }, true, hideOptions)}</section>`;
}

function reportParameterSections(record, hideOptions) {
  const isFormulation = parameter => isFormulationParameter(parameter);
  const isTemperature = parameter => {
    const text = normalize((parameter.group || '') + ' ' + (parameter.name || ''));
    if (/cooling|filling|cycle|refill|time|speed|rpm|pressure|cushion|shot/.test(text)) return false;
    return /temperatures?|heating|barrel|die|adapter|nozzle|temp/.test(text);
  };
  const isTrialResult = parameter => /result|outcome|quality|defect|observation|findings|report/.test(normalize((parameter.group || '') + ' ' + (parameter.name || '')));
  const isOperating = parameter => !isFormulation(parameter) && !isTemperature(parameter) && !isTrialResult(parameter);
  
  return [
    reportParameterSection(record, 'Formulation', isFormulation, hideOptions),
    reportParameterSection(record, 'Operating Parameters', isOperating, hideOptions),
    reportParameterSection(record, 'Temperatures', isTemperature, hideOptions),
    reportParameterSection(record, 'Trial Results', isTrialResult, hideOptions)
  ].join('');
}

function recordMeta(record) {
  const trial = record.type === 'trial';
  const isPlanned = trial && record.status === 'planned';
  const items = [
    ['Type', trial ? (isPlanned ? 'Planned Trial' : (record.baselineMode === 'running_with_before' || !record.baselineMode ? 'Trial / Before & After' : 'Trial / Single Run')) : 'Operating Conditions'],
    ['Status', trial ? (isPlanned ? 'Pending Run' : 'Completed') : 'Active'],
    ['Department', cap(record.department)], ['Date', record.date], ['Trial No.', record.trialNo], ['Machine / Line', record.machine], ['Workers', record.workers], ['Product', record.product], ['Formula Code', record.formulaCode], ['Color', record.color], ['Cavities', record.cavities], ['Batches', record.batches], ['Prep Date', record.preparingDate], ['Mix Date', record.mixingDate], ['Pellet Date', record.pelletizingDate],
    ['Material Handover', record.materialHandover], ['Received By / Doc No', record.receivedByDoc]
  ];
  if (trial && !isPlanned) items.splice(2, 0, ['Before Status', baselineLabels[record.baselineMode || 'running_with_before']]);
  return items.filter(([, value]) => !isBlank(value));
}

function productionHtml(record, printable = false) {
  const production = record.production;
  if (!production?.current) return '';
  const current = production.current;
  const adopted = production.adoptedValue ?? (production.adoptedMethod === 'cycle' ? current.byCycle : production.adoptedMethod === 'speed' ? current.bySpeed : (current.bySpeed ?? current.byCycle));
  return `<div class="${printable ? 'print-production' : 'production-report'}"><h4>Pipe Production Rate</h4>${production.before ? `<p><b>Normal / Before:</b> ${production.before.bySpeed !== null ? `By speed ${production.before.bySpeed.toFixed(2)} kg/h` : ''}${production.before.bySpeed !== null && production.before.byCycle !== null ? ' - ' : ''}${production.before.byCycle !== null ? `By cycle ${production.before.byCycle.toFixed(2)} kg/h` : ''}</p>` : ''}<p><b>${record.type === 'trial' ? 'Trial / After' : 'Normal Operation'}:</b> ${current.bySpeed !== null ? `By speed ${current.bySpeed.toFixed(2)} kg/h` : ''}${current.bySpeed !== null && current.byCycle !== null ? ' - ' : ''}${current.byCycle !== null ? `By cycle ${current.byCycle.toFixed(2)} kg/h` : ''}</p><p><b>Adopted:</b> ${Number(adopted).toFixed(2)} kg/h - ${production.adoptedMethod === 'cycle' ? 'Cycle / cut time' : 'Haul-off speed'}</p></div>`;
}

function reportPurposeLabel(record) {
  return record.type === 'trial' ? 'Trial Purpose' : 'Purpose';
}

function buildPrintDocument(record, hideOptions = { hideFormulation: false, hiddenParams: [], hiddenMeta: [] }) {
  const meta = recordMeta(record).filter(([label]) => !hideOptions.hiddenMeta.includes(label));
  const purposeLabel = reportPurposeLabel(record);
  const generatedAt = new Date().toLocaleString();

  const showPurpose = !hideOptions.hiddenMeta.includes('Purpose') && Boolean(record.purpose);
  const showObservations = !hideOptions.hiddenMeta.includes('Observations');
  const showConclusion = !hideOptions.hiddenMeta.includes('Conclusion');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(record.product)} Report</title><style>
    @page { size: A4 portrait; margin: 8mm 12mm 6mm 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; -webkit-font-smoothing: antialiased; }
    html, body { margin: 0; padding: 0; background: #fff; font-family: "Segoe UI", Arial, sans-serif; color: #0f172a; font-size: 9.5px; line-height: 1.2; }
    
    .report-root { width: 100%; display: flex; flex-direction: column; justify-content: space-between; }
    .content-wrap { width: 100%; }
    
    header { background: linear-gradient(135deg, #1e3a8a, #2563eb); color: #fff; padding: 7px 12px; border-radius: 4px; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; }
    h1 { font-size: 14.5px; line-height: 1.1; margin: 0; font-weight: 700; }
    h2 { font-size: 11px; color: #bfdbfe; margin: 0; font-weight: 600; }
    
    .print-purpose { display: ${showPurpose ? 'grid' : 'none'}; grid-template-columns: 120px 1fr; gap: 8px; align-items: center; border: 1px solid #bfdbfe; border-left: 4px solid #2563eb; border-radius: 4px; padding: 4px 8px; margin: 3px 0 4px; background: #eff6ff; }
    .print-purpose span { font-size: 8.5px; font-weight: 700; color: #1e40af; text-transform: uppercase; }
    .print-purpose strong { font-size: 10px; color: #0f172a; }
    
    .print-meta { display: grid; grid-template-columns: repeat(6, 1fr); gap: 3px; margin: 3px 0 4px; }
    .print-meta div { border: 1px solid #cbd5e1; border-radius: 3px; padding: 3px 5px; background: #f8fafc; }
    .print-meta span { display: block; color: #64748b; font-size: 7.5px; text-transform: uppercase; font-weight: 700; line-height: 1; margin-bottom: 1px; }
    .print-meta div strong { font-size: 9px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
    
    .print-section { margin-top: 4px; break-inside: avoid; }
    .print-section h3 { margin: 4px 0 2px; padding: 3px 6px; border-left: 3px solid #2563eb; background: #f1f5f9; color: #1e40af; font-size: 9.5px; text-transform: uppercase; font-weight: 700; }
    
    .print-table { width: 100%; border-collapse: collapse; margin-top: 1px; table-layout: fixed; font-size: 9px; }
    .print-table th, .print-table td { border: 1px solid #cbd5e1; padding: 3px 6px; text-align: left; vertical-align: middle; line-height: 1.15; }
    .print-table th { background: #e2e8f0; font-size: 8.5px; font-weight: 700; color: #1e293b; text-transform: uppercase; padding: 3.5px 6px; }
    
    .print-production { border: 1px solid #cbd5e1; border-left: 4px solid #2563eb; border-radius: 3px; padding: 3px 6px; margin: 3px 0; background: #f8fafc; font-size: 9px; }
    .print-production h4 { margin: 0 0 2px; font-size: 9.5px; color: #1e40af; }
    .print-production p { margin: 1px 0; }
    
    .print-notes { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 4px; break-inside: avoid; }
    .print-note { border: 1px solid #cbd5e1; border-left: 4px solid #2563eb; border-radius: 3px; padding: 4px 6px; min-height: 32px; background: #f8fafc; }
    .print-note h4 { margin: 0 0 2px; font-size: 8.5px; color: #1e40af; text-transform: uppercase; font-weight: 700; }
    .print-note p { margin: 0; white-space: pre-wrap; line-height: 1.15; font-size: 8.5px; color: #0f172a; }
    
    .footer { margin-top: 4px; color: #94a3b8; font-size: 7.5px; text-align: right; font-weight: 600; break-inside: avoid; }
  </style></head><body>
    <main id="reportRoot" class="report-root">
      <div class="content-wrap">
        <header>
          <h1>Process Conditions &amp; Trial Report</h1>
          <h2>${esc(record.product)} — ${esc(record.machine)}</h2>
        </header>
        <section class="print-purpose">
          <span>${esc(purposeLabel)}</span>
          <strong>${esc(record.purpose || 'Not specified')}</strong>
        </section>
        <div class="print-meta">
          ${meta.map(([label, value]) => `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}
        </div>
        ${productionHtml(record, true)}
        ${reportParameterSections(record, hideOptions)}
        <section class="print-notes" style="display: ${(showObservations || showConclusion) ? 'grid' : 'none'};">
          <div class="print-note" style="display: ${showObservations ? 'block' : 'none'};">
            <h4>Observations</h4>
            <p>${esc(record.observations || '-')}</p>
          </div>
          <div class="print-note" style="display: ${showConclusion ? 'block' : 'none'};">
            <h4>Conclusion / Recommendation</h4>
            <p>${esc(record.conclusion || '-')}</p>
          </div>
        </section>
      </div>
      <div class="footer">Generated ${esc(generatedAt)}</div>
    </main>
    <script>
      window.addEventListener('load', () => setTimeout(() => window.print(), 200));
    <\/script>
  </body></html>`;
}

function printRecord(id, hideOptions = { hideFormulation: false, hiddenParams: [], hiddenMeta: [] }) {
  const record = records.find(item => item.id === id);
  if (!record) return;
  const reportWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!reportWindow) { toast('Allow pop-ups to create the PDF report.'); return; }
  reportWindow.document.write(buildPrintDocument(record, hideOptions));
  reportWindow.document.close();
}

function renderLibrary() {
  if (!$('#libraryList')) return;
  $('#libraryList').innerHTML = library.map(parameter => `<div class="library-item"><strong>${esc(parameter.name)}</strong><small>${esc(parameter.unit || 'No unit')}</small><span class="badge ${parameter.department}">${esc(parameter.department)}</span><button class="icon-btn delete lib-delete" data-id="${parameter.id}">x</button></div>`).join('');
  $$('.lib-delete').forEach(button => button.addEventListener('click', () => { if (confirm('Delete this parameter?')) { library = library.filter(parameter => parameter.id !== button.dataset.id); saveLibrary(); renderLibrary(); renderPicker(); } }));
}

$$('.nav-btn').forEach(button => button.addEventListener('click', () => button.dataset.view === 'new-record' ? openNewRecordWizard() : switchView(button.dataset.view)));
$$('[data-go]').forEach(button => button.addEventListener('click', () => switchView(button.dataset.go)));
$('#quickNewBtn')?.addEventListener('click', () => openNewRecordWizard());
$('#themeToggle')?.addEventListener('click', () => applyTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark'));
$('#closeWizard')?.addEventListener('click', () => $('#newRecordWizard').close());
$('#wizardBack')?.addEventListener('click', wizardBack);
$('#wizardContent')?.addEventListener('click', event => { const choice = event.target.closest('[data-choice]'); if (choice) handleWizardChoice(choice.dataset.choice); });
$('#addParameterBtn')?.addEventListener('click', () => { addParameter(library.find(parameter => parameter.id === $('#parameterPicker').value)); renderParameterTable(); });
$('#loadTemplateBtn')?.addEventListener('click', () => loadTemplate(true));
$('#addCustomBtn')?.addEventListener('click', () => { const name = prompt('Custom parameter name:'); if (!name) return; const unit = prompt('Unit (optional):') || ''; activeParameters.push({ rowId: uid(), libraryId: null, name, unit, group: 'Custom', valueType: 'Comparison', scope: $('#department').value, before: '', after: '', value: '' }); renderParameterTable(); });
$('#importExcelBtn')?.addEventListener('click', () => { wizard = { step: 'source', type: $('#recordType').value, department: $('#department').value, baselineMode: getBaselineMode() || 'running_with_before', trialStatus: $('#trialStatus')?.value || 'completed' }; $('#excelFileInput').value = ''; $('#excelFileInput').click(); });
$('#excelFileInput')?.addEventListener('change', event => { const file = event.target.files?.[0]; if (file) readExcelFile(file); });
$('#closeImportPreview')?.addEventListener('click', () => $('#importPreviewDialog').close());
$('#cancelImportBtn')?.addEventListener('click', () => { pendingImport = null; $('#importPreviewDialog').close(); });
$('#confirmImportBtn')?.addEventListener('click', confirmImport);
$('#recordType')?.addEventListener('change', () => {
  if ($('#recordType').value === 'trial' && !wizard.baselineMode) wizard.baselineMode = 'running_with_before';
  activeImportMeta = { ...(activeImportMeta || {}), baselineMode: $('#recordType').value === 'trial' ? wizard.baselineMode : '' };
  renderModeSummary();
  refreshCalculations();
});
$('#trialStatus')?.addEventListener('change', () => {
  wizard.trialStatus = $('#trialStatus').value;
  renderModeSummary();
  loadTemplate(false);
});
$('#department')?.addEventListener('change', () => { wizard.department = $('#department').value; loadTemplate(false); renderModeSummary(); refreshCalculations(); });
$('#clearFormBtn')?.addEventListener('click', clearForm);
$('#recordForm')?.addEventListener('submit', saveRecord);
$('#saveAllRecordsBtn')?.addEventListener('click', saveAllRecordsToServer);
['searchInput', 'filterDepartment', 'filterType'].forEach(id => $('#' + id)?.addEventListener('input', renderRecords));
$('#materialSearchInput')?.addEventListener('input', renderMaterials);
$('#printMaterialsBtn')?.addEventListener('click', printMaterialsReport);
$('#closeDialog')?.addEventListener('click', () => $('#recordDialog').close());
$('#dialogPdfBtn')?.addEventListener('click', () => openPrintSettings(selectedRecordId));
$('#exportBtn')?.addEventListener('click', () => { const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `process-control-records-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href); });
$('#importJsonBtn')?.addEventListener('click', () => { $('#jsonFileInput').value = ''; $('#jsonFileInput').click(); });
$('#jsonFileInput')?.addEventListener('change', event => { const file = event.target.files?.[0]; if (file) importJsonFile(file); });
$('#parameterLibraryForm')?.addEventListener('submit', event => { event.preventDefault(); library.push({ id: uid(), name: $('#libraryName').value.trim(), unit: $('#libraryUnit').value.trim(), department: $('#libraryDepartment').value, group: 'Custom' }); saveLibrary(); event.target.reset(); renderLibrary(); renderPicker(); toast('Parameter added'); });

applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
fetchServerRecords();
if ($('#recordDate')) $('#recordDate').value = new Date().toISOString().slice(0, 10);
activeImportMeta = { source: 'manual', baselineMode: '' };
setClassification({ type: 'operating', department: 'pipe', baselineMode: 'running_with_before', trialStatus: 'completed' });
loadTemplate(false);
renderProductionPanel();
renderDashboard();

window.__processControlTest = { parseExcelWorkbook, calculatePipeOutput, difference, normalizeScope };

let currentPrintRecordId = null;
let currentVoucherRecordId = null;

function openPrintSettings(id) {
  const record = records.find(item => item.id === id);
  if (!record) return;
  currentPrintRecordId = id;
  currentVoucherRecordId = null;

  const metaItems = recordMeta(record);
  const parameters = record.parameters || [];
  const hasFormulation = parameters.some(isFormulationParameter);
  const otherParams = parameters.filter(p => !isFormulationParameter(p));

  let html = '<div style="display:grid; gap:12px;">';

  html += '<div style="background:var(--panel2); border:1px solid var(--line); border-radius:10px; padding:12px;">';
  html += '<strong style="display:block; color:var(--accent); font-size:12px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Header &amp; Information Fields</strong>';
  html += '<div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px;">';

  metaItems.forEach(([label, value]) => {
    html += `<label style="display:flex; gap:10px; align-items:center; cursor:pointer;">
               <input type="checkbox" class="hide-meta-cb" value="${esc(label)}" style="width:16px; height:16px; accent-color:var(--accent); cursor:pointer;">
               <span style="font-size:12px; color:var(--text);">${esc(label)}: <strong style="color:var(--muted);">${esc(value)}</strong></span>
             </label>`;
  });

  ['Purpose', 'Observations', 'Conclusion'].forEach(item => {
    html += `<label style="display:flex; gap:10px; align-items:center; cursor:pointer;">
               <input type="checkbox" class="hide-meta-cb" value="${esc(item)}" style="width:16px; height:16px; accent-color:var(--accent); cursor:pointer;">
               <span style="font-size:12px; color:var(--text);">${esc(item)} Box</span>
             </label>`;
  });

  html += '</div></div>';

  html += '<div style="background:var(--panel2); border:1px solid var(--line); border-radius:10px; padding:12px;">';
  html += '<strong style="display:block; color:var(--accent); font-size:12px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Parameters &amp; Sections</strong>';
  html += '<div style="display:grid; gap:8px;">';

  if (hasFormulation) {
    html += `<label style="display:flex; gap:12px; align-items:center; padding:10px; background:var(--panel); border:1px solid var(--line); border-radius:8px; cursor:pointer;">
               <input type="checkbox" id="hideFormulationCb" value="formulation" style="width:18px; height:18px; accent-color:var(--accent); cursor:pointer;">
               <div><strong style="display:block; color:var(--text); font-size:12.5px;">Entire Formulation Section</strong><small style="color:var(--muted); font-size:11px;">Hides all raw materials and total weight</small></div>
             </label>`;
  }

  otherParams.forEach(p => {
    html += `<label style="display:flex; gap:12px; align-items:center; padding:10px; background:var(--panel); border:1px solid var(--line); border-radius:8px; cursor:pointer;">
               <input type="checkbox" class="hide-param-cb" value="${esc(p.name)}" style="width:18px; height:18px; accent-color:var(--accent); cursor:pointer;">
               <div><strong style="display:block; color:var(--text); font-size:12.5px;">${esc(p.name)} ${p.unit ? '(' + p.unit + ')' : ''}</strong><small style="color:var(--muted); font-size:11px;">${esc(p.group)}</small></div>
             </label>`;
  });

  html += '</div></div></div>';

  const content = document.querySelector('#printSettingsContent');
  const dialog = document.querySelector('#printSettingsDialog');
  if (!content || !dialog) { toast('PDF settings dialog is unavailable.'); return; }
  content.innerHTML = html || '<div class="empty">No specific items to hide for this record.</div>';
  dialog.showModal();
}

function openVoucherSettings(id) {
  const record = records.find(item => item.id === id);
  if (!record) return;
  currentVoucherRecordId = id;
  currentPrintRecordId = null;

  const rawMaterials = (record.parameters || []).filter(p => {
    const grp = normalize(p.group || '');
    return grp.includes('raw') || grp.includes('material') || grp.includes('formulation') || grp.includes('recipe') || isFormulaMaterial(p.group, p.name);
  });

  let html = '<div style="display:grid; gap:12px;">';
  html += '<div style="background:var(--panel2); border:1px solid var(--line); border-radius:10px; padding:12px;">';
  html += '<strong style="display:block; color:var(--accent); font-size:12px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Header &amp; Information Fields to Hide</strong>';
  html += '<div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px;">';

  ['Purpose', 'Formula Code', 'Handover Status', 'Received By / Doc No', 'Batches Count'].forEach(item => {
    html += `<label style="display:flex; gap:10px; align-items:center; cursor:pointer;">
               <input type="checkbox" class="hide-meta-cb" value="${esc(item)}" style="width:16px; height:16px; accent-color:var(--accent); cursor:pointer;">
               <span style="font-size:12px; color:var(--text);">${esc(item)}</span>
             </label>`;
  });

  html += '</div></div>';

  html += '<div style="background:var(--panel2); border:1px solid var(--line); border-radius:10px; padding:12px;">';
  html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">';
  html += '<strong style="color:var(--accent); font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Raw Materials Formulation Privacy</strong>';
  html += '<button type="button" id="hideAllMatBtn" class="text-btn" style="color:#ef4444; font-size:11px; font-weight:bold;">Select All Ingredients (Keep Total Only)</button>';
  html += '</div>';

  html += '<div style="display:grid; gap:8px;">';

  html += `<label style="display:flex; gap:12px; align-items:center; padding:10px; background:var(--panel); border:1px solid var(--line); border-radius:8px; cursor:pointer;">
             <input type="checkbox" class="hide-meta-cb" value="Total Weight Row" style="width:18px; height:18px; accent-color:var(--accent); cursor:pointer;">
             <div><strong style="display:block; color:var(--text); font-size:12.5px;">Total Weight (kg) Summary Row</strong><small style="color:var(--muted); font-size:11px;">Check only if you want to hide the total calculated weight</small></div>
           </label>`;

  rawMaterials.forEach(m => {
    const matName = m.name || m.parameter;
    html += `<label style="display:flex; gap:12px; align-items:center; padding:8px 10px; background:var(--panel); border:1px solid var(--line); border-radius:8px; cursor:pointer;">
               <input type="checkbox" class="hide-param-cb voucher-mat-cb" value="${esc(matName)}" style="width:18px; height:18px; accent-color:var(--accent); cursor:pointer;">
               <div><strong style="display:block; color:var(--text); font-size:12.5px;">${esc(matName)}</strong></div>
             </label>`;
  });

  html += '</div></div></div>';

  const content = document.querySelector('#printSettingsContent');
  const dialog = document.querySelector('#printSettingsDialog');
  if (!content || !dialog) { toast('Settings dialog is unavailable.'); return; }
  content.innerHTML = html;

  $('#hideAllMatBtn')?.addEventListener('click', () => {
    const cbs = $$('.voucher-mat-cb');
    const allChecked = cbs.every(cb => cb.checked);
    cbs.forEach(cb => cb.checked = !allChecked);
    $('#hideAllMatBtn').textContent = allChecked ? 'Select All Ingredients (Keep Total Only)' : 'Unselect All Ingredients';
  });

  dialog.showModal();
}

document.addEventListener('click', e => {
  if (e.target.closest('#closePrintSettings')) {
    document.querySelector('#printSettingsDialog')?.close();
  }
  if (e.target.closest('#cancelPrintBtn')) {
    document.querySelector('#printSettingsDialog')?.close();
    if (currentVoucherRecordId) {
      printHandoverVoucher(currentVoucherRecordId);
    } else if (currentPrintRecordId) {
      printRecord(currentPrintRecordId);
    }
  }
});

document.addEventListener('click', e => {
  const btn = e.target.closest('#confirmPrintBtn');
  if (btn) {
    const hideFormulation = document.querySelector('#hideFormulationCb')?.checked || false;
    const hiddenParams = Array.from(document.querySelectorAll('.hide-param-cb:checked')).map(cb => cb.value);
    const hiddenMeta = Array.from(document.querySelectorAll('.hide-meta-cb:checked')).map(cb => cb.value);
    document.querySelector('#printSettingsDialog')?.close();
    
    if (currentVoucherRecordId) {
      printHandoverVoucher(currentVoucherRecordId, { hiddenParams, hiddenMeta });
    } else if (currentPrintRecordId) {
      printRecord(currentPrintRecordId, { hideFormulation, hiddenParams, hiddenMeta });
    }
  }
});

function printHandoverVoucher(id, hideOptions = { hiddenParams: [], hiddenMeta: [] }) {
  const record = records.find(item => item.id === id);
  if (!record) return;

  const allRawMaterials = (record.parameters || []).filter(p => {
    const grp = normalize(p.group || '');
    return grp.includes('raw') || grp.includes('material') || grp.includes('formulation') || grp.includes('recipe') || isFormulaMaterial(p.group, p.name);
  });

  const batches = Number(record.batches) || 1;

  let totalBatchWeight = 0;
  allRawMaterials.forEach(m => {
    const val = parseFloat(m.afterTrial || m.normal || m.value || m.before || '0');
    if (!isNaN(val)) totalBatchWeight += val;
  });
  const grandTotalIssuedWeight = (totalBatchWeight * batches).toFixed(2);

  const rawMaterials = allRawMaterials.filter(p => !hideOptions.hiddenParams.includes(p.name || p.parameter));
  const showTotalRow = !hideOptions.hiddenMeta.includes('Total Weight Row');

  let materialsRows = '';
  if (rawMaterials.length > 0) {
    materialsRows = rawMaterials.map(m => {
      const valPerBatch = m.afterTrial || m.normal || m.value || m.before || '—';
      const numVal = parseFloat(valPerBatch);
      const totalVal = !isNaN(numVal) ? (numVal * batches).toFixed(2) : '—';
      return `<tr>
        <td style="padding:7px 10px;border:1px solid #cbd5e1;">${esc(m.name || m.parameter)}</td>
        <td style="padding:7px 10px;border:1px solid #cbd5e1;text-align:center;">${esc(valPerBatch)}</td>
        <td style="padding:7px 10px;border:1px solid #cbd5e1;text-align:center;">${batches}</td>
        <td style="padding:7px 10px;border:1px solid #cbd5e1;text-align:center;font-weight:bold;">${totalVal}</td>
      </tr>`;
    }).join('');
  }

  if (showTotalRow) {
    materialsRows += `
      <tr style="background:#f1f5f9;font-weight:bold;">
        <td style="padding:8px 10px;border:1.5px solid #0f172a;text-transform:uppercase;color:#0f172a;">Total Compound / Batch Weight (kg)</td>
        <td style="padding:8px 10px;border:1.5px solid #0f172a;text-align:center;color:#0f172a;">${totalBatchWeight.toFixed(2)}</td>
        <td style="padding:8px 10px;border:1.5px solid #0f172a;text-align:center;color:#0f172a;">${batches}</td>
        <td style="padding:8px 10px;border:1.5px solid #0f172a;text-align:center;font-size:13.5px;color:#0284c7;background:#e0f2fe;">${grandTotalIssuedWeight} kg</td>
      </tr>
    `;
  }

  if (!materialsRows) {
    materialsRows = `<tr><td colspan="4" style="padding:14px;text-align:center;color:#64748b;border:1px solid #cbd5e1;">No formulation items selected for display.</td></tr>`;
  }

  const showPurpose = !hideOptions.hiddenMeta.includes('Purpose');
  const showFormula = !hideOptions.hiddenMeta.includes('Formula Code');
  const showStatus = !hideOptions.hiddenMeta.includes('Handover Status');
  const showReceived = !hideOptions.hiddenMeta.includes('Received By / Doc No');
  const showBatches = !hideOptions.hiddenMeta.includes('Batches Count');

  const voucherHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Material Handover Voucher - Trial ${esc(record.trialNo || record.id)}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #0f172a; margin: 20px; line-height: 1.4; }
        .header-box { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-end; }
        .title { font-size: 18px; font-weight: bold; text-transform: uppercase; }
        .doc-meta { font-size: 12px; color: #475569; text-align: right; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; font-size: 13px; }
        .meta-card { background: #f8fafc; padding: 10px; border: 1px solid #e2e8f0; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
        th { background: #0f172a; color: white; padding: 8px; border: 1px solid #0f172a; text-align: center; }
        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 35px; }
        .sign-box { border-top: 1.5px solid #0f172a; padding-top: 8px; text-align: center; font-size: 13px; font-weight: bold; }
        .sign-line { margin-top: 40px; }
        @media print { body { margin: 10mm; } }
      </style>
    </head>
    <body>
      <div class="header-box">
        <div>
          <div class="title">Material Handover &amp; Receipt Voucher</div>
          <div style="font-size: 12px; color: #64748b;">Process Control &amp; Raw Materials Section</div>
        </div>
        <div class="doc-meta">
          <div><strong>Date:</strong> ${esc(record.date)}</div>
          <div><strong>Trial No:</strong> ${esc(record.trialNo || 'N/A')}</div>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-card">
          <div><strong>Product / Application:</strong> ${esc(record.product)} (${esc(record.department)})</div>
          ${showPurpose ? `<div><strong>Purpose:</strong> ${esc(record.purpose || 'Trial Batch')}</div>` : ''}
          ${showFormula ? `<div><strong>Formula Code:</strong> ${esc(record.formulaCode || 'N/A')}</div>` : ''}
        </div>
        <div class="meta-card">
          ${showStatus ? `<div><strong>Handover Status:</strong> <span style="color:#0369a1;font-weight:bold;">${esc(record.materialHandover || 'Delivered to Production')}</span></div>` : ''}
          ${showReceived ? `<div><strong>Received By / Doc No:</strong> <span style="font-weight:bold;">${esc(record.receivedByDoc || 'N/A')}</span></div>` : ''}
          ${showBatches ? `<div><strong>Batches Count:</strong> ${batches}</div>` : ''}
        </div>
      </div>

      <div style="font-weight: bold; margin-bottom: 6px; font-size: 13px;">Raw Materials Issued for Trial:</div>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Material / Ingredient</th>
            <th>Per Batch Quantity (kg)</th>
            <th>Batches</th>
            <th>Total Issued Quantity (kg)</th>
          </tr>
        </thead>
        <tbody>
          ${materialsRows}
        </tbody>
      </table>

      <div class="signatures">
        <div class="sign-box">
          Issued &amp; Prepared By (Raw Materials Dept.)
          <div class="sign-line">Signature: ______________________</div>
        </div>
        <div class="sign-box">
          Received By (Production / Warehouse / Costing Dept.)
          <div class="sign-line">Signature: ______________________</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(voucherHtml);
    printWindow.document.close();
  }
}