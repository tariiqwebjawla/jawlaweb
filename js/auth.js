async function loginJawla(username, password) {
  const { data, error } = await db
    .from('user_accounts')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return { success: false, message: 'بيانات الدخول غير صحيحة' };
  }

  if (data.expires_at) {
    const expiry = new Date(data.expires_at);
    const now = new Date();

    if (expiry < now) {
      return { success: false, message: 'انتهت صلاحية الاشتراك' };
    }
  }

  return { success: true, user: data };
}

function initJawlaLogin() {
  if (sessionStorage.getItem('jawlaLoggedIn') === '1') {
    location.href = 'home.html';
    return;
  }

  const form = document.getElementById('loginForm');
  const msg = document.getElementById('loginMsg');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    msg.textContent = 'جاري التحقق...';

    const username = document
      .getElementById('username')
      .value
      .trim()
      .toUpperCase();

    const password = document
      .getElementById('password')
      .value
      .trim();

    const result = await loginJawla(username, password);

    if (!result.success) {
      msg.textContent = result.message;
      return;
    }

    sessionStorage.setItem('jawlaLoggedIn', '1');
    sessionStorage.setItem('jawlaUser', username);

    location.href = 'home.html';
  });
}

function requireJawlaLogin() {
  if (sessionStorage.getItem('jawlaLoggedIn') !== '1') {
    location.href = 'index.html';
  }
}

function logoutJawla() {
  sessionStorage.removeItem('jawlaLoggedIn');
  sessionStorage.removeItem('jawlaUser');
  location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('loginForm')) {
    initJawlaLogin();
  }
});