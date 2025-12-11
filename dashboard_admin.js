/******************************************************
 * CONFIGURAÇÃO
 ******************************************************/
const API =
  "https://script.google.com/macros/s/AKfycbz1SwoOp9hhXkYkMZwX1XiTgJjokQX_2m_05c4hM4cMaDkbtV-wzh_InO1RYwj8wjJ8/exec";

/******************************************************
 * JSONP HELPER
 ******************************************************/
function jsonp(params = {}) {
  return new Promise((resolve, reject) => {
    const cb = "cb_" + Math.random().toString(36).slice(2);
    params.callback = cb;

    const query = Object.keys(params)
      .map(k => `${k}=${encodeURIComponent(params[k])}`)
      .join("&");

    const script = document.createElement("script");
    script.src = `${API}?${query}`;
    script.async = true;

    window[cb] = (data) => {
      resolve(data);
      cleanup();
    };

    script.onerror = () => {
      reject("jsonp_error");
      cleanup();
    };

    function cleanup() {
      delete window[cb];
      script.remove();
    }

    setTimeout(() => {
      reject("timeout");
      cleanup();
    }, 8000);

    document.body.appendChild(script);
  });
}

/******************************************************
 * ABRIR MODAL
 ******************************************************/
function openModal(title, fields, callback) {
  document.getElementById("modalTitle").innerText = title;
  const body = document.getElementById("modalBody");
  body.innerHTML = "";

  fields.forEach(f => {
    body.innerHTML += `
      <div>
        <label>${f}</label>
        <input data-field="${f}">
      </div>`;
  });

  document.getElementById("modalSave").onclick = () => {
    const values = [...document.querySelectorAll("#modalBody input")]
      .map(i => i.value.trim());
    callback(values);
    closeModal();
  };

  document.getElementById("modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

/******************************************************
 * ADICIONAR ITEM
 ******************************************************/
async function addItem(sheet, fields) {
  openModal("Adicionar em " + sheet, fields, async (values) => {
    const r = await jsonp({
      action: "add",
      sheet,
      data: JSON.stringify(values)
    });

    if (r === "added") {
      alert("Adicionado!");
      location.reload();
    } else {
      alert("Erro: " + r);
    }
  });
}

/******************************************************
 * DELETAR
 ******************************************************/
async function deleteItem(sheet, row) {
  if (!confirm("Excluir?")) return;

  const r = await jsonp({
    action: "delete",
    sheet,
    row
  });

  if (r === "deleted") {
    alert("Removido!");
    location.reload();
  } else {
    alert("Erro: " + r);
  }
}

/******************************************************
 * GERAR FIXAS
 ******************************************************/
async function gerarDespesasFixas() {
  const r = await jsonp({ action: "generate_fixed" });

  if (r === "generated_fixed") {
    alert("Gerado!");
    location.reload();
  } else {
    alert("Erro: " + r);
  }
}

/******************************************************
 * BOTÕES
 ******************************************************/
document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("btnAddEntrada").onclick = () =>
    addItem("Entradas", ["Data", "Descrição", "Valor", "Categoria"]);

  document.getElementById("btnAddSaida").onclick = () =>
    addItem("Saídas", ["Data", "Despesa", "Valor", "Observação"]);

  document.getElementById("btnAddDizimista").onclick = () =>
    addItem("Dizimistas", ["Nome", "Telefone", "Dízimo mensal"]);

  document.getElementById("btnAddFixa").onclick = () =>
    addItem("Despesas Fixas", ["Despesa", "Valor", "Dia", "Categoria"]);

  document.getElementById("btnGenerateFixedUI").onclick =
    gerarDespesasFixas;
});
