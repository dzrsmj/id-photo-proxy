// Vercel Edge Function — proxies remove.bg API calls to add CORS headers
export default async function handler(req) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = req.headers.get('X-Api-Key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'X-Api-Key header required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const formData = await req.formData();

    const resp = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: formData,
    });

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Expose-Headers', 'Content-Type');

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      headers.set('Content-Type', 'application/json');
      return new Response(JSON.stringify(err), { status: resp.status, headers });
    }

    const blob = await resp.blob();
    headers.set('Content-Type', resp.headers.get('Content-Type') || 'image/png');
    return new Response(blob, { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export const config = { runtime: 'edge' };
