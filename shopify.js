'use strict';
const _tokenCache = {};

async function getAccessToken(client) {
  const now = Date.now();
  const cached = _tokenCache[client.shopifyStore];
  if (cached && cached.exp > now + 60000) return cached.token;
  const res = await fetch(`https://${client.shopifyStore}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: client.shopifyClientId, client_secret: client.shopifyClientSecret })
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Shopify token ${res.status}: ${text.slice(0, 200)}`);
  const data = JSON.parse(text);
  _tokenCache[client.shopifyStore] = { token: data.access_token, exp: now + ((data.expires_in || 86399) * 1000) };
  return data.access_token;
}

function noteAttr(order, name) {
  const arr = order.note_attributes || [];
  const hit = arr.find(a => a && String(a.name).toLowerCase() === name.toLowerCase() && a.value);
  return hit ? String(hit.value).trim() : null;
}
function gclidOf(order) { return noteAttr(order, 'gclid') || noteAttr(order, '_gclid'); }
function nextLink(h) { if (!h) return null; const m = h.match(/<([^>]+)>;\s*rel="next"/); return m ? m[1] : null; }

function toOffset(iso, offset) {
  const sign = offset[0] === '-' ? -1 : 1;
  const [h, m] = offset.slice(1).split(':').map(Number);
  const ms = new Date(iso).getTime() + sign * (h * 60 + m) * 60000;
  const d = new Date(ms); const p = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}${offset}`;
}

async function paged(url, token) {
  const out = [];
  while (url) {
    const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
    if (!res.ok) { const b = await res.text(); throw new Error(`Shopify ${res.status}: ${b.slice(0, 200)}`); }
    const data = await res.json();
    const key = Object.keys(data)[0];
    (data[key] || []).forEach(x => out.push(x));
    url = nextLink(res.headers.get('link'));
  }
  return out;
}

async function fetchOrders(client, token, cfg, days, financialStatus) {
  const since = new Date(Date.now() - days * 864e5).toISOString();
  let url = `https://${client.shopifyStore}/admin/api/${cfg.shopifyApiVersion}/orders.json` +
            `?status=any&limit=250&created_at_min=${encodeURIComponent(since)}` +
            (financialStatus ? `&financial_status=${financialStatus}` : '') +
            `&fields=name,email,created_at,total_price,currency,financial_status,note_attributes`;
  return paged(url, token);
}

async function fetchCustomers(client, token, cfg, days) {
  const since = new Date(Date.now() - days * 864e5).toISOString();
  let url = `https://${client.shopifyStore}/admin/api/${cfg.shopifyApiVersion}/customers.json` +
            `?limit=250&created_at_min=${encodeURIComponent(since)}`;
  return paged(url, token);
}

// Abandoned checkouts = leads who started checkout (have email/phone/gclid) but did not complete an order.
async function fetchCheckouts(client, token, cfg, days) {
  const since = new Date(Date.now() - days * 864e5).toISOString();
  let url = `https://${client.shopifyStore}/admin/api/${cfg.shopifyApiVersion}/checkouts.json` +
            `?limit=250&created_at_min=${encodeURIComponent(since)}`;
  return paged(url, token);
}

module.exports = { getAccessToken, fetchOrders, fetchCustomers, fetchCheckouts, gclidOf, toOffset };
