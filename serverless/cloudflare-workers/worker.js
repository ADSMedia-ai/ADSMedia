/**
 * ADSMedia Email Worker for Cloudflare Workers
 * 
 * Deploy to Cloudflare Workers for serverless email sending
 */

const API_BASE_URL = 'https://api.adsmedia.live/v1';

async function handleRequest(request, env) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname;
  const apiKey = env.ADSMEDIA_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    let response;

    if (path === '/send' && request.method === 'POST') {
      const body = await request.json();
      response = await fetch(`${API_BASE_URL}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } else if (path === '/send/batch' && request.method === 'POST') {
      const body = await request.json();
      response = await fetch(`${API_BASE_URL}/send/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } else if (path === '/check' && request.method === 'GET') {
      const email = url.searchParams.get('email');
      response = await fetch(`${API_BASE_URL}/suppressions/check?email=${encodeURIComponent(email)}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
    } else if (path === '/ping' && request.method === 'GET') {
      response = await fetch(`${API_BASE_URL}/ping`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
};

