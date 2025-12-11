/* api.js — responsável por chamadas JSONP ao Web App do Apps Script */

/* URL DO SEU WEB APP (EXEC) */
const API_EXEC_URL = "https://script.google.com/macros/s/AKfycbz1SwoOp9hhXkYkMZwX1XiTgJjokQX_2m_05c4hM4cMaDkbtV-wzh_InO1RYwj8wjJ8/exec";

/**
 * Faz chamada JSONP ao Apps Script
 * @param {object} params - parâmetros da requisição
 * @returns {Promise<any>}
 */
function jsonpCall(params = {}) {
  return new Promise((resolve, reject) => {
    try {
      const callbackName = "cb_" + Math.random().toString(36).substring(2);
      params.callback = callbackName;

      const script = document.createElement("script");
      const query = Object.keys(params)
        .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
        .join("&");

      script.src = API_EXEC_URL + "?" + query;
      script.onerror = () => reject("Erro ao carregar JSONP");

      window[callbackName] = (data) => {
        try {
          resolve(data);
        } finally {
          delete window[callbackName];
          script.remove();
        }
      };

      document.body.appendChild(script);
    } catch (err) {
      reject(err);
    }
  });
}
