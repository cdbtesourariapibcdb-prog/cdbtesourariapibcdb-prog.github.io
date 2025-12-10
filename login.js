// usa cfg guardado (se existir) ou credenciais padrão
const DEFAULT_USER = localStorage.getItem('cfg_user') || 'adminpib';
const DEFAULT_PASS = localStorage.getItem('cfg_pass') || 'tesourariapib2025';

function login(){
  const u = document.getElementById('user').value.trim();
  const p = document.getElementById('pass').value.trim();
  if(u === DEFAULT_USER && p === DEFAULT_PASS){
    localStorage.setItem('logged','true');
    window.location.href = 'admin.html';
  } else {
    document.getElementById('msg').innerText = 'Usuário ou senha incorretos.';
  }
}
