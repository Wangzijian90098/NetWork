// ============================================================
// 认证工具
// ============================================================

function requireAuth() {
  // 通过 Cookie 认证，401 由 api.js 处理重定向
  return true;
}

function logout() {
  authLogout().then(() => {
    window.location.href = './login.html';
  }).catch(() => {
    window.location.href = './login.html';
  });
}

// ============================================================
// Token 工具
// ============================================================

function maskToken(token) {
  if (!token || token.length < 10) return token || '';
  return `${token.slice(0, 10)}••••••${token.slice(-4)}`;
}
