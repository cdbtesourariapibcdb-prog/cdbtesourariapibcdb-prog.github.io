/* login.js — login simples (localStorage + sessionStorage) */

const DEFAULT_USER = "adminpib";
const DEFAULT_PASS = "tesourariapib2025";

document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("tesou_user")) localStorage.setItem("tesou_user", DEFAULT_USER);
  if (!localStorage.getItem("tesou_pass")) localStorage.setItem("tesou_pass", DEFAULT_PASS);

  const form = document.getElementById("loginForm");
  if (!form) return;
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const user = (document.getElementById("user").value || "").trim();
    const pass = (document.getElementById("pass").value || "").trim();
    const storedUser = localStorage.getItem("tesou_user");
    const storedPass = localStorage.getItem("tesou_pass");
    if (user === storedUser && pass === storedPass) {
      sessionStorage.setItem("tesou_token", btoa(user + ":" + Date.now()));
      window.location.href = "admin.html";
    } else {
      alert("Usuário ou senha inválidos.");
    }
  });
});
