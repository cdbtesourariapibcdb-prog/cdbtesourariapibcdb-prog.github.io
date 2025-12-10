/***********************************************
 * script.js - Dashboard Avançado (completo)
 * - Requisitos: PapaParse, Chart.js, SheetJS, html2pdf (CDNs estão no index.html)
 ***********************************************/

/* -----------------------
   LINK DAS 3 ABAS CSV
   Substitua aqui se mudar a planilha no futuro
   ----------------------- */
const URL_ENTRADAS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSh0vNTCXhhO5EzswiYLCgKAyqEqUv3WeOUJh60qBmLeCaAK-rUhAp4dvZMxTT9dsPO2mTYYPThlGQD/pub?gid=0&single=true&output=csv";
const URL_SAIDAS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSh0vNTCXhhO5EzswiYLCgKAyqEqUv3WeOUJh60qBmLeCaAK-rUhAp4dvZMxTT9dsPO2mTYYPThlGQD/pub?gid=269334175&single=true&output=csv";
const URL_DIZIMISTAS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSh0vNTCXhhO5EzswiYLCgKAyqEqUv3WeOUJh60qBmLeCaAK-rUhAp4dvZMxTT9dsPO2mTYYPThlGQD/pub?gid=250812166&single=true&output=csv";

/* -----------------------
   UTILITÁRIOS
   ----------------------- */
function parseNumber(v) {
  if (v == null) return 0;
  // remove espaços e símbolos (aceita "1.234,56" e "1234.56")
  const cleaned = String(v).replace(/\s/g, "").replace(/\u00A0/g, "").replace(/R\$|BRL/g, "");
  // se contém vírgula e ponto, considera ponto milhares e vírgula decimal
  if (cleaned.match(/[0-9]+\.[0-9]{3},/)) {
    return parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
  }
  // se contém apenas vírgula, troca por ponto
  if (cleaned.indexOf(",") > -1 && cleaned.indexOf(".") === -1) {
    return parseFloat(cleaned.replace(",", "."));
  }
  // remove tudo exceto números, ponto e sinal
  const only = cleaned.replace(/[^0-9\.-]/g, "");
  const num = parseFloat(only);
  return isNaN(num) ? 0 : num;
}

function parseDateSmart(str) {
  if (!str) return null;
  // tenta dd/mm/yyyy ou yyyy-mm-dd
  str = String(str).trim();
  // dd/mm/yyyy
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    let day = parseInt(dmy[1], 10);
    let month = parseInt(dmy[2], 10) - 1;
    let year = parseInt(dmy[3], 10);
    if (year < 100) year += 2000;
    return new Date(year, month, day);
  }
  // yyyy-mm-dd or ISO
  const iso = Date.parse(str);
  if (!isNaN(iso)) return new Date(iso);
  return null;
}

function fmtBRL(v) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* -----------------------
   CARREGAMENTO CSV (PapaParse)
   ----------------------- */
async function loadCsvToJson(url) {
  const txt = await fetch(url).then(r => r.text());
  return new Promise((res, rej) => {
    Papa.parse(txt, {
      header: true,
      skipEmptyLines: true,
      complete: results => res(results.data),
      error: err => rej(err)
    });
  });
}

/* -----------------------
   RENDER HELPERS
   ----------------------- */
function renderTableFromArray(containerId, data) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  if (!data || data.length === 0) {
    container.innerHTML = "<p>Nenhum dado disponível.</p>";
    return;
  }
  const cols = Object.keys(data[0]);
  let html = "<table><thead><tr>";
  cols.forEach(c => html += `<th>${c}</th>`);
  html += "</tr></thead><tbody>";
  data.forEach(row => {
    html += "<tr>";
    cols.forEach(c => html += `<td>${(row[c] ?? "")}</td>`);
    html += "</tr>";
  });
  html += "</tbody></table>";
  container.innerHTML = html;
}

/* -----------------------
   AGREGAÇÕES E ESTATÍSTICAS
   ----------------------- */
function sumColumn(data, colName) {
  if (!data) return 0;
  return data.reduce((acc, item) => acc + parseNumber(item[colName]), 0);
}

function groupMonthlySum(data, dateCol, valueCol) {
  const map = {}; // "YYYY-MM" -> {entradas:..., saidas:...}
  data.forEach(item => {
    const dt = parseDateSmart(item[dateCol]);
    if (!dt) return;
    const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`;
    map[key] = map[key] || 0;
    map[key] += parseNumber(item[valueCol]);
  });
  // order by month asc
  const keys = Object.keys(map).sort();
  return keys.map(k => ({ month: k, total: map[k] }));
}

/* -----------------------
   MAIN
   ----------------------- */
let entradasRaw = [], saidasRaw = [], dizimistasRaw = [];
let chartBar = null, chartPie = null;

async function refreshAll() {
  try {
    document.getElementById("lastUpdate").textContent = "Carregando...";
    const [entradas, saidas, dizimistas] = await Promise.all([
      loadCsvToJson(URL_ENTRADAS),
      loadCsvToJson(URL_SAIDAS),
      loadCsvToJson(URL_DIZIMISTAS)
    ]);
    entradasRaw = entradas;
    saidasRaw = saidas;
    dizimistasRaw = dizimistas;

    renderAll();
    populateFilters();
    document.getElementById("lastUpdate").textContent = new Date().toLocaleString("pt-BR");
  } catch (err) {
    console.error("Erro ao carregar CSV:", err);
    alert("Erro ao carregar dados. Verifique se os links CSV estão públicos.");
    document.getElementById("lastUpdate").textContent = "Erro";
  }
}

function renderAll() {
  // Totais
  const totalEntradas = sumColumn(entradasRaw, "Valor");
  const totalSaidas = sumColumn(saidasRaw, "Valor");
  const saldo = totalEntradas - totalSaidas;

  document.getElementById("totalEntradas").textContent = fmtBRL(totalEntradas);
  document.getElementById("totalSaidas").textContent = fmtBRL(totalSaidas);
  const sf = document.getElementById("saldoFinal");
  sf.textContent = fmtBRL(saldo);
  sf.className = saldo >= 0 ? "green" : "red";

  // Tables full (before filters)
  applyFiltersAndRender();
  renderDizimistasCards();
  renderMonthlyTable();
  buildCharts();
}

/* -----------------------
   FILTERS
   ----------------------- */
function populateFilters() {
  const years = new Set();
  entradasRaw.concat(saidasRaw).forEach(r => {
    const dt = parseDateSmart(r["Data"] || r["data"] || r["Date"]);
    if (dt) years.add(dt.getFullYear());
  });
  const arr = Array.from(years).sort((a,b)=>b-a);
  const sel = document.getElementById("filterYear");
  sel.innerHTML = `<option value="">Todos</option>` + arr.map(y => `<option value="${y}">${y}</option>`).join("");
}

function applyFiltersAndRender() {
  const year = document.getElementById("filterYear").value;
  const month = document.getElementById("filterMonth").value;
  const search = (document.getElementById("globalSearch").value || "").toLowerCase().trim();

  function filterDataset(dataset) {
    return dataset.filter(item => {
      // year/month filter
      const dt = parseDateSmart(item["Data"] || item["data"] || item["Date"]);
      if (year && (!dt || dt.getFullYear() !== parseInt(year))) return false;
      if (month && (!dt || dt.getMonth()+1 !== parseInt(month))) return false;
      // search filter across all fields
      if (search) {
        return Object.values(item).some(v => String(v).toLowerCase().includes(search));
      }
      return true;
    });
  }

  const entradasFiltered = filterDataset(entradasRaw);
  const saidasFiltered = filterDataset(saidasRaw);
  const dizimistasFiltered = dizimistasRaw; // dizimistas normalmente not filtered by date

  renderTableFromArray("tableEntradas", entradasFiltered);
  renderTableFromArray("tableSaidas", saidasFiltered);
  renderTableFromArray("tableDizimistas", dizimistasFiltered);

  // update charts with filtered data
  updateCharts(entradasFiltered, saidasFiltered);
}

/* -----------------------
   CHARTS
   ----------------------- */
function buildCharts() {
  const ctx = document.getElementById("chartEntradasSaidas").getContext("2d");
  if (chartBar) chartBar.destroy();
  chartBar = new Chart(ctx, {
    type: "bar",
    data: { labels: [], datasets: [] },
    options: {
      responsive:true,
      scales: { x: { stacked:true }, y: { stacked:false, beginAtZero:true, ticks:{callback: v => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} } },
      plugins: { legend:{position:'top'} }
    }
  });

  const ctx2 = document.getElementById("chartPie").getContext("2d");
  if (chartPie) chartPie.destroy();
  chartPie = new Chart(ctx2, {
    type: "pie",
    data: { labels: [], datasets: [{ data: [] }] },
    options: { responsive:true }
  });

  // initial populate with all data
  updateCharts(entradasRaw, saidasRaw);
}

function updateCharts(entradas, saidas) {
  // monthly aggregation (month label)
  function aggMonthly(data, dateCol, valueCol) {
    const map = {};
    data.forEach(it => {
      const dt = parseDateSmart(it[dateCol] || it["Data"]);
      if (!dt) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`;
      map[key] = (map[key] || 0) + parseNumber(it[valueCol]);
    });
    return Object.keys(map).sort().map(k => ({ month:k, total: map[k] }));
  }

  const aEntr = aggMonthly(entradas, "Data", "Valor");
  const aSaid = aggMonthly(saidas, "Data", "Valor");

  // unified labels (month keys)
  const labels = Array.from(new Set([...aEntr.map(x=>x.month), ...aSaid.map(x=>x.month)])).sort();
  const labelsFmt = labels.map(l => {
    const [y,m] = l.split("-");
    const dt = new Date(parseInt(y), parseInt(m)-1, 1);
    return dt.toLocaleString("pt-BR", { month:"short", year:"numeric" });
  });

  const mapEntr = Object.fromEntries(aEntr.map(a=>[a.month,a.total]));
  const mapSaid = Object.fromEntries(aSaid.map(a=>[a.month,a.total]));

  const dataEntr = labels.map(l => mapEntr[l] || 0);
  const dataSaid = labels.map(l => mapSaid[l] || 0);

  // update bar chart
  if (chartBar) {
    chartBar.data.labels = labelsFmt;
    chartBar.data.datasets = [
      { label: "Entradas", data: dataEntr, backgroundColor: "#1f7aec" },
      { label: "Saídas", data: dataSaid, backgroundColor: "#d23b3b" }
    ];
    chartBar.update();
  }

  // pie (Entradas by Descrição or Nome) - simple distribution by "Descrição" if exists
  // aggregate entradas by Descrição or Nome
  const byType = {};
  entradas.forEach(it => {
    const key = it["Descrição"] || it["Descricao"] || it["Nome"] || "Outros";
    byType[key] = (byType[key] || 0) + parseNumber(it["Valor"]);
  });
  const pieLabels = Object.keys(byType).slice(0,12); // limit
  const pieData = pieLabels.map(k => byType[k]);
  if (chartPie) {
    chartPie.data.labels = pieLabels;
    chartPie.data.datasets[0].data = pieData;
    chartPie.update();
  }
}

/* -----------------------
   DIZIMISTAS CARDS
   ----------------------- */
function renderDizimistasCards(){
  const container = document.getElementById("dizimistasOverview");
  container.innerHTML = "";
  // compute total dizimado por nome (entradas)
  const map = {};
  entradasRaw.forEach(it => {
    const nome = (it["Nome"] || it["nome"] || it["Nome do Dizimista"] || "").trim();
    if (!nome) return;
    map[nome] = (map[nome] || 0) + parseNumber(it["Valor"]);
  });
  // merge with dizimistas list to show phone/obs
  dizimistasRaw.forEach(d => {
    const nome = (d["Nome"] || d["nome"] || "").trim();
    if (!nome) return;
    const total = map[nome] || 0;
    const tel = d["Telefone"] || d["telefone"] || d["Contato"] || "";
    const obs = d["Observações"] || d["Observacoes"] || d["Observacao"] || "";
    const el = document.createElement("div");
    el.className = "card dcard";
    el.innerHTML = `<strong>${nome}</strong><div class="small">${tel}</div>
      <div style="margin-top:8px"><b>Total (toda planilha):</b> ${fmtBRL(total)}</div>
      <div class="small" style="margin-top:6px">${obs}</div>`;
    container.appendChild(el);
  });

  // Also add top contributors if there are names outside dizimistas list
  const extras = Object.keys(map).filter(n => !dizimistasRaw.some(d => ((d["Nome"]||"").trim()) === n));
  if (extras.length) {
    extras.slice(0,8).forEach(n => {
      const total = map[n] || 0;
      const el = document.createElement("div");
      el.className = "card dcard";
      el.innerHTML = `<strong>${n}</strong>
        <div style="margin-top:8px"><b>Total:</b> ${fmtBRL(total)}</div>`;
      container.appendChild(el);
    });
  }
}

/* -----------------------
   MONTHLY TABLE
   ----------------------- */
function renderMonthlyTable(){
  // combine months from both entradas and saidas
  const entr = groupMonthlySum(entradasRaw, "Data", "Valor");
  const said = groupMonthlySum(saidasRaw, "Data", "Valor");
  const mapEntr = Object.fromEntries(entr.map(e=>[e.month,e.total]));
  const mapSaid = Object.fromEntries(said.map(s=>[s.month,s.total]));
  const months = Array.from(new Set([...Object.keys(mapEntr), ...Object.keys(mapSaid)])).sort();

  let html = "<table><thead><tr><th>Mês</th><th>Total Entradas</th><th>Total Saídas</th><th>Saldo</th></tr></thead><tbody>";
  months.forEach(m => {
    const e = mapEntr[m] || 0;
    const s = mapSaid[m] || 0;
    const saldo = e - s;
    const dtParts = m.split("-");
    const dt = new Date(parseInt(dtParts[0]), parseInt(dtParts[1]) - 1, 1);
    html += `<tr><td>${dt.toLocaleString("pt-BR",{month:"long", year:"numeric"})}</td>
      <td>${fmtBRL(e)}</td><td>${fmtBRL(s)}</td><td class="${saldo>=0?'green':'red'}">${fmtBRL(saldo)}</td></tr>`;
  });
  html += "</tbody></table>";
  document.getElementById("monthlyTable").innerHTML = html;
}

/* -----------------------
   EXPORT (PDF & Excel)
   ----------------------- */
document.getElementById("btnPdf").addEventListener("click", () => {
  const opt = { margin:0.3, filename:`relatorio_tesouraria_${new Date().toISOString().slice(0,10)}.pdf`, image:{type:'jpeg',quality:0.95}, html2canvas:{scale:1.5}, jsPDF:{unit:'in',format:'a4',orientation:'portrait'} };
  // export main
  html2pdf().set(opt).from(document.querySelector("main")).save();
});

document.getElementById("btnExcel").addEventListener("click", () => {
  // create workbook with three sheets
  const wb = XLSX.utils.book_new();
  function pushSheet(name, arr) {
    if (!arr || arr.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(arr);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  pushSheet("Entradas", entradasRaw);
  pushSheet("Saidas", saidasRaw);
  pushSheet("Dizimistas", dizimistasRaw);
  XLSX.writeFile(wb, `tesouraria_${new Date().toISOString().slice(0,10)}.xlsx`);
});

/* -----------------------
   UI EVENTS
   ----------------------- */
document.getElementById("applyFilters").addEventListener("click", applyFiltersAndRender);
document.getElementById("globalSearch").addEventListener("keyup", (e)=>{ if(e.key==="Enter") applyFiltersAndRender(); });
document.getElementById("toggleTheme").addEventListener("click", ()=>{
  const root = document.body;
  const t = root.getAttribute("data-theme");
  root.setAttribute("data-theme", t === "light" ? "dark" : "light");
});

/* -----------------------
   INIT
   ----------------------- */
refreshAll();




