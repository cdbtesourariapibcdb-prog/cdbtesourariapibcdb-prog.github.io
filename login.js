/****************************************************
 * login.js — login simples (front-end)
 * Usa usuário/senha armazenados no localStorage (configurável)
 ****************************************************/

// padrão inicial — você pode alterar em Configurações (admin)
const DEFAULT_USER = "adminpib";
const DEFAULT_PASS = "tesourariapib2025";

// Ao carregar a página de login, preenche campos e liga o form
document.addEventListener("DOMContentLoaded", () => {
  // se não existir credencial no localStorage, grava a padrão
  if (!localStorage.getItem("tesou_user")) {
    localStorage.setItem("tesou_user", DEFAULT_USER);
  }
  if (!localStorage.getItem("tesou_pass")) {
    localStorage.setItem("tesou_pass", DEFAULT_PASS);
  }

  const form = document.getElementById("loginForm");
  if (form) {
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const user = (document.getElementById("user").value || "").trim();
      const pass = (document.getElementById("pass").value || "").trim();

      const storedUser = localStorage.getItem("tesou_user");
      const storedPass = localStorage.getItem("tesou_pass");

      if (user === storedUser && pass === storedPass) {
        // cria token simples
        sessionStorage.setItem("tesou_token", btoa(user + ":" + Date.now()));
        // redireciona para admin
        window.location.href = "admin.html";
      } else {
        alert("Usuário ou senha inválidos.");
      }
    });
  }
});
function login() {
  const user = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value.trim();

  if (user === "" || pass === "") {
    alert("Preencha todos os campos!");
    return;
  }

  // Usuário fixo só para testes
  if (user === "admin" && pass === "1234") {
    localStorage.setItem("auth", "ok");
    window.location.href = "admin.html";
  } else {
    alert("Usuário ou senha incorretos");
  }
}

