// dashboard.js - busca dados via API (GET) e renderiza dashboard público
const API_URL = "https://script.google.com/macros/s/AKfycbzV1eTn_eoldgPtfOlAZRAlJGQoK2WU1BG-cixCKEzv_nn_IxYOSEaCpyOLWWG57JLv/exec";

// nomes exatos das abas
const SHEETS = {
  entradas: "Entradas",
  saidas: "Saídas",
  dizimistas: "Dizimistas",
  fixas: "Despesas  Fixas"
};

// cabeçalhos esperados (ordem)
const HEADERS = {
  Entradas: ["Data", "Valor", "Nome", "Descrição"],
  "Saídas": ["Data", "Valor", "Descrição", "Responsável"],
  Dizimistas: ["Nome", "Telefone", "Observações"],
  "Despesas  Fixas": ["Nome da Despesa", "Valor", "Dia do Vencimento", "Observação"]
};

function parseNumber(v){
  if(v==null) return 0;
  const s = String(v).replace(/\s/g,'').replace(/\u00A0/g,'').replace(/R\$|BRL/g,'');
  if(s==='') return 0;
  if(s.match(/[0-9]+\.[0-9]{3},/)) return parseFloat(s.replace(/\./g,'').replace(',','.'));
  if(s.indexOf(',')>-1 && s.indexOf('.')===-1) return parseFloat(s.replace(',','.'));
  const only = s.replace(/[^0-9\.-]/g,'');
  const n = parseFloat(only);
  return isNaN(n) ? 0 : n;
}
function fmtBRL(v){ return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function parseDateSmart(str){
  if(!str) return null;
  str = String(str).trim();
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if(dmy){ let y=+dmy[3]; if(y<100) y+=2000; return new Date(y,+dmy[2]-1,+dmy[1]); }
  const iso = Date.parse(str); if(!isNaN(iso)) return new Date(iso);
  return null;
}

async function fetchList(action){
  const url = `${API_URL}?action=${action}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error(`Erro ao buscar ${action}: ${res.status}`);
  const txt = await res.text();
  try { return JSON.parse(txt); } catch(e){ console.error('Erro parse JSON', e, txt); throw e; }
}

function rowsToObjects(sheetName, rows){
  const headers = HEADERS[sheetName] || [];
  return rows.map(r=>{
    const obj = {};
    headers.forEach((h,i)=> obj[h] = (r[i] !== undefined ? r[i] : ""));
    return obj;
  });
}

function renderTable(containerId, data){
  const container = document.getElementById(containerId);
  if(!container) return;
  if(!data || data.length === 0){ container.innerHTML = '<p class="small">Nenhum dado disponível.</p>'; return; }
  const cols = Object.keys(data[0]);
  let html = '<table><thead><tr>';
  cols.forEach(c => html += `<th>${c}</th>`);
  html += '</tr></thead><tbody>';
  data.forEach(row => {
    html += '<tr>';
    cols.forEach(c => html += `<td>${row[c] ?? ""}</td>`);
    html += '</tr>';
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

function monthlyAgg(data, dateCol, valCol){
  const map = {};
  data.forEach(it=>{
    const dt = parseDateSmart(it[dateCol]);
    if(!dt) return;
    const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
    map[key] = (map[key] || 0) + parseNumber(it[valCol]);
  });
  return Object.keys(map).sort().map(k=>({ month:k, total: map[k] }));
}

let chartBar = null, chartPie = null;
function buildCharts(entradas, saidas){
  const aE = monthlyAgg(entradas, "Data", "Valor");
  const aS = monthlyAgg(saidas, "Data", "Valor");
  const labels = Array.from(new Set([...aE.map(x=>x.month), ...aS.map(x=>x.month)])).sort();
  const labelsFmt = labels.map(l=>{ const [y,m] = l.split('-'); return new Date(+y,+m-1,1).toLocaleString('pt-BR',{month:'short',year:'numeric'}); });
  const mapE = Object.fromEntries(aE.map(x=>[x.month,x.total]));
  const mapS = Object.fromEntries(aS.map(x=>[x.month,x.total]));
  const dataE = labels.map(l=> mapE[l] || 0);
  const dataS = labels.map(l=> mapS[l] || 0);

  const ctxBar = document.getElementById('chartBar').getContext('2d');
  if(chartBar) chartBar.destroy();
  chartBar = new Chart(ctxBar, {
    type: 'bar',
    data: { labels: labelsFmt, datasets: [
      { label: 'Entradas', data: dataE, backgroundColor: '#1366d6' },
      { label: 'Saídas', data: dataS, backgroundColor: '#d23b3b' }
    ]},
    options: { responsive:true, scales:{ y:{ ticks:{ callback: v => fmtBRL(v) } } } }
  });

  const byType = {};
  entradas.forEach(it=>{
    const key = it['Descrição'] || it['Nome'] || 'Outros';
    byType[key] = (byType[key] || 0) + parseNumber(it['Valor']);
  });
  const pieLabels = Object.keys(byType).slice(0,12);
  const pieData = pieLabels.map(k => byType[k]);
  const ctxPie = document.getElementById('chartPie').getContext('2d');
  if(chartPie) chartPie.destroy();
  chartPie = new Chart(ctxPie, { type:'pie', data:{ labels: pieLabels, datasets:[{ data: pieData }] }, options:{ responsive:true }});
}

function renderMonthlyTable(entradas, saidas){
  const e = monthlyAgg(entradas,'Data','Valor');
  const s = monthlyAgg(saidas,'Data','Valor');
  const mapE = Object.fromEntries(e.map(x=>[x.month,x.total]));
  const mapS = Object.fromEntries(s.map(x=>[x.month,x.total]));
  const months = Array.from(new Set([...Object.keys(mapE), ...Object.keys(mapS)])).sort();
  let html = '<table><thead><tr><th>Mês</th><th>Entradas</th><th>Saídas</th><th>Saldo</th></tr></thead><tbody>';
  months.forEach(m=>{
    const eV = mapE[m] || 0;
    const sV = mapS[m] || 0;
    const saldo = eV - sV;
    const [y,mm] = m.split('-');
    const dt = new Date(+y,+mm-1,1);
    html += `<tr><td>${dt.toLocaleString('pt-BR',{month:'long',year:'numeric'})}</td><td>${fmtBRL(eV)}</td><td>${fmtBRL(sV)}</td><td>${fmtBRL(saldo)}</td></tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('monthlyTable').innerHTML = html;
}

async function loadDashboard(){
  try{
    document.getElementById('lastUpdate').textContent = 'Carregando...';
    const rawEntr = await fetchList('entradas');
    const rawSaid = await fetchList('saidas');
    const rawDiz  = await fetchList('dizimistas');
    const rawFix  = await fetchList('fixas');

    const entradas = rowsToObjects(SHEETS.entradas, rawEntr);
    const saidas   = rowsToObjects(SHEETS.saidas, rawSaid);
    const dizimistas = rowsToObjects(SHEETS.dizimistas, rawDiz);
    const despesasFixas = rowsToObjects(SHEETS.fixas, rawFix);

    const totalEntr = entradas.reduce((acc,it)=> acc + parseNumber(it['Valor']), 0);
    const totalSaid = saidas.reduce((acc,it)=> acc + parseNumber(it['Valor']), 0);
    const saldo = totalEntr - totalSaid;

    document.getElementById('totalEntradas').textContent = fmtBRL(totalEntr);
    document.getElementById('totalSaidas').textContent = fmtBRL(totalSaid);
    const sf = document.getElementById('saldoFinal');
    sf.textContent = fmtBRL(saldo);
    sf.style.color = saldo >= 0 ? '#0b9b3a' : '#d23b3b';
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString('pt-BR');

    renderTable('tableEntradas', entradas);
    renderTable('tableSaidas', saidas);
    renderTable('tableDizimistas', dizimistas);
    renderTable('tableDespesasFixas', despesasFixas);

    buildCharts(entradas, saidas);
    renderMonthlyTable(entradas, saidas);

  } catch(err){
    console.error('Erro no dashboard:', err);
    alert('Erro ao carregar dashboard. Veja console para detalhes.');
    document.getElementById('lastUpdate').textContent = 'Erro';
  }
}

async function fetchList(action){
  const url = `${API_URL}?action=${action}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error(`Erro ao buscar ${action}: ${res.status}`);
  const txt = await res.text();
  try { return JSON.parse(txt); } catch(e){ console.error('Erro parse JSON', e, txt); throw e; }
}

async function callGenerateFixed(){
  if(!confirm('Gerar despesas fixas do mês na aba Saídas agora?')) return;
  try{
    const form = new URLSearchParams();
    form.append('action','generate_fixed');
    form.append('sheet','Saídas');
    const res = await fetch(API_URL, { method:'POST', body: form });
    const txt = await res.text();
    if(res.ok) {
      alert('Despesas fixas geradas com sucesso.');
      loadDashboard();
    } else {
      alert('Erro ao gerar despesas fixas: ' + txt);
    }
  } catch(e){
    console.error(e);
    alert('Erro ao gerar despesas fixas (ver console).');
  }
}

document.getElementById('btnRefresh').addEventListener('click', () => loadDashboard());
document.getElementById('btnGenFix').addEventListener('click', () => callGenerateFixed());
loadDashboard();
