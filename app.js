// Application State & Core Logic
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

let records = JSON.parse(localStorage.getItem('plastic_factory_records')) || [];
let parametersLibrary = JSON.parse(localStorage.getItem('plastic_factory_params')) || [
    { name: 'Zone 1 Temperature', unit: '°C', department: 'pipe' },
    { name: 'Screw Speed', unit: 'RPM', department: 'pipe' },
    { name: 'Main Drive Current', unit: 'A', department: 'common' },
    { name: 'Melt Temperature', unit: '°C', department: 'common' },
    { name: 'Line Speed', unit: 'm/min', department: 'pipe' },
    { name: 'Injection Pressure', unit: 'bar', department: 'fittings' }
];

let activeRecordForPdf = null;

function initApp() {
    setupNavigation();
    setupThemeToggle();
    setupFormHandlers();
    setupRecordsView();
    setupMaterialsView();
    setupLibraryView();
    setupPdfExportHandlers();
    renderDashboard();
}

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetView = btn.getAttribute('data-view');
            switchView(targetView);
        });
    });

    document.querySelectorAll('[data-go]').forEach(el => {
        el.addEventListener('click', () => {
            switchView(el.getAttribute('data-go'));
        });
    });

    document.getElementById('quickNewBtn').addEventListener('click', () => {
        switchView('new-record');
    });
}

function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const targetView = document.getElementById(`${viewName}View`);
    const targetBtn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);

    if (targetView) targetView.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');

    const titles = {
        dashboard: 'Dashboard',
        'new-record': 'New Record',
        records: 'Records Database',
        materials: 'Trial Materials Audit',
        settings: 'Parameter Library'
    };
    document.getElementById('pageTitle').textContent = titles[viewName] || 'System Workspace';
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    const savedTheme = localStorage.getItem('plastic_factory_theme') || 'dark';
    body.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '☀ Light' : '☾ Dark';

    themeToggle.addEventListener('click', () => {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('plastic_factory_theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '☀ Light' : '☾ Dark';
    });
}

function renderDashboard() {
    document.getElementById('statTotal').textContent = records.length;
    const pipeCount = records.filter(r => r.department === 'pipe').length;
    const fittingCount = records.filter(r => r.department === 'fittings').length;
    const trialCount = records.filter(r => r.type === 'trial').length;

    document.getElementById('statPipe').textContent = pipeCount;
    document.getElementById('statFitting').textContent = fittingCount;
    document.getElementById('statTrials').textContent = trialCount;

    const total = records.length || 1;
    const pipePct = Math.round((pipeCount / total) * 100);
    const fittingPct = Math.round((fittingCount / total) * 100);
    const commonPct = Math.max(0, 100 - pipePct - fittingPct);

    document.getElementById('pipeBar').style.width = `${pipePct}%`;
    document.getElementById('pipePercent<b>').textContent = `${pipePct}%`; // handled safely
    document.getElementById('fittingBar').style.width = `${fittingPct}%`;
    document.getElementById('commonBar').style.width = `${commonPct}%`;

    renderRecentActivity();
}

function renderRecentActivity() {
    const container = document.getElementById('recentRecords');
    if (!records.length) {
        container.innerHTML = '<div class="empty">No records found yet. Create your first record!</div>';
        return;
    }

    const recent = [...records].reverse().slice(0, 5);
    container.innerHTML = recent.map(r => `
        <div class="recent-item">
            <div class="dept-icon">📌</div>
            <div>
                <h4>${r.product || 'Unnamed Product'} (${r.machine || 'General Line'})</h4>
                <p>${r.purpose || 'Operating conditions record'}</p>
                <small>${r.date} | Type: ${r.type}</small>
            </div>
            <span class="badge ${r.department}">${r.department}</span>
        </div>
    `).join('');
}

function setupFormHandlers() {
    const form = document.getElementById('recordForm');
    const paramPicker = document.getElementById('parameterPicker');

    function populatePicker() {
        paramPicker.innerHTML = '<option value="">Select standard parameter...</option>' +
            parametersLibrary.map(p => `<option value="${p.name}" data-unit="${p.unit || ''}">${p.name} (${p.unit || 'custom'})</option>`).join('');
    }
    populatePicker();

    document.getElementById('addParameterBtn').addEventListener('click', () => {
        const val = paramPicker.value;
        if (!val) return;
        const selectedOpt = paramPicker.options[paramPicker.selectedIndex];
        const unit = selectedOpt.getAttribute('data-unit') || '';
        addParamRow(val, unit, false);
    });

    document.getElementById('addCustomBtn').addEventListener('click', () => {
        const name = prompt('Enter custom parameter name:');
        if (!name) return;
        const unit = prompt('Enter unit (e.g. °C, bar, kg):') || '';
        addParamRow(name, unit, false);
    });

    document.getElementById('loadTemplateBtn').addEventListener('click', () => {
        const table = document.getElementById('parameterTable');
        table.innerHTML = '';
        parametersLibrary.slice(0, 4).forEach(p => addParamRow(p.name, p.unit, false));
        showToast('Standard template loaded successfully');
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const rows = document.querySelectorAll('.param-row');
        const parameters = Array.from(rows).map(row => ({
            name: row.querySelector('.p-name').value,
            unit: row.querySelector('.p-unit').value,
            value: row.querySelector('.p-val').value,
            isMaterial: row.getAttribute('data-material') === 'true'
        }));

        const newRecord = {
            id: 'REC-' + Date.now(),
            type: document.getElementById('recordType').value,
            department: document.getElementById('department').value,
            date: document.getElementById('recordDate').value,
            machine: document.getElementById('machine').value,
            product: document.getElementById('product').value,
            formulaCode: document.getElementById('formulaCode').value,
            purpose: document.getElementById('purpose').value,
            observations: document.getElementById('observations').value,
            conclusion: document.getElementById('conclusion').value,
            parameters: parameters
        };

        records.push(newRecord);
        localStorage.setItem('plastic_factory_records', JSON.stringify(records));
        showToast('Record saved successfully!');
        form.reset();
        document.getElementById('parameterTable').innerHTML = '';
        renderDashboard();
        renderRecordsList();
    });
}

function addParamRow(name, unit, isMaterial) {
    const table = document.getElementById('parameterTable');
    const row = document.createElement('div');
    row.className = 'param-row';
    if (isMaterial) row.setAttribute('data-material', 'true');

    row.innerHTML = `
        <input class="p-name" value="${name}" placeholder="Parameter name" />
        <input class="p-unit" value="${unit}" placeholder="Unit" />
        <input class="p-val" placeholder="Value / Reading" required />
        <input type="text" placeholder="Notes / Spec" />
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>
    `;
    table.appendChild(row);
}

function setupRecordsView() {
    const searchInput = document.getElementById('searchInput');
    const filterDept = document.getElementById('filterDepartment');
    const filterType = document.getElementById('filterType');

    searchInput.addEventListener('input', renderRecordsList);
    filterDept.addEventListener('change', renderRecordsList);
    filterType.addEventListener('change', renderRecordsList);

    document.getElementById('exportBtn').addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", "factory_records_backup.json");
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
    });

    renderRecordsList();
}

function renderRecordsList() {
    const container = document.getElementById('recordsTable');
    const search = document.getElementById('searchInput').value.toLowerCase();
    const dept = document.getElementById('filterDepartment').value;
    const type = document.getElementById('filterType').value;

    let filtered = records.filter(r => {
        const matchSearch = (r.product || '').toLowerCase().includes(search) || (r.machine || '').toLowerCase().includes(search) || (r.formulaCode || '').toLowerCase().includes(search);
        const matchDept = dept === 'all' || r.department === dept;
        const matchType = type === 'all' || r.type === type;
        return matchSearch && matchDept && matchType;
    });

    if (!filtered.length) {
        container.innerHTML = '<div class="empty">No matching records found in database.</div>';
        return;
    }

    container.innerHTML = `
        <div class="data-head">
            <div>Date</div><div>Department</div><div>Machine</div><div>Product</div><div>Formula</div><div>Type</div><div>Actions</div>
        </div>
        ${filtered.map(r => `
            <div class="data-row">
                <div>${r.date}</div>
                <div><span class="badge ${r.department}">${r.department}</span></div>
                <div>${r.machine || '-'}</div>
                <div><strong>${r.product || 'Unnamed'}</strong></div>
                <div>${r.formulaCode || '-'}</div>
                <div><span class="badge trial">${r.type}</span></div>
                <div class="row-actions">
                    <button class="icon-btn" onclick="viewRecordDetails('${r.id}')">View</button>
                    <button class="icon-btn delete" onclick="deleteRecord('${r.id}')">Delete</button>
                </div>
            </div>
        `).join('')}
    `;
}

window.deleteRecord = function(id) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    records = records.filter(r => r.id !== id);
    localStorage.setItem('plastic_factory_records', JSON.stringify(records));
    renderRecordsList();
    renderDashboard();
    showToast('Record deleted');
};

window.viewRecordDetails = function(id) {
    const record = records.find(r => r.id === id);
    if (!record) return;
    activeRecordForPdf = record;

    const dialog = document.getElementById('recordDialog');
    document.getElementById('dialogTitle').textContent = `${record.product || 'Record'} (${record.machine || 'General'})`;
    
    document.getElementById('dialogContent').innerHTML = `
        <div class="detail-grid">
            <div class="detail-box"><span>Date</span><strong>${record.date}</strong></div>
            <div class="detail-box"><span>Department</span><strong>${record.department}</strong></div>
            <div class="detail-box"><span>Type</span><strong>${record.type}</strong></div>
        </div>
        <p><strong>Purpose:</strong> ${record.purpose || 'None specified'}</p>
        <h4>Parameters & Readings:</h4>
        <table class="detail-table">
            <thead><tr><th>Parameter</th><th>Value</th><th>Unit</th></tr></thead>
            <tbody>
                ${(record.parameters || []).map(p => `<tr><td>${p.name}</td><td>${p.value}</td><td>${p.unit || ''}</td></tr>`).join('')}
            </tbody>
        </table>
        <div class="notes-box">
            <h4>Observations & Conclusion</h4>
            <p><strong>Observations:</strong> ${record.observations || 'None'}</p>
            <p><strong>Conclusion:</strong> ${record.conclusion || 'None'}</p>
        </div>
    `;
    dialog.showModal();
};

function setupMaterialsView() {
    document.getElementById('printMaterialsBtn').addEventListener('click', () => {
        window.print();
    });
}

function setupLibraryView() {
    const form = document.getElementById('parameterLibraryForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('libraryName').value;
        const unit = document.getElementById('libraryUnit').value;
        const dept = document.getElementById('libraryDepartment').value;

        parametersLibrary.push({ name, unit, department: dept });
        localStorage.setItem('plastic_factory_params', JSON.stringify(parametersLibrary));
        form.reset();
        renderLibraryList();
        showToast('Parameter added to library');
    });
    renderLibraryList();
}

function renderLibraryList() {
    const list = document.getElementById('libraryList');
    list.innerHTML = parametersLibrary.map((p, idx) => `
        <div class="library-item">
            <strong>${p.name}</strong>
            <small>Unit: ${p.unit || 'None'}</small>
            <span class="badge ${p.department}">${p.department}</span>
            <button class="remove-btn" onclick="removeLibraryParam(${idx})">×</button>
        </div>
    `).join('');
}

window.removeLibraryParam = function(idx) {
    parametersLibrary.splice(idx, 1);
    localStorage.setItem('plastic_factory_params', JSON.stringify(parametersLibrary));
    renderLibraryList();
};

// PDF Export & Modal Customization Handlers
function setupPdfExportHandlers() {
    const btnExportPDF = document.getElementById('btnExportPDF');
    const btnExportMaterialsOnly = document.getElementById('btnExportMaterialsOnly');
    const pdfFilterModal = document.getElementById('pdfFilterModal');
    const btnConfirmExport = document.getElementById('btnConfirmExport');
    const btnCancelExport = document.getElementById('btnCancelExport');
    const checkboxContainer = document.getElementById('checkboxContainer');

    if (btnExportPDF) {
        btnExportPDF.addEventListener('click', () => {
            const dataToUse = activeRecordForPdf ? (activeRecordForPdf.parameters || []) : [
                { id: 'temp1', name: 'Zone 1 Temp', value: 180, unit: '°C' },
                { id: 'speed1', name: 'Screw Speed', value: 45, unit: 'RPM' },
                { id: 'mat1', name: 'PVC 57', value: 250, unit: 'kg', isMaterial: true },
                { id: 'mat2', name: 'CaCO3', value: 15, unit: 'kg', isMaterial: true }
            ];

            checkboxContainer.innerHTML = '';
            dataToUse.forEach((item, index) => {
                const itemId = item.id || 'item_' + index;
                const itemName = item.name || 'Parameter';
                const label = document.createElement('label');
                label.innerHTML = `<input type="checkbox" value="${itemId}" data-index="${index}"> Hide ${itemName}`;
                checkboxContainer.appendChild(label);
            });

            pdfFilterModal.style.display = 'block';
        });
    }

    if (btnCancelExport) {
        btnCancelExport.addEventListener('click', () => {
            pdfFilterModal.style.display = 'none';
        });
    }

    if (btnConfirmExport) {
        btnConfirmExport.addEventListener('click', () => {
            const hiddenIndices = Array.from(document.querySelectorAll('#checkboxContainer input:checked')).map(cb => parseInt(cb.getAttribute('data-index')));
            const rawData = activeRecordForPdf ? (activeRecordForPdf.parameters || []) : [
                { id: 'temp1', name: 'Zone 1 Temp', value: 180, unit: '°C' },
                { id: 'speed1', name: 'Screw Speed', value: 45, unit: 'RPM' },
                { id: 'mat1', name: 'PVC 57', value: 250, unit: 'kg', isMaterial: true },
                { id: 'mat2', name: 'CaCO3', value: 15, unit: 'kg', isMaterial: true }
            ];

            const dataToPrint = rawData.filter((_, idx) => !hiddenIndices.includes(idx));
            generatePDFHTML(dataToPrint, 'Comprehensive Production Report');
            pdfFilterModal.style.display = 'none';
        });
    }

    if (btnExportMaterialsOnly) {
        btnExportMaterialsOnly.addEventListener('click', () => {
            const rawData = activeRecordForPdf ? (activeRecordForPdf.parameters || []) : [
                { name: 'PVC 57', value: 250, unit: 'kg', isMaterial: true },
                { name: 'CaCO3', value: 15, unit: 'kg', isMaterial: true }
            ];
            const materialsOnly = rawData.filter(item => item.isMaterial === true || (item.unit && item.unit.toLowerCase().includes('kg')));
            generatePDFHTML(materialsOnly, 'Material Consumption Report');
        });
    }
}

function generatePDFHTML(data, title) {
    let htmlContent = `
        <div id="pdfPrintArea">
            <h1 style="color: #0A2540; text-align: center; font-size: 24pt; margin-bottom: 20px;">${title}</h1>
            <table>
                <thead>
                    <tr>
                        <th>Item & Unit</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
    `;

    data.forEach(item => {
        let nameWithUnit = item.unit ? `${item.name} (${item.unit})` : item.name;
        htmlContent += `
            <tr>
                <td><strong>${nameWithUnit}</strong></td>
                <td>${item.value || '-'}</td>
            </tr>
        `;
    });

    htmlContent += `
                </tbody>
            </table>
        </div>
    `;

    console.log("PDF HTML generated successfully:", htmlContent);
    showToast('PDF HTML generated. Ready for print or export.');
    
    // Trigger standard print window preview containing the formatted area
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <link rel="stylesheet" href="styles.css">
        </head>
        <body style="background: #fff; padding: 20px;">
            ${htmlContent}
            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}