export async function createAuthClient(apiRoot, { email = `test-${Date.now()}-${Math.random().toString(16).slice(2)}@mannora.test`, displayName = 'Test User' } = {}) {
  const response = await fetch(`${apiRoot}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, displayName, password: 'SecureTestPassword!123' }),
  });
  if (!response.ok) throw new Error(`Test account registration failed (${response.status}): ${await response.text()}`);
  const body = await response.json();
  const cookieHeaders = response.headers.getSetCookie?.() || [response.headers.get('set-cookie') || ''];
  const cookies = cookieHeaders.flatMap((value) => value.match(/(?:mannora_session|mannora_csrf)=[^;,\s]+/g) || []);
  const cookie = cookies.join('; ');
  const csrf = decodeURIComponent(cookie.match(/mannora_csrf=([^;]+)/)?.[1] || '');
  return {
    user: body.data,
    cookie,
    async request(url, options = {}) {
      const headers = new Headers(options.headers || {});
      headers.set('Cookie', cookie);
      if (!['GET', 'HEAD', 'OPTIONS'].includes((options.method || 'GET').toUpperCase())) headers.set('X-CSRF-Token', csrf);
      return fetch(url, { ...options, headers });
    },
  };
}
