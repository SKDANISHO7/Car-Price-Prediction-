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
  $('#best-model').innerHTML = `<span class="accent">✦</span> Prediction model: <strong>${escapeHtml(data.best_model)}</strong> <span class="top-badge">SAVED PIPELINE</span>`;
  fillSelect('#fuel-select', data.categories.Fuel_Type);
  fillSelect('#seller-select', data.categories.Seller_Type);
  fillSelect('#transmission-select', data.categories.Transmission);
  $('#owner-select').innerHTML = '<option value="" selected disabled>Select owner count</option>' +
    data.owner_counts.map((count) => `<option value="${count}">${count === 0 ? 'First owner' : `${count} previous owner${count === 1 ? '' : 's'}`}</option>`).join('');
  $('#brand-options').innerHTML = Object.keys(data.top_brands).map(b => `<option value="${escapeHtml(b)}"></option>`).join('');
  $('#assistant-examples').innerHTML = data.examples.map((example, index) => `<button type="button" class="example-chip" data-example="${index}">Estimate a ${escapeHtml(example.year)} ${escapeHtml(example.brand)}</button>`).join('');
  $('#assistant-examples').querySelectorAll('[data-example]').forEach((button) => {
    button.addEventListener('click', () => useExample(data.examples[Number(button.dataset.example)]));
  });
  const fuelEntries = Object.entries(data.fuel_counts).sort((a,b) => b[1]-a[1]);
  const total = fuelEntries.reduce((sum, row) => sum + row[1], 0);
  $('#fuel-list').innerHTML = fuelEntries.map(([name,count],i) => `<div class="fuel-row"><div class="fuel-row-head"><span>${escapeHtml(name)}</span><span>${count} listings · ${Math.round(count/total*100)}%</span></div><div class="fuel-track"><div class="fuel-fill" style="width:${count/total*100}%;background:${palette[i%palette.length]}"></div></div></div>`).join('');
  $('#brands').innerHTML = Object.entries(data.top_brands).map(([name,count]) => `<div class="brand-item"><span>${escapeHtml(name)}</span><span>${count} listings</span></div>`).join('');
  drawYearChart(data.year_prices);
}
function renderModels(data) {
  const selectedMetrics = data.models.find((model) => model.name === data.best_model);
  const score = selectedMetrics ? `HOLDOUT R² ${selectedMetrics.r2.toFixed(3)}` : 'SAVED PIPELINE';
  $('#best-model').innerHTML = `<span class="accent">✦</span> Prediction model: <strong>${escapeHtml(data.best_model)}</strong> <span class="top-badge">${score}</span>`;
  $('#model-rows').innerHTML = data.models.map((model, index) => {
    const selected = model.name === data.best_model;
    const leader = index === 0;
    const badge = selected ? '<span class="top-badge">PREDICTION MODEL</span>' : (leader ? '<span class="top-badge">HOLDOUT LEADER</span>' : '');
    const status = selected ? '<span class="status-pill"><i></i> USED</span>' : '<span class="small-muted">EVALUATED</span>';
    return `<tr><td>${escapeHtml(model.name)}${badge}</td><td>₹${money(model.mae)}</td><td>₹${money(model.rmse)}</td><td>${model.r2.toFixed(3)}</td><td>${status}</td></tr>`;
  }).join('');
}
let modelComparisonRequested = false;
async function loadModelComparison() {
  if (modelComparisonRequested) return;
  modelComparisonRequested = true;
  try {
    const modelResponse = await fetch('/api/models');
    const modelData = await modelResponse.json();
    if (!modelResponse.ok) throw new Error(modelData.error || 'Could not load model comparison.');
    renderModels(modelData);
  } catch (error) {
    $('#model-rows').innerHTML = `<tr><td colspan="5" class="loading">${escapeHtml(error.message)} Check dependencies and dataset path.</td></tr>`;
  }
}

async function loadDashboard() {
  try {
    const response = await fetch('/api/overview');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load dataset.');
    renderOverview(data);
  } catch (error) {
    $('#backend-notice').hidden = false;
    $('#best-model').textContent = error.message;
    $('#fuel-list').innerHTML = `<div class="loading">${escapeHtml(error.message)}</div>`;
  }
}
const comparisonSection = $('#comparison');
if ('IntersectionObserver' in window) {
  const comparisonObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      comparisonObserver.disconnect();
      loadModelComparison();
    }
  }, {rootMargin: '100px'});
  comparisonObserver.observe(comparisonSection);
} else {
  loadModelComparison();
}
const estimateForm = $('#estimate-form');
const estimateButton = $('#predict-button');
const estimateResult = $('#prediction-result');
const formHint = $('#form-hint');
const anotherButton = $('#another-button');
let estimateTimer = null;
let estimateRevision = 0;
let activeQuestion = 'Estimate this car';

function useExample(example) {
  for (const [key, value] of Object.entries(example)) {
    const field = estimateForm.elements.namedItem(key);
    if (field) field.value = String(value);
  }
  activeQuestion = `Estimate a ${example.year} ${example.brand}`;
  estimateForm.dispatchEvent(new Event('change', {bubbles: true}));
  estimateForm.requestSubmit();
  $('#estimate').scrollIntoView({behavior: 'smooth', block: 'center'});
}

function addConversation(question, answer, used) {
  const history = $('#conversation-history');
  history.querySelector('.history-empty')?.remove();
  const turn = document.createElement('article');
  turn.className = 'conversation-turn';
  const ownership = used.owners === 0 ? 'first owner' : `${used.owners} previous owner${used.owners === 1 ? '' : 's'}`;
  const detail = `${used.car} · year ${used.year} · showroom ₹${money(used.showroom_price_lakh)} lakh · ${Number(used.kilometers).toLocaleString('en-IN')} km · ${ownership} · ${used.fuel} · ${used.seller} · ${used.transmission}`;
  turn.innerHTML = `<div class="user-message"><b>You asked</b><p>${escapeHtml(question)}</p></div><div class="assistant-message"><b>Estimated response</b><p>Estimated selling price: <strong>₹${money(answer.price)} lakh</strong></p><small>Used: ${escapeHtml(detail)}. Powered by ${escapeHtml(answer.model)}. Estimate only, not a guaranteed market price.</small></div>`;
  history.prepend(turn);
}

function queueEstimate() {
  clearTimeout(estimateTimer);
  const revision = ++estimateRevision;
  const complete = estimateForm.checkValidity();
  estimateButton.disabled = !complete;
  anotherButton.hidden = true;
  estimateResult.className = 'prediction-result';
  estimateResult.innerHTML = '';
  if (!complete) {
    formHint.textContent = 'Complete all car details to ask for an estimate.';
    return;
  }
  formHint.textContent = 'Details complete · ready for your question.';
}

async function requestEstimate(revision) {
  const payload = Object.fromEntries(new FormData(estimateForm).entries());
  estimateButton.disabled = true;
  estimateButton.innerHTML = 'Calculating <span class="spinner"></span>';
  formHint.textContent = 'Checking the details with the prediction model…';
  estimateResult.innerHTML = '<div class="result-meta">Calculating your estimate…</div>';
  estimateResult.className = 'prediction-result show';
  try {
    const response = await fetch('/api/predict', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Prediction failed.');
    if (revision !== estimateRevision) return;
    estimateResult.innerHTML = `<div class="result-label">ESTIMATED SELLING PRICE</div><div class="result-value">₹${money(data.price)} lakh</div><div class="result-meta">Powered by ${escapeHtml(data.model)} · Estimate only, not a guaranteed market price.</div>`;
    estimateResult.className = 'prediction-result show';
    formHint.textContent = 'The estimate is based on the car details you entered.';
    addConversation(activeQuestion, data, data.used);
    anotherButton.hidden = false;
  } catch (error) {
    if (revision !== estimateRevision) return;
    estimateResult.textContent = error.message;
    estimateResult.className = 'prediction-result show error';
  } finally {
    if (revision === estimateRevision) {
      estimateButton.disabled = !estimateForm.checkValidity();
      estimateButton.innerHTML = 'Ask for estimate <span>↗</span>';
    }
  }
}

estimateForm.addEventListener('input', queueEstimate);
estimateForm.addEventListener('change', queueEstimate);
estimateForm.addEventListener('submit', (event) => {
  event.preventDefault();
  clearTimeout(estimateTimer);
  const revision = ++estimateRevision;
  activeQuestion = `Estimate a ${estimateForm.elements.year.value} ${estimateForm.elements.brand.value}`;
  requestEstimate(revision);
});
anotherButton.addEventListener('click', () => {
  estimateForm.reset();
  estimateResult.className = 'prediction-result';
  estimateResult.innerHTML = '';
  anotherButton.hidden = true;
  estimateButton.disabled = true;
  formHint.textContent = 'Enter another car’s details to continue.';
  $('#estimate').scrollIntoView({behavior: 'smooth', block: 'center'});
});
window.addEventListener('resize', () => { if (window._carwiseYearPrices) drawYearChart(window._carwiseYearPrices); });
const originalRenderOverview = renderOverview;
renderOverview = (data) => { window._carwiseYearPrices=data.year_prices; originalRenderOverview(data); };
loadDashboard();
