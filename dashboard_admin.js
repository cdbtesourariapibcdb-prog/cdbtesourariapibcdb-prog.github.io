/****************************************************
 * dashboard_admin.js — VERSÃO OFICIAL GITHUB PAGES
 * Comunicação com Google Apps Script usando JSONP
 ****************************************************/

const API = "https://script.google.com/macros/s/AKfycbzdeHEsqNvldjx-38-W3ynWyC_pLi5OvH2VCCxmNyg/dev";

/****************************************************
 * JSONP HELPER — permite GET sem CORS
 ****************************************************/
function jsonp(params = {}) {
  return new Promise((resolve, reject) => {
    const cb = "cb_" + Math.random().toString(36).substring(2, 10);
    params.callback = cb;

    const url =
      API +
      "?" +
      Object.keys(params)
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
        .join("&");

    const script = document.createElement("script");
    script.src = url;
    script.async = true;

    window[cb] = (data) => {
      resolve(data);
      cleanup();
    };

    script.onerror = () => {
      reject("Erro JSONP");
      cleanup();
    };

    function cleanup() {
      try {
        delete window[cb];
      } catch (e) {}
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    document.body.appendChild(script);

    setTimeout(() => {
      if (window[cb]) {
        cleanup();
        reject("timeout");
      }
    }, 15000);
  });
}

/****************************************************
 * MODAL — abrir / fechar
 ****************************************************/
function openModal(title, fields, callback) {
  document.getElementById("modalTitle").innerText = title;

  const body = document.getElementById("modalBody");
  body.innerHTML = "";

  fields.forEach((f) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <label>${f}</label>
      <input data-field="${f}">
    `;
    body.appendChild(div);
  });

  document.getElementById("modalSave").onclick = () => {
    const inputs = [...document.querySelectorAll("#modalBody input")];
    const values = inputs.map((i) => i.value.trim());
    callback(values);
    closeModal();
  };

  document.getElementById("modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

/****************************************************
 * ADICIONAR ITEM
 ****************************************************/
async function addItem(sheet, fields) {
  openModal("Adicionar — " + sheet, fields, async (values) => {
    const result = await jsonp({
      action: "add",
      sheet: sheet,
      data: JSON.stringify(values),
    });

    if (result === "added") {
      alert("Adicionado com sucesso!");
      location.reload();
    } else {
      alert("Erro ao adicionar: " + result);
    }
  });
}

/****************************************************
 * EXCLUIR ITEM
 ****************************************************/
async function deleteItem(sheet, row) {
  if (!confirm("Deseja excluir esta linha?")) return;

  const result = await jsonp({
    action: "delete",
    sheet,
    row,
  });

  if (result === "deleted") {
    alert("Removido!");
    location.reload();
  } else {
    alert("Erro ao excluir: " + result);
  }
}

/****************************************************
 * GERAR DESPESAS FIXAS
 ****************************************************/
async function gerarDespesasFixas() {
  const result = await jsonp({
    action: "generate_fixed",
  });

  if (result === "generated_fixed") {
    alert("Despesas fixas geradas!");
    location.reload();
  } else {
    alert("Erro: " + result);
  }
}

/****************************************************
 * EVENTOS — ligar botões do HTML
 ****************************************************/
document.addEventListener("DOMContentLoaded", () => {
  // Entradas
  const b1 = document.getElementById("btnAddEntrada");
  if (b1)
    b1.onclick = () =>
      addItem("Entradas", ["Data", "Descrição", "Valor", "Categoria"]);

  // Saídas
  const b2 = document.getElementById("btnAddSaida");
  if (b2)
    b2.onclick = () =>
      addItem("Saídas", ["Data", "Despesa", "Valor", "Observação"]);

  // Dizimistas
  const b3 = document.getElementById("btnAddDizimista");
  if (b3)
    b3.onclick = () =>
      addItem("Dizimistas", ["Nome", "Telefone", "Dízimo Mensal"]);

  // Fixas
  const b4 = document.getElementById("btnAddFixa");
  if (b4)
    b4.onclick = () =>
      addItem("Despesas Fixas", ["Despesa", "Valor", "Dia", "Categoria"]);

  // Gerar fixas
  const b5 = document.getElementById("btnGenerateFixedUI");
  if (b5) b5.onclick = gerarDespesasFixas;
});
