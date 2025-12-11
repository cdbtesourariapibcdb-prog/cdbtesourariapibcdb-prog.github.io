/* auth.js — proteção simples cliente */
(function(){
  const publicPages = ['index.html','login.html','dashboard.html'];
  const path = window.location.pathname.split('/').pop() || 'index.html';
  if (publicPages.includes(path)) return;
  const token = sessionStorage.getItem("tesou_token");
  if (!token) {
    window.location.href = 'index.html';
  }
})();
