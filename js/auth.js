function getDeviceId() {
  let deviceId = localStorage.getItem('jawlaDeviceId');

  if (!deviceId) {
    deviceId =
      'device_' +
      Date.now().toString(36) +
      '_' +
      Math.random().toString(36).substring(2, 12);

    localStorage.setItem('jawlaDeviceId', deviceId);
  }

  return deviceId;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function loginJawla(username, password) {
  const deviceId = getDeviceId();

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

  const now = new Date();

  if (data.expires_at) {
    const expiry = new Date(data.expires_at);
    if (expiry < now) {
      return { success: false, message: 'انتهت صلاحية الاشتراك' };
    }
  }

  if (data.device_id && data.device_id !== deviceId) {
    return { success: false, message: 'هذا الحساب مفعل على جهاز آخر' };
  }

  if (!data.used_at) {
    const months = data.duration_months || 3;
    const expiresAt = addMonths(now, months).toISOString();

    const { error: updateError } = await db
      .from('user_accounts')
      .update({
        used_at: now.toISOString(),
        expires_at: expiresAt,
        device_id: deviceId
      })
      .eq('id', data.id);

    if (updateError) {
      return { success: false, message: 'تعذر تفعيل الحساب، حاول مرة أخرى' };
    }

    data.used_at = now.toISOString();
    data.expires_at = expiresAt;
    data.device_id = deviceId;
  } else if (!data.device_id) {
    const { error: deviceError } = await db
      .from('user_accounts')
      .update({
        device_id: deviceId
      })
      .eq('id', data.id);

    if (deviceError) {
      return { success: false, message: 'تعذر ربط الجهاز، حاول مرة أخرى' };
    }

    data.device_id = deviceId;
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
    sessionStorage.setItem('jawlaPlan', result.user.plan_type || 'full');

    location.href = 'home.html';
  });
}

function requireJawlaLogin() {
  if (sessionStorage.getItem('jawlaLoggedIn') !== '1') {
    location.href = 'index.html';
  }
}

function requireJawlaPlan(allowedPlans) {
  requireJawlaLogin();

  const plan = sessionStorage.getItem('jawlaPlan') || 'full';

  if (!allowedPlans.includes(plan) && plan !== 'full') {
    alert('هذه الميزة غير متاحة في اشتراكك الحالي');
    location.href = 'home.html';
  }
}

function logoutJawla() {
  sessionStorage.removeItem('jawlaLoggedIn');
  sessionStorage.removeItem('jawlaUser');
  sessionStorage.removeItem('jawlaPlan');
  location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('loginForm')) {
    initJawlaLogin();
  }
});