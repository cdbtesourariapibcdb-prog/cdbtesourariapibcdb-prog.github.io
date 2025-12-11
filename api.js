// api.js — responsável por fazer chamadas JSONP ao Google Apps Script

// Coloque aqui o SEU link de execução da API
const API_URL = "https://script.google.com/macros/s/AKfycbz1SwoOp9hhXkYkMZwX1XiTgJjokQX_2m_05c4hM4cMaDkbtV-wzh_InO1RYwj8wjJ8/exec";

function jsonpCall(params) {
  return new Promise((resolve, reject) => {
    const callbackName = "cb_" + Math.random().toString(36).substr(2, 9);

    params.callback = callbackName;
    const query = new URLSearchParams(params).toString();
    const script = document.createElement("script");

    script.src = `${API_URL}?${query}`;

    window[callbackName] = function (response) {
      resolve(response);
      delete window[callbackName];
      script.remove();
    };

    script.onerror = function () {
      reject(new Error("Erro ao carregar JSONP"));
      delete window[callbackName];
      script.remove();
    };

    document.body.appendChild(script);
  });
}
