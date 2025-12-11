/* dashboard.js — carrega dados para página pública (grafico e resumo) */
/* depends on Chart.js and api.js */

function parseNumber(v){
  if (v == null) return 0;
  if (typeof v === "number") return v;
  let s = String(v).trim();
  s = s.replace(/\s/g,"").replace("R$","").replace(/BRL/g,"");
  if (s.match(/^[0-9]{1,3}(\.[0-9]{3})+,[0-9]+$/)){ s = s.replace(/\./g,"").replace(",","."); }
  else if (s.indexOf(",")>-1 && s.indexOf(".")===-1){ s = s.replace(",","."); }
  s = s.replace(/[^0-9\.\-]/g,"");
  const n = parseFloat(s);
  return isNaN(n)?0:n;
}
function fmtBRL(v){ try { return Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); } catch(e){ return "R$ "+Number(v||0).toFixed(2);} }

async function loadPublicDashboard(){
  try {
    const res = await jsonpCall({ action: "grafico" });
    if (!res) throw new Error("Resposta vazia");
    // montar resumo
    const meses = res.meses || {};
    const keys = Object.keys(meses).sort();
    const labels = keys.map(k => { const [y,m]=k.split("-"); return new Date(parseInt(y),parseInt(m)-1,1).toLocaleString("pt-BR",{month:"short","year":"numeric"}); });
    const entr = keys.map(k => meses[k].entradas||0);
    const said = keys.map(k => meses[k].saidas||0);
    // totals
    const totalE = entr.reduce((a,b)=>a+b,0);
    const totalS = said.reduce((a,b)=>a+b,0);
    const saldo = totalE - totalS;
    const elE = document.getElementById("totalEntradas");
    const elS = document.getElementById("totalSaidas");
    const elSaldo = document.getElementById("saldoFinal");
    if(elE) elE.textContent = fmtBRL(totalE);
    if(elS) elS.textContent = fmtBRL(totalS);
    if(elSaldo){ elSaldo.textContent = fmtBRL(saldo); elSaldo.style.color = saldo>=0? "#0b9b3a":"#d23b3b";}
    // monthly table
    const mt = document.getElementById("monthlyTable");
    if (mt) {
      let html = "<table><thead><tr><th>Mês</th><th>Entradas</th><th>Saídas</th><th>Saldo</th></tr></thead><tbody>";
      keys.forEach((k,i)=> { const e=entr[i]||0; const s=said[i]||0; const sal=e-s; html += `<tr><td>${labels[i]}</td><td>${fmtBRL(e)}</td><td>${fmtBRL(s)}</td><td style="font-weight:700;color:${sal>=0?'#0b9b3a':'#d23b3b'}">${fmtBRL(sal)}</td></tr>`; });
      html += "</tbody></table>";
      mt.innerHTML = html;
    }
    // charts (Chart.js must be loaded)
    const bar = document.getElementById("chartBar");
    if (bar && typeof Chart !== "undefined") {
      try { if(window._publicBar) window._publicBar.destroy(); } catch(e){}
      window._publicBar = new Chart(bar.getContext("2d"), { type:"bar", data:{ labels, datasets:[ {label:"Entradas", data:entr},{label:"Saídas", data:said} ] }, options:{ responsive:true } });
    }
  } catch (err) {
    console.error("Erro loadPublicDashboard:", err);
    const mt = document.getElementById("monthlyTable");
    if (mt) mt.innerHTML = "<p class='small'>Erro ao carregar dados públicos.</p>";
  }
}

document.addEventListener("DOMContentLoaded", ()=>{ loadPublicDashboard(); });
