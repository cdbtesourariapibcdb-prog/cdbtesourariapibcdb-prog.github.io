(function(){
  const publicPages = ['login.html'];
  const path = location.pathname.split('/').pop();
  if(publicPages.includes(path)) return;
  if(localStorage.getItem('logged') !== 'true'){
    window.location.href = 'login.html';
  }
  window.logout = function(){
    localStorage.removeItem('logged');
    window.location.href = 'login.html';
  }
})();
