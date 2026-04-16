/**
 * 统一 API 调用层
 * 使用 HttpOnly Cookie 进行身份认证（credentials: 'include'）
 */

const BASE = '';  // 同域，Nginx 代理到后端

async function request(path, options = {}) {
  const response = await fetch(BASE + path, {
    credentials: 'include',  // 携带 Cookie
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    window.location.href = './login.html';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const msg = data.message || data.error?.message || `请求失败 (${response.status})`;
    throw new Error(msg);
  }

  return data;
}

// ---- 认证 ----

async function authLogin(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

async function authRegister(email, password, region = null) {
  const body = { email, password };
  if (region) body.region = region;
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function authLogout() {
  return request('/api/auth/logout', { method: 'POST' });
}

// ---- API Key 管理 ----

async function getKeys() {
  const data = await request('/api/keys');
  return data.data || [];
}

async function createKey(name) {
  const data = await request('/api/keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return data.data;
}

async function revokeKey(keyId) {
  return request(`/api/keys/${keyId}`, { method: 'DELETE' });
}

// ---- 用量统计 ----

async function getUsage(days = 30) {
  const data = await request(`/v1/account/usage?days=${days}`);
  return data.data || {};
}

async function getModels() {
  const data = await request('/v1/models');
  return data.data || [];
}
