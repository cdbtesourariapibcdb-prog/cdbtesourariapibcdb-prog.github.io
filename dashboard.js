/****************************************************
 * dashboard.js — Gráficos e Resumo · PIB CDB
 * Requer Chart.js carregado no HTML
 ****************************************************/

const API_EXEC_URL = "https://script.google.com/macros/s/AKfycbzV1eTn_eoldgPtfOlAZRAlJGQoK2WU1BG-cixCKEzv_nn_IxYOSEaCpyOLWWG57JLv/exec";

/* JSONP helper */
function jsonpAPI(params={}) {
  return new Promise((resolve,reject)=>{
    const cb = 'cb_'+Math.random().toString(36).slice(2);
    params.callback = cb;
    const url = API_EXEC_URL + '?' + Object.keys(params).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
    const s = document.createElement('script');
    s.src = url; s.async = true;
    window[cb] = (data)=>{ resolve(data); cleanup(); };
    s.onerror = ()=>{ cleanup(); reject(new Error('JSONP error')); };
    function cleanup(){ try{ delete window[cb]; }catch(e){} if(s.parentNode) s.parentNode.removeChild(s); }
    document.body.appendChild(s);
    setTimeout(()=> { if(window[cb]) { cleanup(); reject(new Error('timeout')); } },15000);
  });
}

/* helpers */
function parseNumber(v){ if(v==null) return 0; if(typeof v==='number') return v; let s=String(v).trim(); s=s.replace(/\s/g,'').replace('R$','').replace(/BRL/g,''); if(s.match(/^[0-9]{1,3}(\.[0-9]{3})+,[0-9]+$/)){ s=s.replace(/\./g,'').replace(',','.'); } else if(s.indexOf(',')>-1 && s.indexOf('.')===-1){ s=s.replace(',','.'); } s=s.replace(/[^0-9\.\-]/g,''); const n=parseFloat(s); return isNaN(n)?0:n; }
function fmtBRL(v){ try{return Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}catch(e){return 'R$ '+Number(v||0).toFixed(2);} }
function parseDateSmart(str){ if(!str) return null; if(str instanceof Date) return str; str=String(str).trim(); const dmy=str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/); if(dmy){ let day=parseInt(dmy[1],10); let month=parseInt(dmy[2],10)-1; let year=parseInt(dmy[3],10); if(year<100) year+=2000; return new Date(year,month,day); } const iso=Date.parse(str); if(!isNaN(iso)) return new Date(iso); return null; }

/* charts */
let chartBar=null, chartPieE=null, chartPieS=null;

function buildBar(ctxEl, labels, dataE, dataS){
  if(!ctxEl) return;
  const ctx=ctxEl.getContext('2d');
  if(chartBar) chartBar.destroy();
  chartBar = new Chart(ctx, { type:'bar', data:{ labels, datasets:[ {label:'Entradas', data:dataE}, {label:'Saídas', data:dataS} ] }, options:{ responsive:true, scales:{ y:{ beginAtZero:true, ticks:{ callback: v => fmtBRL(v) } } } } });
}
function buildPie(ctxEl, labels, data){
  if(!ctxEl) return null;
  const ctx=ctxEl.getContext('2d');
  return new Chart(ctx, { type:'pie', data:{ labels, datasets:[{ data }] }, options:{ responsive:true } });
}

/* render */
function renderFromData(res){
  if(!res) return;
  const mesesObj = res.meses || {};
  const catE = res.categorias_entrada || {};
  const catS = res.categorias_saida || {};

  const months = Object.keys(mesesObj).sort();
  const labels = months.map(k => { const [y,m]=k.split('-'); return new Date(parseInt(y),parseInt(m)-1,1).toLocaleString('pt-BR',{month:'short', year:'numeric'}); });
  const dataE = months.map(k => mesesObj[k].entradas||0);
  const dataS = months.map(k => mesesObj[k].saidas||0);

  document.getElementById('totalEntradas') && (document.getElementById('totalEntradas').textContent = fmtBRL(dataE.reduce((a,b)=>a+b,0)));
  document.getElementById('totalSaidas') && (document.getElementById('totalSaidas').textContent = fmtBRL(dataS.reduce((a,b)=>a+b,0)));
  const saldo = (dataE.reduce((a,b)=>a+b,0)) - (dataS.reduce((a,b)=>a+b,0));
  if(document.getElementById('saldoFinal')){ const el=document.getElementById('saldoFinal'); el.textContent = fmtBRL(saldo); el.style.color = saldo>=0? '#0b9b3a':'#d23b3b'; }
  if(document.getElementById('lastUpdate')) document.getElementById('lastUpdate').textContent = new Date().toLocaleString('pt-BR');

  // monthly table
  if(document.getElementById('monthlyTable')){
    let html = '<table><thead><tr><th>Mês</th><th>Entradas</th><th>Saídas</th><th>Saldo</th></tr></thead><tbody>';
    months.forEach((k,i)=>{
      const e = dataE[i]||0; const s = dataS[i]||0; const sal = e-s;
      html += `<tr><td>${labels[i]}</td><td>${fmtBRL(e)}</td><td>${fmtBRL(s)}</td><td style="font-weight:700;color:${sal>=0?'#0b9b3a':'#d23b3b'}">${fmtBRL(sal)}</td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('monthlyTable').innerHTML = html;
  }

  // charts
  buildBar(document.getElementById('chartBar'), labels, dataE, dataS);
  if(chartPieE) try{ chartPieE.destroy(); }catch(e){}
  if(chartPieS) try{ chartPieS.destroy(); }catch(e){}
  chartPieE = buildPie(document.getElementById('chartPie'), Object.keys(catE), Object.keys(catE).map(k=>catE[k]));
  chartPieS = buildPie(document.getElementById('chartPieSaidas') || document.getElementById('chartPie2'), Object.keys(catS), Object.keys(catS).map(k=>catS[k]));
}

/* load */
async function loadDashboard(){
  try{
    const res = await jsonpAPI({ action: 'grafico' });
    renderFromData(res);
  }catch(err){
    console.error('Erro ao carregar grafico', err);
    if(document.getElementById('monthlyTable')) document.getElementById('monthlyTable').innerHTML = '<p class="small">Erro ao carregar gráficos.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if(document.getElementById('totalEntradas')) document.getElementById('totalEntradas').textContent = 'Carregando...';
  if(document.getElementById('totalSaidas')) document.getElementById('totalSaidas').textContent = 'Carregando...';
  if(document.getElementById('saldoFinal')) document.getElementById('saldoFinal').textContent = 'Carregando...';
  if(document.getElementById('lastUpdate')) document.getElementById('lastUpdate').textContent = 'Carregando...';
  loadDashboard();
});
