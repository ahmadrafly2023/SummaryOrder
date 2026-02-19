// ─── STATE ────────────────────────────────────────────
let parsedOrders = [];
let resultsData = [];
let activeFilter = 'all';

// ─── THEME ────────────────────────────────────────────
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('themeBtn').textContent = isDark ? '🌙' : '☀️';
}

// ─── TOAST ────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── COPY ORDER ID ────────────────────────────────────
function copyOrderId(el, id) {
  navigator.clipboard.writeText(id).then(() => {
    el.classList.remove('copy-flash');
    void el.offsetWidth;
    el.classList.add('copy-flash');
    showToast('✅ Copied: ' + id);
  });
}

// ─── PARSE DATA INPUT ─────────────────────────────────
function parseDataInput(text) {
  const lines = text.trim().split('\n');
  const meta = { witel: '', totalIndibiz: '0', totalWms: '0' };
  const orders = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (line.includes('WITEL:')) { meta.witel = line.split('WITEL:')[1].trim(); continue; }
    if (line.includes('Total INDIBIZ:')) {
      const p = line.split('|');
      if (p.length >= 2) {
        meta.totalIndibiz = p[0].split(':').pop().trim();
        meta.totalWms = p[1].split(':').pop().trim();
      }
      continue;
    }
    const p = line.split('|').map(s => s.trim());
    if (p.length >= 5 && /^\d/.test(p[0])) {
      orders.push({
        noOrder: p[0], sto: p[1], nama: p[2],
        statusProv: p[3], tipe: p[4],
        hari: p.length > 5 ? p[5].replace('hari','').trim() : '0'
      });
    }
  }
  return { meta, orders };
}

// ─── GENERATE TABLE ───────────────────────────────────
function generateTable() {
  const text = document.getElementById('dataInput').value;
  if (!text.trim()) { showToast('⚠️ Data input kosong!'); return; }

  const { meta, orders } = parseDataInput(text);
  if (!orders.length) { showToast('⚠️ Tidak ada order ditemukan!'); return; }

  parsedOrders = orders;
  const defStatus  = document.getElementById('defStatus').value;
  const defUnit    = document.getElementById('defUnit').value;
  const defAncreaw = document.getElementById('defAncreaw').value;
  const defSummary = document.getElementById('defSummary').value;
  const defLog     = document.getElementById('defLog').value;

  const tbody = document.getElementById('orderTableBody');
  tbody.innerHTML = '';

  orders.forEach((o, i) => {
    const ancreawDef = defAncreaw.replace('{STO}', o.sto);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="col-ro">${i+1}</td>
      <td class="col-order" onclick="copyOrderId(this, 'SC${o.noOrder}')" title="Klik untuk copy — SC${o.noOrder}">SC${o.noOrder}</td>
      <td>${o.sto}</td>
      <td>${o.nama}</td>
      <td>${o.tipe}</td>
      <td>${o.hari}</td>
      <td><input type="text" data-field="status" data-idx="${i}" value="${defStatus}"></td>
      <td><input type="text" data-field="unit" data-idx="${i}" value="${defUnit}" style="min-width:180px"></td>
      <td><input type="text" data-field="ancreaw" data-idx="${i}" value="${ancreawDef}" style="min-width:140px"></td>
      <td><input type="text" data-field="summary" data-idx="${i}" value="${defSummary}" style="min-width:130px"></td>
      <td><input type="text" data-field="log" data-idx="${i}" value="${defLog}"></td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById('orderCountLabel').textContent = orders.length;
  document.getElementById('genTableCard').classList.add('show');
  document.getElementById('actionBar').style.display = 'flex';

  // hide old results
  document.getElementById('resultsCard').classList.remove('show');

  document.getElementById('genTableCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast(`✅ ${orders.length} order berhasil di-generate!`);
}

// ─── APPLY DEFAULT TO ALL ─────────────────────────────
function applyDefaultAll() {
  const defStatus  = document.getElementById('defStatus').value;
  const defUnit    = document.getElementById('defUnit').value;
  const defAncreaw = document.getElementById('defAncreaw').value;
  const defSummary = document.getElementById('defSummary').value;
  const defLog     = document.getElementById('defLog').value;

  parsedOrders.forEach((o, i) => {
    document.querySelector(`[data-field="status"][data-idx="${i}"]`).value  = defStatus;
    document.querySelector(`[data-field="unit"][data-idx="${i}"]`).value    = defUnit;
    document.querySelector(`[data-field="ancreaw"][data-idx="${i}"]`).value = defAncreaw.replace('{STO}', o.sto);
    document.querySelector(`[data-field="summary"][data-idx="${i}"]`).value = defSummary;
    document.querySelector(`[data-field="log"][data-idx="${i}"]`).value     = defLog;
  });
  showToast('🔄 Semua baris di-reset ke default!');
}

// ─── PROSES DATA ─────────────────────────────────────
function prosesData() {
  if (!parsedOrders.length) { showToast('⚠️ Generate tabel dulu!'); return; }

  const text = document.getElementById('dataInput').value;
  const { meta } = parseDataInput(text);

  const defStatus  = document.getElementById('defStatus').value;
  const defUnit    = document.getElementById('defUnit').value;
  const defAncreaw = document.getElementById('defAncreaw').value;
  const defSummary = document.getElementById('defSummary').value;
  const defLog     = document.getElementById('defLog').value;

  resultsData = parsedOrders.map((o, i) => {
    const getVal = (field) => {
      const el = document.querySelector(`[data-field="${field}"][data-idx="${i}"]`);
      return el ? el.value.trim() : '';
    };

    const status  = getVal('status')  || defStatus;
    const unit    = getVal('unit')    || defUnit;
    const ancreaw = getVal('ancreaw') || defAncreaw.replace('{STO}', o.sto);
    const summary = getVal('summary') || defSummary;
    const log     = getVal('log')     || defLog;

    // Detect if custom (any field differs from default)
    const ancreawDef = defAncreaw.replace('{STO}', o.sto);
    const isCustom = status !== defStatus || unit !== defUnit || ancreaw !== ancreawDef
                  || summary !== defSummary || log !== defLog;

    return { ...o, status, unit, ancreaw, summary, log, isCustom };
  });

  // Stats
  const customCnt = resultsData.filter(r => r.isCustom).length;
  const defCnt = resultsData.length - customCnt;

  document.getElementById('statsRow').innerHTML = `
    <div class="stat"><div class="stat-val">${resultsData.length}</div><div class="stat-label">Total Order</div></div>
    <div class="stat"><div class="stat-val" style="color:var(--green)">${customCnt}</div><div class="stat-label">Custom</div></div>
    <div class="stat"><div class="stat-val" style="color:var(--orange)">${defCnt}</div><div class="stat-label">Default</div></div>
    <div class="stat"><div class="stat-val" style="color:var(--text2)">${meta.witel || '-'}</div><div class="stat-label">WITEL</div></div>
  `;

  // Build raw output
  const sep = '='.repeat(170);
  let raw = sep + '\n';
  raw += `WITEL: ${meta.witel}\n`;
  raw += `Total INDIBIZ: ${meta.totalIndibiz} | Total WMS: ${meta.totalWms}\n`;
  raw += sep + '\n\n';
  resultsData.forEach(r => {
    raw += `${r.noOrder} | ${r.sto} | ${r.nama} | ${r.statusProv} | ${r.tipe} | ${r.hari} hari | ${r.status} | ${r.unit} | ${r.ancreaw} | ${r.summary} | ${r.log}\n`;
  });
  raw += '\n' + sep + '\n';
  document.getElementById('rawOutput').textContent = raw;

  renderResultTable(resultsData);

  document.getElementById('resultsCard').classList.add('show');
  document.getElementById('resultsCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast(`✅ ${resultsData.length} data berhasil diproses!`);
}

// ─── RENDER RESULT TABLE ──────────────────────────────
function renderResultTable(data) {
  const tbody = document.getElementById('resultBody');
  const q = document.getElementById('searchInput').value.toLowerCase();
  const filtered = data.filter(r => {
    if (activeFilter === 'custom' && !r.isCustom) return false;
    if (activeFilter === 'default' && r.isCustom) return false;
    if (!q) return true;
    return [r.noOrder, r.sto, r.nama, r.statusProv, r.tipe, r.status, r.unit, r.ancreaw, r.summary, r.log]
      .some(v => v.toLowerCase().includes(q));
  });

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="13" class="no-results">Tidak ada data yang cocok 🔍</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((r, i) => `
    <tr>
      <td class="col-ro">${i+1}</td>
      <td><span class="badge ${r.isCustom ? 'badge-custom' : 'badge-default'}">${r.isCustom ? 'CUSTOM' : 'DEFAULT'}</span></td>
      <td class="col-order">${r.noOrder}</td>
      <td>${r.sto}</td>
      <td>${r.nama}</td>
      <td>${r.statusProv}</td>
      <td>${r.tipe}</td>
      <td>${r.hari}</td>
      <td>${r.status}</td>
      <td>${r.unit}</td>
      <td>${r.ancreaw}</td>
      <td>${r.summary}</td>
      <td>${r.log}</td>
    </tr>
  `).join('');
}

// ─── FILTER / SEARCH ─────────────────────────────────
function filterResults() { renderResultTable(resultsData); }

function setFilter(f) {
  activeFilter = f;
  ['filterAll','filterCustom','filterDefault'].forEach(id => {
    document.getElementById(id).classList.remove('active');
    document.getElementById(id).style.cssText = '';
  });
  const el = document.getElementById(f === 'all' ? 'filterAll' : f === 'custom' ? 'filterCustom' : 'filterDefault');
  el.classList.add('active');
  el.style.background = 'var(--accent)';
  el.style.color = '#fff';
  el.style.borderColor = 'var(--accent)';
  renderResultTable(resultsData);
}

// ─── COPY / DOWNLOAD ─────────────────────────────────
function copyAll() {
  const text = document.getElementById('rawOutput').textContent;
  navigator.clipboard.writeText(text).then(() => showToast('📋 Berhasil di-copy!'));
}

function downloadTxt() {
  const text = document.getElementById('rawOutput').textContent;
  const witel = (document.getElementById('dataInput').value.match(/WITEL:\s*(\S+)/) || ['','WITEL'])[1];
  const date = new Date().toISOString().slice(0,10);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `hasil_${witel}_${date}.txt`;
  a.click();
  showToast('⬇️ File .txt diunduh!');
}

function clearAll() {
  if (!confirm('Clear semua data?')) return;
  document.getElementById('dataInput').value = '';
  document.getElementById('genTableCard').classList.remove('show');
  document.getElementById('resultsCard').classList.remove('show');
  document.getElementById('actionBar').style.display = 'none';
  document.getElementById('orderTableBody').innerHTML = '';
  document.getElementById('resultBody').innerHTML = '';
  parsedOrders = [];
  resultsData = [];
  showToast('🗑️ Semua data dihapus!');
}
