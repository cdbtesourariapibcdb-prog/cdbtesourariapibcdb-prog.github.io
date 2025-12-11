/* admin.js — painel administrativo (usa jsonpCall from api.js) */

function openModal(title, fields, onSave){
  document.getElementById("modalTitle").innerText = title;
  const body = document.getElementById("modalBody");
  body.innerHTML = "";

  fields.forEach(f => {
    const div = document.createElement("div");
    div.innerHTML = `<label>${f}</label><input data-field="${f}" />`;
    body.appendChild(div);
  });

  document.getElementById("modalSave").onclick = () => {
    const values = [...document.querySelectorAll("#modalBody input")].map(i=>i.value.trim());
    onSave(values);
    closeModal();
  };

  document.getElementById("modal").style.display = "flex";
}

function closeModal(){ 
  document.getElementById("modal").style.display = "none"; 
}

async function addItem(sheet, fields){
  openModal(`Adicionar — ${sheet}`, fields, async (values)=>{
    try {
      const r = await jsonpCall({ action:"add", sheet, data: JSON.stringify(values) });
      if (r === "added") { alert("Adicionado!"); location.reload(); }
      else alert("Erro: "+r);
    } catch(e){ alert("Erro ao conectar API: "+e.message); }
  });
}

async function deleteItem(sheet, row){
  if(!confirm("Excluir?")) return;
  try {
    const r = await jsonpCall({ action:"delete", sheet, row });
    if (r === "deleted") { alert("Removido"); location.reload(); } 
    else alert("Erro: "+r);
  } catch(e){ alert("Erro ao conectar API: "+e.message); }
}

async function loadList(sheet, containerId){
  try {
    const data = await jsonpCall({ action: sheet.toLowerCase() });
    const wrap = document.getElementById(containerId);
    if(!wrap) return;

    if(!Array.isArray(data) || data.length===0){
      wrap.innerHTML = "<p>Nenhum dado.</p>";
      return;
    }

    let html = "<table><thead><tr>";

    const maxCols = Math.max(...data.map(r=>r.length));
    for(let c=0;c<maxCols;c++) html += `<th>Col ${c+1}</th>`;
    html += `<th>Ações</th></tr></thead><tbody>`;

    data.forEach((row, idx) => {
      html += "<tr>";
      for(let c=0;c<maxCols;c++){
        html += `<td>${row[c] ?? ""}</td>`;
      }
      html += `<td><button onclick="deleteItem('${sheet}',${idx+2})">Excluir</button></td>`;
      html += "</tr>";
    });

    html += "</tbody></table>";
    wrap.innerHTML = html;
  } catch(e){ 
    wrap.innerHTML = "<p>Erro ao carregar.</p>"; 
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnAddEntrada")?.addEventListener("click", () =>
    addItem("Entradas", ["Data","Descrição","Valor","Categoria"])
  );

  document.getElementById("btnAddSaida")?.addEventListener("click", () =>
    addItem("Saídas", ["Data","Despesa","Valor","Observação"])
  );

  document.getElementById("btnAddDizimista")?.addEventListener("click", () =>
    addItem("Dizimistas", ["Nome","Telefone","Dízimo"])
  );

  document.getElementById("btnAddFixa")?.addEventListener("click", () =>
    addItem("Despesas Fixas", ["Despesa","Valor","Dia","Categoria"])
  );

  document.getElementById("btnGenerateFixedUI")?.addEventListener("click", async () => {
    if(!confirm("Gerar todas as despesas fixas agora?")) return;
    const r = await jsonpCall({ action:"generate_fixed" });
    if (r === "generated_fixed") { alert("Gerado"); location.reload(); }
    else alert("Erro: "+r);
  });

  loadList("Entradas", "tableEntradas");
  loadList("Saídas", "tableSaidas");
  loadList("Dizimistas", "tableDizimistas");
  loadList("Despesas Fixas", "tableFixas");
});
