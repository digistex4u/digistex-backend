'use strict';
const _tokenCache = {};

// fetch with an AbortController timeout so a hung upstream can't stall the whole serverless function
async function fetchT(url, opts, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(function () { ctrl.abort(); }, ms || 12000);
  try { return await fetch(url, Object.assign({}, opts || {}, { signal: ctrl.signal })); }
  finally { clearTimeout(timer); }
}

async function getAccessToken(client) {
  const now = Date.now();
  const cached = _tokenCache[client.shopifyStore];
  if (cached && cached.exp > now + 60000) return cached.token;
  return (await getTokenInfo(client)).token;
}

// Token plus the permissions Shopify granted it (scope), for the store-token bridge and /diag.
async function getTokenInfo(client) {
  const now = Date.now();
  const cached = _tokenCache[client.shopifyStore];
  if (cached && cached.exp > now + 60000 && cached.scope !== undefined) return cached;
  const res = await fetchT(`https://${client.shopifyStore}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: client.shopifyClientId, client_secret: client.shopifyClientSecret })
  }, 12000);
  const text = await res.text();
  if (!res.ok) throw new Error(`Shopify token ${res.status}: ${text.slice(0, 200)}`);
  const data = JSON.parse(text);
  _tokenCache[client.shopifyStore] = { token: data.access_token, scope: data.scope || '', exp: now + ((data.expires_in || 86399) * 1000) };
  return _tokenCache[client.shopifyStore];
}

function noteAttr(order, name) {
  const arr = order.note_attributes || [];
  const hit = arr.find(a => a && String(a.name).toLowerCase() === name.toLowerCase() && a.value);
  return hit ? String(hit.value).trim() : null;
}
// Google click IDs on an order/checkout. Order of trust:
//   1. note_attributes written by the theme snippet (gclid / gbraid / wbraid, with or without a leading "_")
//   2. the order's landing_site query string (Shopify records the first page of the session; often empty
//      on Shopflo orders, so it is a fallback, never the main source)
// gbraid / wbraid are what Google sends instead of a gclid on iOS (app and web) traffic, so an order can
// legitimately carry one of those and no gclid.
const CLICK_KEYS = ['gclid', 'gbraid', 'wbraid'];
function fromLandingSite(order, key) {
  const ls = order && order.landing_site;
  if (!ls) return null;
  const m = String(ls).match(new RegExp('[?&#]' + key + '=([^&#\\s]+)', 'i'));
  if (!m) return null;
  try { return decodeURIComponent(m[1]).trim() || null; } catch (e) { return m[1].trim() || null; }
}
function clickIdsOf(order) {
  const out = { gclid: null, gbraid: null, wbraid: null, source: null };
  CLICK_KEYS.forEach(function (k) {
    const v = noteAttr(order, k) || noteAttr(order, '_' + k);
    if (v) { out[k] = v; out.source = out.source || 'note_attributes'; }
  });
  if (!out.gclid && !out.gbraid && !out.wbraid) {
    CLICK_KEYS.forEach(function (k) {
      const v = fromLandingSite(order, k);
      if (v) { out[k] = v; out.source = out.source || 'landing_site'; }
    });
  }
  return out;
}
function gclidOf(order) { return clickIdsOf(order).gclid; }
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
    const res = await fetchT(url, { headers: { 'X-Shopify-Access-Token': token } }, 12000);
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
            `&fields=name,email,phone,billing_address,created_at,total_price,currency,financial_status,note_attributes,landing_site`;
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

module.exports = { getAccessToken, getTokenInfo, fetchOrders, fetchCustomers, fetchCheckouts, gclidOf, clickIdsOf, toOffset, fetchT };
