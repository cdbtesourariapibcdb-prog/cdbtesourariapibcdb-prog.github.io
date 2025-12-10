/****************************************************
 * auth.js — proteção simples de página (front-end)
 * Redireciona para login.html se não estiver autenticado
 ****************************************************/
(function(){
  // páginas públicas (lista de arquivo / rotas que não exigem token)
  const publicPages = ['index.html','login.html','/','/index.htm'];
  const path = window.location.pathname.split('/').pop();

  // se é página pública, não precisa verificar
  if (publicPages.includes(path)) return;

  // verifica token
  const token = sessionStorage.getItem("tesou_token");
  if (!token) {
    // redireciona para login
    const base = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
    window.location.href = (base + 'login.html');
  }
})();
