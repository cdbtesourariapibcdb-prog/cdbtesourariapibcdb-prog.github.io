/* admin.js — painel administrativo */

/* helpers */
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
    const values = [...document.querySelectorAll("#modalBody input")].map(i => i.value.trim());
    onSave(values);
    closeModal();
  };
  document.getElementById("modal").style.display = "flex";
}

function closeModal(){
  document.getElementById("modal").style.display = "none";
}

/* add item */
async function addItem(sheet, fields){
  openModal(`Adicionar — ${sheet}`, fields, async (values) => {
    try {
      const r = await jsonpCall({
        action: "add",
        sheet,
        data: JSON.stringify(values)
      });
      if (r === "added") {
        alert("Adicionado!");
        location.reload();
      } else alert("Erro: " + r);
    } catch(e){
      alert("Erro ao conectar API: " + e);
    }
  });
}

/* delete item */
async function deleteItem(sheet, row){
  if (!confirm("Excluir?")) return;
  try {
    const r = await jsonpCall({ action: "delete", sheet, row });
    if (r === "deleted") {
      alert("Removido!");
      location.reload();
    } else alert("Erro: " + r);
  } catch(e){
    alert("Erro ao conectar API: " + e);
  }
}

/* fetch list */
async function loadList(sheet, containerId){
  try {
    const data = await jsonpCall({ action: sheet });

    const wrap = document.getElementById(containerId);

    if (!wrap) return;
    if (!Array.isArray(data) || data.length === 0){
      wrap.innerHTML = "<p>Nenhum dado.</p>";
      return;
    }

    const maxCols = Math.max(...data.map(r => r.length));

    let html = "<table><thead><tr>";
    for (let c = 0; c < maxCols; c++)
      html += `<th>Col ${c+1}</th>`;
    html += `<th>Ações</th></tr></thead><tbody>`;

    data.forEach((row, idx) => {
      html += "<tr>";
      for (let c = 0; c < maxCols; c++)
        html += `<td>${row[c] !== undefined ? row[c] : ""}</td>`;
      html += `<td><button onclick="deleteItem('${sheet}',${idx+2})">Excluir</button></td>`;
      html += "</tr>";
    });

    html += "</tbody></table>";
    wrap.innerHTML = html;

  } catch(e){
    console.error("loadList error", e);
    document.getElementById(containerId).innerHTML = "<p>Erro ao carregar.</p>";
  }
}

/* wire buttons */
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
    if (!confirm("Gerar despesas fixas agora?")) return;
    const r = await jsonpCall({ action: "generate_fixed" });
    if (r === "generated_fixed") alert("Gerado!");
    else alert("Erro: " + r);
    location.reload();
  });

  loadList("Entradas", "tableEntradas");
  loadList("Saídas", "tableSaidas");
  loadList("Dizimistas", "tableDizimistas");
  loadList("Despesas Fixas", "tableFixas");
});
