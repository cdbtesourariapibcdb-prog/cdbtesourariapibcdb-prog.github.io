/****************************************************
 * dashboard_admin.js
 * Controla o painel administrativo:
 * - Adicionar / editar / deletar entradas
 * - Idem para saídas, dizimistas e despesas fixas
 * - Gera despesas fixas automaticamente/****************************************************
 * dashboard_admin.js — versão corrigida
 * Compatível com JSONP (GET) — Funciona no GitHub Pages
 ****************************************************/

const API = "https://script.google.com/macros/s/AKfycbzdeHEsqNvldjx-38-W3ynWyC_pLi5OvH2VCCxmNyg/dev";

/****************************************************
 * JSONP HELPER
 ****************************************************/
function jsonp(params = {}) {
  return new Promise((resolve, reject) => {
    const cb = "cb_" + Math.random().toString(36).slice(2);
    params.callback = cb;

    const url = API + "?" + Object.keys(params)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
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
      try { delete window[cb]; } catch (e) {}
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
 * ABRIR MODAL
 ****************************************************/
function openModal(title, fields, callback) {
  document.getElementById("modalTitle").innerText = title;

  const body = document.getElementById("modalBody");
  body.innerHTML = "";

  fields.forEach(f => {
    const div = document.createElement("div");
    div.innerHTML = `
      <label>${f}</label>
      <input data-field="${f}">
    `;
    body.appendChild(div);
  });

  document.getElementById("modalSave").onclick = () => {
    const inputs = [...document.querySelectorAll("#modalBody input")];
    const values = inputs.map(i => i.value.trim());
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
  openModal("Adicionar – " + sheet, fields, async (values) => {
    const result = await jsonp({
      action: "add",
      sheet: sheet,
      data: JSON.stringify(values)
    });

    if (result === "added") {
      alert("Adicionado com sucesso!");
      location.reload();
    } else {
      alert("Erro: " + result);
    }
  });
}

/****************************************************
 * EXCLUIR ITEM
 ****************************************************/
async function deleteItem(sheet, row) {
  if (!confirm("Excluir esta linha?")) return;

  const res = await jsonp({
    action: "delete",
    sheet,
    row
  });

  if (res === "deleted") {
    alert("Removido!");
    location.reload();
  } else {
    alert("Erro ao excluir: " + res);
  }
}

/****************************************************
 * GERAR DESPESAS FIXAS
 ****************************************************/
async function gerarDespesasFixas() {
  const res = await jsonp({
    action: "generate_fixed"
  });

  if (res === "generated_fixed") {
    alert("Despesas fixas geradas!");
    location.reload();
  } else {
    alert("Erro: " + res);
  }
}

/****************************************************
 * BOTÕES
 ****************************************************/
document.addEventListener("DOMContentLoaded", () => {

  // ENTRADAS
  const b1 = document.getElementById("btnAddEntrada");
  if (b1) b1.onclick = () =>
    addItem("Entradas", ["Data", "Descrição", "Valor", "Categoria"]);

  // SAÍDAS
  const b2 = document.getElementById("btnAddSaida");
  if (b2) b2.onclick = () =>
    addItem("Saídas", ["Data", "Despesa", "Valor", "Observação"]);

  // DIZIMISTAS
  const b3 = document.getElementById("btnAddDizimista");
  if (b3) b3.onclick = () =>
    addItem("Dizimistas", ["Nome", "Telefone", "Dízimo Mensal"]);

  // FIXAS
  const b4 = document.getElementById("btnAddFixa");
  if (b4) b4.onclick = () =>
    addItem("Despesas Fixas", ["Despesa", "Valor", "Dia", "Categoria"]);

  // GERAR FIXAS
  const b5 = document.getElementById("btnGenerateFixedUI");
  if (b5) b5.onclick = gerarDespesasFixas;
});

 ****************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbzV1eTn_eoldgPtfOlAZRAlJGQoK2WU1BG-cixCKEzv_nn_IxYOSEaCpyOLWWG57JLv/exec";

/****************************************************
 * ENVIAR DADOS PARA A API
 ****************************************************/
async function sendToAPI(action, sheet, data = null, row = null) {
  const form = new FormData();
  form.append("action", action);
  form.append("sheet", sheet);

  if (data) form.append("data", JSON.stringify(data));
  if (row) form.append("row", row);

  try {
    const res = await fetch(API_URL, { method: "POST", body: form });
    return await res.text();
  } catch (err) {
    console.error("Erro ao conectar API:", err);
    return "fetch_error";
  }
}

/****************************************************
 * ABRIR FORMULÁRIO (MODAL)
 ****************************************************/
function openModal(title, fields, callback) {
  document.getElementById("modalTitle").innerText = title;

  const body = document.getElementById("modalBody");
  body.innerHTML = "";

  fields.forEach(field => {
    const div = document.createElement("div");
    div.innerHTML = `
      <label>${field}</label>
      <input data-field="${field}" />
    `;
    body.appendChild(div);
  });

  document.getElementById("modalSave").onclick = () => {
    const inputs = [...document.querySelectorAll("#modalBody input")];
    const values = inputs.map(i => i.value.trim());
    callback(values);
    closeModal();
  };

  document.getElementById("modal").style.display = "flex";
}

/****************************************************
 * FECHAR MODAL
 ****************************************************/
function closeModal() {
  document.getElementById("modal").style.display = "none";
}

/****************************************************
 * ADICIONAR ITEM
 ****************************************************/
async function addItem(sheet, fields) {
  openModal(`Adicionar em ${sheet}`, fields, async (result) => {
    const r = await sendToAPI("add", sheet, result);

    if (r === "added") {
      alert("Registro adicionado com sucesso!");
      location.reload();
    } else {
      alert("Erro ao adicionar: " + r);
    }
  });
}

/****************************************************
 * DELETAR ITEM
 ****************************************************/
async function deleteItem(sheet, row) {
  if (!confirm("Tem certeza que deseja excluir esta linha?")) return;

  const r = await sendToAPI("delete", sheet, null, row);

  if (r === "deleted") {
    alert("Registro removido!");
    location.reload();
  } else {
    alert("Erro ao excluir: " + r);
  }
}

/****************************************************
 * GERAR DESPESAS FIXAS AUTOMATICAMENTE
 ****************************************************/
async function gerarDespesasFixas() {
  const r = await sendToAPI("generate_fixed", "Despesas Fixas");

  if (r === "generated_fixed") {
    alert("Despesas fixas geradas com sucesso!");
    location.reload();
  } else {
    alert("Erro ao gerar despesas fixas: " + r);
  }
}

/****************************************************
 * CONECTAR BOTÕES DO HTML
 ****************************************************/
document.addEventListener("DOMContentLoaded", () => {

  // ------------ ENTRADAS ------------
  const btnAddEntrada = document.getElementById("btnAddEntrada");
  if (btnAddEntrada)
    btnAddEntrada.onclick = () => addItem("Entradas",
      ["Data", "Descrição", "Valor", "Categoria"]
    );

  // ------------ SAÍDAS ------------
  const btnAddSaida = document.getElementById("btnAddSaida");
  if (btnAddSaida)
    btnAddSaida.onclick = () => addItem("Saídas",
      ["Data", "Descrição", "Valor", "Categoria"]
    );

  // ------------ DIZIMISTAS ------------
  const btnAddDiz = document.getElementById("btnAddDizimista");
  if (btnAddDiz)
    btnAddDiz.onclick = () => addItem("Dizimistas",
      ["Nome", "Telefone", "Endereço"]
    );

  // ------------ DESPESAS FIXAS ------------
  const btnAddFix = document.getElementById("btnAddFixa");
  if (btnAddFix)
    btnAddFix.onclick = () => addItem("Despesas Fixas",
      ["Descrição", "Valor", "Dia do vencimento"]
    );

  // Botão GERAR despesas fixas
  const btnGerarFixas = document.getElementById("btnGenerateFixedUI");
  if (btnGerarFixas)
    btnGerarFixas.onclick = gerarDespesasFixas;
});
