'use strict';
// Google Ads API upload of Shopify orders as offline CRM-PURCHASE click conversions
// (ConversionUploadService.UploadClickConversions) + enhanced conversions for leads.
//
// Replaces, one store at a time, the gclid-only CSV feed in server.js (/export). Per store the
// CLIENTS_JSON entry decides the mode:
//   gadsUploadMode: 'file'   (default) today's CSV feed only, the API is never called
//                   'shadow' CSV feed stays live, the daily cron sends the API batch with validate_only=true
//                   'api'    the API uploads; /export keeps serving only orders created before gadsApiSince
// Nothing here writes to the uploaded-order log when validate_only is on.
const crypto = require('crypto');
const S = require('./shopify');

// ---------------------------------------------------------------- hashing (enhanced conversions)
function sha256(v) { return crypto.createHash('sha256').update(v).digest('hex'); }
// Google's normalisation: trim + lowercase; for gmail.com / googlemail.com also drop dots and "+tag" in the
// local part. This is the same rule the CSV feed has always used, so hashes match across both paths.
function normEmail(e) {
  e = String(e || '').trim().toLowerCase();
  if (!e || e.indexOf('@') < 1) return '';
  const at = e.lastIndexOf('@'); let user = e.slice(0, at); const dom = e.slice(at + 1);
  if (!dom || dom.indexOf('.') < 0) return '';
  if (dom === 'gmail.com' || dom === 'googlemail.com') user = user.split('+')[0].replace(/\./g, '');
  return user + '@' + dom;
}
// E.164. Indian numbers arrive as "98xxxxxxxx", "098xxxxxxxx", "91 98xxx xxxxx", "+91-98xxx-xxxxx".
function normPhone(p) {
  let s = String(p || '').trim(); if (!s) return '';
  const plus = s.charAt(0) === '+'; let d = s.replace(/\D/g, '');
  if (!d) return '';
  if (plus) return d.length >= 8 ? '+' + d : '';
  if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
  if (d.length === 10) return '+91' + d;
  if (d.length === 12 && d.slice(0, 2) === '91') return '+' + d;
  return d.length >= 8 && d.length <= 15 ? '+' + d : '';
}
function hashEmail(e) { e = normEmail(e); return e ? sha256(e) : ''; }
function hashPhone(p) { p = normPhone(p); return p ? sha256(p) : ''; }

// Email + phone from the Shopify order itself (customer, billing, shipping). This is the only source for
// Heatronics, which has no CRM; for the other stores it sits next to the CRM gclid fallback.
function identifiersOf(order) {
  const o = order || {}; const c = o.customer || {}; const ba = o.billing_address || {}; const sa = o.shipping_address || {};
  const emails = []; const phones = [];
  [o.email, o.contact_email, c.email].forEach(function (e) { const h = hashEmail(e); if (h && emails.indexOf(h) < 0) emails.push(h); });
  [o.phone, c.phone, ba.phone, sa.phone].forEach(function (p) { const h = hashPhone(p); if (h && phones.indexOf(h) < 0) phones.push(h); });
  const out = [];
  emails.slice(0, 2).forEach(function (h) { out.push({ hashedEmail: h }); });
  phones.slice(0, 3).forEach(function (h) { if (out.length < 5) out.push({ hashedPhoneNumber: h }); }); // API max: 5 identifiers
  return out;
}

// ---------------------------------------------------------------- per-store config
function digits(v) { return String(v || '').replace(/\D/g, ''); }
function storeConfig(client) {
  const c = client || {};
  const mode = String(c.gadsUploadMode || 'file').toLowerCase();
  return {
    name: c.name || '',
    store: c.shopifyStore || '',
    mode: ['file', 'shadow', 'api'].indexOf(mode) > -1 ? mode : 'file',
    customerId: digits(c.googleAdsCustomerId),
    loginCustomerId: digits(c.gadsLoginCustomerId || process.env.GADS_LOGIN_CUSTOMER_ID),
    // numeric id, a full resource name, or empty (then looked up by name)
    conversionAction: String(c.gadsConversionAction || c.conversionActionId || '').trim(),
    conversionActionName: String(c.gadsConversionActionName || 'CRM-PURCHASE'),
    apiSince: c.gadsApiSince ? new Date(c.gadsApiSince) : null,
    valueField: c.gadsValueField || 'current_total_price',
    orderIdField: c.gadsOrderIdField || 'name',
    adUserDataConsent: c.gadsAdUserDataConsent ? String(c.gadsAdUserDataConsent).toUpperCase() : '',
    braidIdentifiers: c.gadsBraidIdentifiers !== false,
    excludeOrders: (c.gadsExcludeOrders || []).concat(DEFAULT_EXCLUDE_ORDERS),
    excludeCodes: (c.gadsExcludeCodes || []).concat(DEFAULT_TEST_CODES),
  };
}
function actionResource(sc, resolved) {
  const a = resolved || sc.conversionAction;
  if (!a) return '';
  if (/^customers\/\d+\/conversionActions\/\d+$/.test(a)) return a;
  if (/^\d+$/.test(a) && sc.customerId) return 'customers/' + sc.customerId + '/conversionActions/' + a;
  return '';
}

// ---------------------------------------------------------------- exclusions + classification
// Known test orders/codes. Add more per store with gadsExcludeOrders / gadsExcludeCodes in CLIENTS_JSON.
const DEFAULT_EXCLUDE_ORDERS = ['#HTR-24259-D2C'];
const DEFAULT_TEST_CODES = ['TEST123'];
function up(v) { return String(v || '').trim().toUpperCase(); }
function exclusionReason(order, sc, ids) {
  const o = order || {};
  if (o.test === true) return 'test_order';
  if (o.cancelled_at) return 'cancelled';
  if (o.financial_status === 'voided' || o.financial_status === 'refunded') return o.financial_status;
  const names = sc.excludeOrders.map(up);
  if (names.indexOf(up(o.name)) > -1 || names.indexOf(up(o.id)) > -1) return 'excluded_order';
  const codes = sc.excludeCodes.map(up);
  if ((o.discount_codes || []).some(function (d) { return codes.indexOf(up(d && d.code)) > -1; })) return 'test_code';
  const cid = ids || {};
  if ([cid.gclid, cid.gbraid, cid.wbraid].some(function (v) { return v && codes.indexOf(up(v)) > -1; })) return 'test_click_id';
  if (/(^|,)\s*test\s*(,|$)/i.test(String(o.tags || ''))) return 'test_tag';
  if (!(netValue(o, sc) > 0)) return 'zero_value';
  return null;
}
function netValue(order, sc) {
  const f = (sc && sc.valueField) || 'current_total_price';
  const v = order[f] != null && order[f] !== '' ? order[f] : order.total_price;
  const n = parseFloat(v); return isFinite(n) ? Math.round(n * 100) / 100 : 0;
}
function orderIdOf(order, sc) { return String((sc && sc.orderIdField === 'id' ? order.id : order.name) || order.id || ''); }

// Exactly one click ID per conversion; the API rejects more than one. Preference gclid > gbraid > wbraid.
function pickClickId(ids) {
  const i = ids || {};
  if (i.gclid) return { key: 'gclid', value: i.gclid };
  if (i.gbraid) return { key: 'gbraid', value: i.gbraid };
  if (i.wbraid) return { key: 'wbraid', value: i.wbraid };
  return null;
}

// Pure: turns one order (+ the click IDs already resolved for it) into a ClickConversion, or says why not.
// kind: gclid | gbraid | wbraid | identifiers (EC for leads only) | nothing
function buildConversion(order, ids, sc, resource, tz) {
  const excluded = exclusionReason(order, sc, ids);
  const click = pickClickId(ids);
  const idents = identifiersOf(order);
  const kind = click ? click.key : (idents.length ? 'identifiers' : 'nothing');
  const base = { orderId: orderIdOf(order, sc), createdAt: order.created_at, kind, source: (ids && ids.source) || null, identifiers: idents.length };
  if (excluded) return Object.assign(base, { skip: excluded });
  if (kind === 'nothing') return Object.assign(base, { skip: 'no_click_id_or_identifiers' });
  const conv = {
    conversionAction: resource,
    conversionDateTime: S.toOffset(order.created_at, tz || '+05:30'), // "yyyy-mm-dd hh:mm:ss+05:30"
    conversionValue: netValue(order, sc),
    currencyCode: order.currency || 'INR',
    orderId: base.orderId,
  };
  if (click) conv[click.key] = click.value;
  if (idents.length && (kind === 'gclid' || kind === 'identifiers' || sc.braidIdentifiers)) conv.userIdentifiers = idents;
  if (sc.adUserDataConsent) conv.consent = { adUserData: sc.adUserDataConsent };
  return Object.assign(base, { conversion: conv });
}

// Dedupe against the persisted log and the file-path cutover. Pure.
function dedupeReason(row, logEntry, sc) {
  if (logEntry && logEntry.status === 'ok') return logEntry.via === 'file' ? 'uploaded_via_file' : 'already_uploaded';
  if (logEntry && logEntry.via === 'file') return 'uploaded_via_file';
  // gclid orders before the cutover went (or are still going) through the CSV feed, which only ever sent gclids.
  if (row.kind === 'gclid' && sc.apiSince && new Date(row.createdAt) < sc.apiSince) return 'file_path_before_cutover';
  return null;
}

// ---------------------------------------------------------------- uploaded-order log (Vercel Blob)
// gads-log/<store>.json = { orders: { "<order id>": { via:'api'|'file', status:'ok'|'rejected', kind, at, reason } } }
// Keyed by store + order id. Only order names, statuses and reasons; no email/phone.
let _store = null; // tests inject an in-memory store
function setStore(s) { _store = s; }
function blobStore() {
  if (_store) return _store;
  const blob = require('@vercel/blob');
  return {
    async get(path) {
      const l = await blob.list({ prefix: path }); const b = (l.blobs || []).find(function (x) { return x.pathname === path; });
      if (!b) return null; const r = await fetch(b.url + (b.url.indexOf('?') > -1 ? '&' : '?') + 't=' + Date.now(), { cache: 'no-store' });
      return r.ok ? await r.json() : null;
    },
    async put(path, obj) { await blob.put(path, JSON.stringify(obj), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' }); }
  };
}
function logPath(sc) { return 'gads-log/' + String(sc.store || sc.name).toLowerCase().replace(/[^a-z0-9.-]+/g, '_') + '.json'; }
function runPath(sc) { return 'gads-runs/' + String(sc.store || sc.name).toLowerCase().replace(/[^a-z0-9.-]+/g, '_') + '.json'; }
async function readLog(sc) { try { const d = await blobStore().get(logPath(sc)); return d && d.orders ? d : { orders: {} }; } catch (e) { return { orders: {} }; } }
async function writeLog(sc, log) {
  const cutoff = Date.now() - 120 * 864e5; // keep 120 days, Google's lookback is 90
  Object.keys(log.orders).forEach(function (k) { if (new Date(log.orders[k].at).getTime() < cutoff) delete log.orders[k]; });
  await blobStore().put(logPath(sc), { store: sc.store, updated: new Date().toISOString(), orders: log.orders });
}
// Called by /export when Google's scheduled upload fetches the CSV: those orders are now Google's, via the file.
async function logFileRows(client, rows) {
  const sc = storeConfig(client); if (!rows.length) return 0;
  const log = await readLog(sc); let n = 0; const at = new Date().toISOString();
  rows.forEach(function (r) { if (r.order && !log.orders[r.order]) { log.orders[r.order] = { via: 'file', status: 'ok', kind: 'gclid', at }; n++; } });
  if (n) await writeLog(sc, log);
  return n;
}

// ---------------------------------------------------------------- Google Ads REST
const API_VERSIONS = (process.env.GADS_API_VERSION ? [process.env.GADS_API_VERSION] : []).concat(['v22', 'v21', 'v20'])
  .filter(function (v, i, a) { return a.indexOf(v) === i; });
let _tok = null; let _ver = null;
function credsMissing() {
  return ['GADS_CLIENT_ID', 'GADS_CLIENT_SECRET', 'GADS_REFRESH_TOKEN'].filter(function (k) { return !process.env[k]; });
}
async function accessToken() {
  if (_tok && _tok.exp > Date.now() + 60000) return _tok.token;
  const r = await S.fetchT('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', client_id: process.env.GADS_CLIENT_ID, client_secret: process.env.GADS_CLIENT_SECRET, refresh_token: process.env.GADS_REFRESH_TOKEN })
  }, 12000);
  const d = await r.json().catch(function () { return {}; });
  if (!r.ok || !d.access_token) throw new Error('Google OAuth ' + r.status + ': ' + (d.error_description || d.error || 'no token'));
  _tok = { token: d.access_token, exp: Date.now() + (d.expires_in || 3600) * 1000 };
  return _tok.token;
}
async function gads(sc, pathAfterCustomer, body) {
  const headers = { Authorization: 'Bearer ' + await accessToken(), 'Content-Type': 'application/json' };
  if (process.env.GADS_DEVELOPER_TOKEN) headers['developer-token'] = process.env.GADS_DEVELOPER_TOKEN;
  if (sc.loginCustomerId) headers['login-customer-id'] = sc.loginCustomerId;
  const versions = _ver ? [_ver] : API_VERSIONS; let last;
  for (const v of versions) {
    const r = await S.fetchT('https://googleads.googleapis.com/' + v + '/customers/' + sc.customerId + pathAfterCustomer, { method: 'POST', headers, body: JSON.stringify(body) }, 60000);
    const t = await r.text(); let d; try { d = t ? JSON.parse(t) : {}; } catch (e) { d = { raw: t.slice(0, 300) }; }
    if (r.status === 404 && !_ver) { last = new Error('Google Ads ' + v + ' not available'); continue; } // sunset version, try the next
    if (!r.ok) {
      const err = (d && d.error) || {};
      const detail = ((((err.details || [])[0] || {}).errors || [])[0] || {});
      throw new Error('Google Ads ' + r.status + ': ' + (detail.message || err.message || t.slice(0, 300)));
    }
    _ver = v; return d;
  }
  throw last || new Error('Google Ads API unreachable');
}
const _actionCache = {};
async function resolveAction(sc) {
  const direct = actionResource(sc);
  if (direct) return direct;
  const key = sc.customerId + '|' + sc.conversionActionName;
  if (_actionCache[key]) return _actionCache[key];
  const q = "SELECT conversion_action.resource_name, conversion_action.status FROM conversion_action WHERE conversion_action.name = '" +
    sc.conversionActionName.replace(/'/g, "\\'") + "' AND conversion_action.status = 'ENABLED'";
  const d = await gads(sc, '/googleAds:search', { query: q });
  const hit = ((d.results || [])[0] || {}).conversionAction;
  if (!hit || !hit.resourceName) throw new Error('No enabled conversion action named "' + sc.conversionActionName + '" in ' + sc.customerId);
  return (_actionCache[key] = hit.resourceName);
}
// Partial failure: the response carries results[] (empty object = failed row) and partialFailureError
// whose details[].errors[].location.fieldPathElements[{fieldName:'conversions',index:N}] names the row.
function parsePartialFailure(d, n) {
  const out = new Array(n).fill(null).map(function () { return { ok: true }; });
  const pfe = d && d.partialFailureError;
  if (pfe) {
    (pfe.details || []).forEach(function (det) {
      (det.errors || []).forEach(function (e) {
        const els = ((e.location || {}).fieldPathElements || []);
        const el = els.find(function (x) { return x.fieldName === 'conversions'; });
        const idx = el && el.index != null ? Number(el.index) : -1;
        const code = e.errorCode ? Object.keys(e.errorCode).map(function (k) { return e.errorCode[k]; }).join(',') : '';
        const reason = (code ? code + ': ' : '') + (e.message || 'rejected');
        if (idx >= 0 && idx < n) { out[idx] = { ok: false, reason: out[idx].ok ? reason : out[idx].reason + ' | ' + reason }; }
      });
    });
    // an error with no row index applies to the whole batch
    if (out.every(function (x) { return x.ok; }) && pfe.message) out.forEach(function (x) { x.ok = false; x.reason = pfe.message; });
  }
  return out;
}
async function uploadClickConversions(sc, conversions, validateOnly) {
  const res = [];
  for (let i = 0; i < conversions.length; i += 2000) {
    const chunk = conversions.slice(i, i + 2000);
    const d = await gads(sc, ':uploadClickConversions', { conversions: chunk, partialFailure: true, validateOnly: !!validateOnly });
    parsePartialFailure(d, chunk.length).forEach(function (x) { res.push(x); });
  }
  return res;
}

// ---------------------------------------------------------------- orchestration
// opts: { days, validateOnly, token, cfg, lookupGclid(client,email,phone) }
async function classifyOrders(client, opts) {
  const sc = storeConfig(client);
  const orders = await S.fetchOrders(client, opts.token, opts.cfg, opts.days || 7, null);
  const started = Date.now(); let lookups = 0;
  const max = opts.maxLookups || 300; const deadline = opts.lookupDeadlineMs || 45000;
  const rows = [];
  for (const o of orders) {
    const ids = S.clickIdsOf(o);
    // CRM fallback (pramogh / ratnalogy / hoq): only when the order carries no click ID of its own.
    if (!ids.gclid && !ids.gbraid && !ids.wbraid && opts.lookupGclid && lookups < max && Date.now() - started < deadline) {
      const ba = o.billing_address || {};
      const email = o.email || (o.customer || {}).email || ''; const phone = o.phone || ba.phone || (o.shipping_address || {}).phone || '';
      if (email || phone) { lookups++; const g = await opts.lookupGclid(client, email, phone); if (g) { ids.gclid = g; ids.source = 'crm'; } }
    }
    rows.push({ order: o, ids });
  }
  return { sc, rows, lookups };
}

async function runUpload(client, opts) {
  const sc = storeConfig(client);
  const validateOnly = !!opts.validateOnly || sc.mode === 'shadow';
  const summary = { store: sc.name, shop: sc.store, mode: sc.mode, validateOnly, days: opts.days || 7, ranAt: new Date().toISOString() };
  if (sc.mode === 'file' && !opts.force) return Object.assign(summary, { skipped: 'gadsUploadMode is "file" (pass force=1 for a dry run)' });
  if (!sc.customerId) return Object.assign(summary, { error: 'googleAdsCustomerId missing in CLIENTS_JSON' });
  if (sc.mode === 'api' && !validateOnly && !(sc.apiSince && !isNaN(sc.apiSince))) {
    return Object.assign(summary, { error: 'gadsApiSince (ISO time the store moved to the API) is required before live uploads, so pre-cutover gclid orders are never sent twice' });
  }
  const missing = credsMissing();
  const { rows, lookups } = await classifyOrders(client, opts);
  const log = await readLog(sc);
  let resource = '';
  if (!missing.length) { try { resource = await resolveAction(sc); } catch (e) { summary.error = e.message; } }
  else summary.error = 'missing env: ' + missing.join(', ');

  const built = rows.map(function (r) { return buildConversion(r.order, r.ids, sc, resource, opts.tz); });
  built.forEach(function (b) {
    if (b.skip) return;
    const d = dedupeReason(b, log.orders[b.orderId], sc);
    if (d) { b.skip = d; delete b.conversion; }
  });
  const send = built.filter(function (b) { return b.conversion; });
  let results = [];
  if (send.length && resource && !summary.error) {
    try { results = await uploadClickConversions(sc, send.map(function (b) { return b.conversion; }), validateOnly); }
    catch (e) { summary.error = e.message; }
  }
  const at = new Date().toISOString();
  send.forEach(function (b, i) {
    const r = results[i];
    b.status = r ? (r.ok ? (validateOnly ? 'valid' : 'uploaded') : 'rejected') : 'not_sent';
    if (r && !r.ok) b.reason = r.reason;
    if (!validateOnly && r) log.orders[b.orderId] = r.ok ? { via: 'api', status: 'ok', kind: b.kind, at } : { via: 'api', status: 'rejected', kind: b.kind, at, reason: r.reason };
  });
  if (!validateOnly && results.length) await writeLog(sc, log);

  const count = function (f) { return built.filter(f).length; };
  Object.assign(summary, {
    conversionAction: resource || null, crmLookups: lookups, orders: built.length,
    byKind: ['gclid', 'gbraid', 'wbraid', 'identifiers', 'nothing'].reduce(function (m, k) { m[k] = count(function (b) { return b.kind === k; }); return m; }, {}),
    excluded: count(function (b) { return b.skip && !/^(already_uploaded|uploaded_via_file|file_path_before_cutover|no_click_id_or_identifiers)$/.test(b.skip); }),
    deduped: count(function (b) { return /^(already_uploaded|uploaded_via_file|file_path_before_cutover)$/.test(b.skip || ''); }),
    sent: send.length,
    ok: count(function (b) { return b.status === 'uploaded' || b.status === 'valid'; }),
    rejected: count(function (b) { return b.status === 'rejected'; }),
    rows: built.map(function (b) { return { order: b.orderId, kind: b.kind, source: b.source, identifiers: b.identifiers, status: b.status || 'skipped', reason: b.reason || b.skip || null }; })
  });
  // one log line per row, per store (Vercel runtime logs)
  summary.rows.forEach(function (r) { console.log('[gads] ' + sc.name + ' ' + (validateOnly ? 'validate ' : '') + r.order + ' ' + r.kind + ' ' + r.status + (r.reason ? ' — ' + r.reason : '')); });
  try { await blobStore().put(runPath(sc), summary); } catch (e) { /* the run result is still returned */ }
  return summary;
}

// Health for the last N days: click-ID coverage and what happened to each order.
async function health(client, opts) {
  const sc = storeConfig(client);
  const { rows, lookups } = await classifyOrders(client, Object.assign({}, opts, { lookupGclid: opts.crm ? opts.lookupGclid : null }));
  const log = await readLog(sc);
  let lastRun = null; try { lastRun = await blobStore().get(runPath(sc)); } catch (e) { lastRun = null; }
  const lastByOrder = {}; ((lastRun && lastRun.rows) || []).forEach(function (r) { lastByOrder[r.order] = r; });
  const out = { store: sc.name, shop: sc.store, mode: sc.mode, days: opts.days || 7, crmLookups: lookups, orders: rows.length, excluded: 0,
    gclid: 0, gbraid: 0, wbraid: 0, identifiersOnly: 0, nothing: 0,
    sources: {}, uploadedOk: 0, uploadedViaFile: 0, rejected: 0, rejectedReasons: {}, pending: 0,
    lastRun: lastRun ? { ranAt: lastRun.ranAt, validateOnly: lastRun.validateOnly, sent: lastRun.sent, ok: lastRun.ok, rejected: lastRun.rejected, error: lastRun.error || null } : null };
  rows.forEach(function (r) {
    const b = buildConversion(r.order, r.ids, sc, 'x', opts.tz);
    if (b.skip && b.skip !== 'no_click_id_or_identifiers') { out.excluded++; return; }
    if (b.kind === 'identifiers') out.identifiersOnly++; else out[b.kind]++;
    if (b.source) out.sources[b.source] = (out.sources[b.source] || 0) + 1;
    const e = log.orders[b.orderId];
    if (e && e.status === 'ok') { if (e.via === 'file') out.uploadedViaFile++; else out.uploadedOk++; }
    else if (e && e.status === 'rejected') { out.rejected++; out.rejectedReasons[e.reason] = (out.rejectedReasons[e.reason] || 0) + 1; }
    else if (b.kind !== 'nothing') {
      const lr = lastByOrder[b.orderId];
      if (lr && lr.status === 'rejected') { out.rejected++; const k = '(dry run) ' + lr.reason; out.rejectedReasons[k] = (out.rejectedReasons[k] || 0) + 1; }
      else out.pending++;
    }
  });
  const eligible = out.orders - out.excluded;
  out.clickIdCoverage = eligible ? Math.round((out.gclid + out.gbraid + out.wbraid) * 100 / eligible) : 0;
  out.matchableCoverage = eligible ? Math.round((eligible - out.nothing) * 100 / eligible) : 0;
  return out;
}

module.exports = {
  normEmail, normPhone, hashEmail, hashPhone, sha256, identifiersOf, storeConfig, actionResource, exclusionReason, netValue,
  pickClickId, buildConversion, dedupeReason, parsePartialFailure, readLog, writeLog, logFileRows, setStore,
  runUpload, health, credsMissing, DEFAULT_EXCLUDE_ORDERS, DEFAULT_TEST_CODES
};
