const $ = (s) => document.querySelector(s);
const money = (n) => Number(n).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const palette = ['#9dd767','#c5dbaf','#dfdfcf','#a9c48f','#d0cda7'];
const currentYear = new Date().getFullYear();
$('#year-display').textContent = currentYear;
$('[name="year"]').max = currentYear;

const themeToggle = $('#theme-toggle');
function applyTheme(theme, persist = true) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
  $('#theme-icon').textContent = isDark ? '☀' : '☾';
  $('#theme-label').textContent = isDark ? 'Light' : 'Dark';
  document.querySelector('meta[name="theme-color"]').content = isDark ? '#101713' : '#101916';
  if (persist) {
    try { localStorage.setItem('carwise-theme', isDark ? 'dark' : 'light'); } catch (_) { /* storage may be disabled */ }
  }
  if (window._carwiseYearPrices) drawYearChart(window._carwiseYearPrices);
}
applyTheme(document.documentElement.dataset.theme || 'light', false);
themeToggle.addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});

function fillSelect(id, values) {
  const select = $(id);
  const placeholder = select.dataset.placeholder || 'Choose an option';
  select.innerHTML = `<option value="" selected disabled>${escapeHtml(placeholder)}</option>` +
    values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function drawYearChart(rows) {
  const canvas = $('#yearChart');
  const box = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(box.width * ratio));
  canvas.height = Math.max(1, Math.floor(box.height * ratio));
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  const w = box.width, h = box.height;
  const pad = {left:35,right:8,top:13,bottom:27};
  const values = rows.map(r => r.price);
  const max = Math.ceil(Math.max(...values) / 2) * 2;
  const dark = document.documentElement.dataset.theme === 'dark';
  ctx.font = '9px DM Sans, sans-serif';
  ctx.strokeStyle = dark ? '#303b34' : '#edf1ed'; ctx.fillStyle = dark ? '#9aa79f' : '#9ba59f'; ctx.lineWidth = 1;
  for (let i=0;i<=4;i++) {
    const y = pad.top + (h-pad.top-pad.bottom) * i/4;
    ctx.beginPath(); ctx.moveTo(pad.left,y); ctx.lineTo(w-pad.right,y); ctx.stroke();
    ctx.fillText((max*(1-i/4)).toFixed(0), 2, y+3);
  }
  const step = (w-pad.left-pad.right)/rows.length;
  const bw = Math.max(3, step*.57);
  rows.forEach((r,i) => {
    const bh = (r.price/max)*(h-pad.top-pad.bottom);
    const x = pad.left + step*i + (step-bw)/2;
    const y = h-pad.bottom-bh;
    ctx.fillStyle = dark ? (i === rows.length-1 ? '#a8df78' : '#58734a') : (i === rows.length-1 ? '#78ae4c' : '#c1d7ac');
    ctx.beginPath(); ctx.roundRect(x,y,bw,bh,3); ctx.fill();
    if (rows.length < 18 || i % 3 === 0 || i === rows.length-1) {
      ctx.fillStyle=dark ? '#a1aea5' : '#89958e'; ctx.textAlign='center'; ctx.fillText(String(r.year),x+bw/2,h-8);
    }
  });
}
function renderOverview(data) {
  $('#records').textContent = Number(data.records).toLocaleString('en-IN');
  $('#average').textContent = money(data.average_price);
  $('#median').textContent = money(data.median_price);
  $('#age').textContent = data.average_age;
  fillSelect('#fuel-select', data.categories.Fuel_Type);
  fillSelect('#seller-select', data.categories.Seller_Type);
  fillSelect('#transmission-select', data.categories.Transmission);
  $('#brand-options').innerHTML = Object.keys(data.top_brands).map(b => `<option value="${escapeHtml(b)}"></option>`).join('');
  const fuelEntries = Object.entries(data.fuel_counts).sort((a,b) => b[1]-a[1]);
  const total = fuelEntries.reduce((sum, row) => sum + row[1], 0);
  $('#fuel-list').innerHTML = fuelEntries.map(([name,count],i) => `<div class="fuel-row"><div class="fuel-row-head"><span>${escapeHtml(name)}</span><span>${count} listings · ${Math.round(count/total*100)}%</span></div><div class="fuel-track"><div class="fuel-fill" style="width:${count/total*100}%;background:${palette[i%palette.length]}"></div></div></div>`).join('');
  $('#brands').innerHTML = Object.entries(data.top_brands).map(([name,count]) => `<div class="brand-item"><span>${escapeHtml(name)}</span><span>${count} listings</span></div>`).join('');
  drawYearChart(data.year_prices);
}
function renderModels(data) {
  const best = data.models[0];
  $('#best-model').innerHTML = `<span class="accent">✦</span> Best fit: <strong>${escapeHtml(data.best_model)}</strong> <span class="top-badge">R² ${best.r2.toFixed(3)}</span>`;
  $('#model-rows').innerHTML = data.models.map((m,i) => `<tr><td>${escapeHtml(m.name)}${i===0?'<span class="top-badge">BEST FIT</span>':''}</td><td>₹${money(m.mae)}</td><td>₹${money(m.rmse)}</td><td>${m.r2.toFixed(3)}</td><td>${i===0?'<span class="status-pill"><i></i> SELECTED</span>':'<span class="small-muted">EVALUATED</span>'}</td></tr>`).join('');
}
async function loadDashboard() {
  try {
    const response = await fetch('/api/overview');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load dataset.');
    renderOverview(data);
    const modelResponse = await fetch('/api/models');
    const modelData = await modelResponse.json();
    if (!modelResponse.ok) throw new Error(modelData.error || 'Could not train models.');
    renderModels(modelData);
  } catch (error) {
    $('#backend-notice').hidden = false;
    $('#best-model').textContent = error.message;
    $('#model-rows').innerHTML = `<tr><td colspan="5" class="loading">${escapeHtml(error.message)} Check dependencies and dataset path.</td></tr>`;
    $('#fuel-list').innerHTML = `<div class="loading">${escapeHtml(error.message)}</div>`;
  }
}
const estimateForm = $('#estimate-form');
const estimateButton = $('#predict-button');
const estimateResult = $('#prediction-result');
const formHint = $('#form-hint');
let estimateTimer = null;
let estimateRevision = 0;

function queueEstimate() {
  clearTimeout(estimateTimer);
  const revision = ++estimateRevision;
  const complete = estimateForm.checkValidity();
  estimateButton.disabled = !complete;
  if (!complete) {
    estimateResult.className = 'prediction-result';
    estimateResult.innerHTML = '';
    formHint.textContent = 'Fill every field; estimate updates automatically.';
    return;
  }
  formHint.textContent = 'Details complete · updating your estimate…';
  estimateResult.innerHTML = '<div class="result-meta">Updating estimate…</div>';
  estimateResult.className = 'prediction-result show';
  estimateTimer = setTimeout(() => requestEstimate(revision), 450);
}

async function requestEstimate(revision) {
  const payload = Object.fromEntries(new FormData(estimateForm).entries());
  estimateButton.disabled = true;
  estimateButton.innerHTML = 'Calculating <span class="spinner"></span>';
  try {
    const response = await fetch('/api/predict', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Prediction failed.');
    if (revision !== estimateRevision) return;
    estimateResult.innerHTML = `<div class="result-label">ESTIMATED SELLING PRICE</div><div class="result-value">₹${money(data.price)} lakh</div><div class="result-meta">Powered by ${escapeHtml(data.model)} · Dataset based estimate</div>`;
    estimateResult.className = 'prediction-result show';
    formHint.textContent = 'Estimate updates whenever you change a detail.';
  } catch (error) {
    if (revision !== estimateRevision) return;
    estimateResult.textContent = error.message;
    estimateResult.className = 'prediction-result show error';
  } finally {
    if (revision === estimateRevision) {
      estimateButton.disabled = !estimateForm.checkValidity();
      estimateButton.innerHTML = 'Calculate estimate <span>↗</span>';
    }
  }
}

estimateForm.addEventListener('input', queueEstimate);
estimateForm.addEventListener('change', queueEstimate);
estimateForm.addEventListener('submit', (event) => {
  event.preventDefault();
  clearTimeout(estimateTimer);
  const revision = ++estimateRevision;
  requestEstimate(revision);
});
window.addEventListener('resize', () => { if (window._carwiseYearPrices) drawYearChart(window._carwiseYearPrices); });
const originalRenderOverview = renderOverview;
renderOverview = (data) => { window._carwiseYearPrices=data.year_prices; originalRenderOverview(data); };
loadDashboard();
