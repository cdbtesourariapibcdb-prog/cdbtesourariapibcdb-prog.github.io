/* api.js — centraliza chamadas à API (JSONP) */
/* IMPORTANT: replace API_EXEC with your real /exec URL after deploying Apps Script */

const API_EXEC = "REPLACE_WITH_YOUR_EXEC_URL"; // <-- Replace with your .../exec link

function jsonpCall(params = {}, timeout = 15000) {
  return new Promise((resolve, reject) => {
    if (!API_EXEC || API_EXEC.indexOf("REPLACE_WITH_YOUR_EXEC_URL") !== -1) {
      reject(new Error("API_EXEC not set. Replace placeholder in api.js with your /exec URL."));
      return;
    }
    const cb = "cb_" + Math.random().toString(36).slice(2);
    params.callback = cb;
    const q = Object.keys(params).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join("&");
    const url = API_EXEC + "?" + q;

    const script = document.createElement("script");
    script.src = url;
    script.async = true;

    let settled = false;
    window[cb] = (data) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("JSONP load error"));
    };

    function cleanup() {
      try { delete window[cb]; } catch(e){}
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    document.body.appendChild(script);

    setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("JSONP timeout"));
    }, timeout);
  });
}
