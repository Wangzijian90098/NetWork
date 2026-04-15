const DEMO_USER_KEY = 'ai_api_demo_user';
const DEMO_KEYS_KEY = 'ai_api_demo_keys';

function ensureDemoKeys() {
  if (!localStorage.getItem(DEMO_KEYS_KEY)) {
    const defaults = [
      {
        id: 'key_prod_default',
        name: 'Production Default',
        token: 'sk-demo-prod-3f82a1',
        group: 'default',
        status: 'active',
        createdAt: '2026-04-15 15:30',
        usage: '12,480 tokens'
      },
      {
        id: 'key_dev_test',
        name: 'Dev Testing',
        token: 'sk-demo-dev-8a21c6',
        group: 'dev',
        status: 'active',
        createdAt: '2026-04-15 15:32',
        usage: '2,410 tokens'
      }
    ];
    localStorage.setItem(DEMO_KEYS_KEY, JSON.stringify(defaults));
  }
}

function getDemoUser() {
  const raw = localStorage.getItem(DEMO_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function setDemoUser(user) {
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
}

function requireAuth() {
  const user = getDemoUser();
  if (!user) {
    window.location.href = './login.html';
    return null;
  }
  return user;
}

function logout() {
  localStorage.removeItem(DEMO_USER_KEY);
  window.location.href = './login.html';
}

function getKeys() {
  ensureDemoKeys();
  return JSON.parse(localStorage.getItem(DEMO_KEYS_KEY) || '[]');
}

function saveKeys(keys) {
  localStorage.setItem(DEMO_KEYS_KEY, JSON.stringify(keys));
}

function maskToken(token) {
  if (token.length < 10) return token;
  return `${token.slice(0, 10)}••••••${token.slice(-4)}`;
}

function createKey() {
  const keys = getKeys();
  const next = {
    id: `key_${Date.now()}`,
    name: `New Key ${keys.length + 1}`,
    token: `sk-demo-${Math.random().toString(36).slice(2, 14)}`,
    group: 'default',
    status: 'active',
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    usage: '0 tokens'
  };
  keys.unshift(next);
  saveKeys(keys);
  return next;
}

function revokeKey(id) {
  const keys = getKeys().map(item => item.id === id ? { ...item, status: 'revoked' } : item);
  saveKeys(keys);
}
