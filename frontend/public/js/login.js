// login.js — depende de frontend_api.js carregado antes no login.html

// Redireciona se já tiver token válido
if (sessionStorage.getItem('grazy_admin_token')) {
  window.location.replace('admin.html');
}

const inp = document.getElementById('adminPass');
inp.addEventListener('keydown', e => { if (e.key === 'Enter') fazerLogin(); });
document.getElementById('adminUser').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('adminPass').focus();
});

async function fazerLogin() {
  const u   = document.getElementById('adminUser').value.trim();
  const p   = document.getElementById('adminPass').value;
  const err = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');

  err.classList.remove('show');
  document.querySelectorAll('.lf-input').forEach(i => i.classList.remove('error'));

  if (!u || !p) {
    err.textContent = 'Preencha usuário e senha.';
    err.classList.add('show');
    return;
  }

  btn.textContent = 'Autenticando…';
  btn.disabled = true;

  try {
    // Usa o objeto Auth do frontend_api.js (já carregado no login.html)
    await Auth.login(u, p);

    btn.textContent = '✓ Autenticado — redirecionando…';
    setTimeout(() => window.location.replace('admin.html'), 600);

  } catch (e) {
    err.textContent = e.message || 'Credenciais inválidas.';
    err.classList.add('show');
    document.getElementById('adminUser').classList.add('error');
    document.getElementById('adminPass').classList.add('error');
    document.getElementById('adminPass').value = '';
    document.getElementById('adminUser').focus();
    btn.textContent = '🔐 Entrar no painel';
    btn.disabled = false;
  }
}