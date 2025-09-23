import fetch from 'node-fetch';

export const WEB_BACKEND_URL = process.env.WEB_BACKEND_URL || 'https://juanlms-webapp-server.onrender.com';

export async function proxyJson(pathname, options = {}) {
  const url = `${WEB_BACKEND_URL}${pathname}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Proxy ${pathname} failed: ${res.status} ${text}`);
  }
  return res.json();
}


