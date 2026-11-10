'use strict';
// node tests/gads.test.js — no network: Shopify and Google are stubbed through global.fetch.
const a = require('assert');
const S = require('../shopify.js');
const G = require('../gads.js');

// ---------- normalisation + hashing
a.strictEqual(G.normEmail('  Some.One+ads@GMAIL.com '), 'someone@gmail.com');
a.strictEqual(G.normEmail('A.B@Example.in'), 'a.b@example.in');
a.strictEqual(G.normEmail('not-an-email'), '');
a.strictEqual(G.normPhone('98765 43210'), '+919876543210');
a.strictEqual(G.normPhone('09876543210'), '+919876543210');
a.strictEqual(G.normPhone('919876543210'), '+919876543210');
a.strictEqual(G.normPhone('+91-98765-43210'), '+919876543210');
a.strictEqual(G.normPhone(''), '');
a.strictEqual(G.hashEmail('x@y.com'), require('crypto').createHash('sha256').update('x@y.com').digest('hex'));

// ---------- Shopflo landing_page_url (gap 3)
const lp = S.clickIdsOf({ note_attributes: [{ name: 'landing_page_url', value: 'https://heatronics.in/products/bw?gbraid=GB1&utm_source=google' }], landing_site: '/?gclid=LS' });
a.strictEqual(lp.gbraid, 'GB1'); a.strictEqual(lp.gclid, null); a.strictEqual(lp.source, 'landing_page_url');
a.strictEqual(S.clickIdsOf({ note_attributes: [{ name: 'gclid', value: 'N' }, { name: 'landing_page_url', value: '/?gclid=L' }] }).gclid, 'N');

// ---------- one click ID per conversion, gclid > gbraid > wbraid
const client = { name: 'heatronics', shopifyStore: 'heatronicss.myshopify.com', googleAdsCustomerId: '492-700-2413', gadsConversionAction: '111', gadsUploadMode: 'api', gadsApiSince: '2026-11-08T00:00:00Z' };
const sc = G.storeConfig(client);
const R = G.actionResource(sc);
a.strictEqual(R, 'customers/4927002413/conversionActions/111');
const ord = (o) => Object.assign({ id: 1, name: '#HTR-1', created_at: '2026-11-09T18:40:00Z', total_price: '2999.00', current_total_price: '2799.00', currency: 'INR', financial_status: 'paid', email: 'A@b.com', billing_address: { phone: '9876543210' } }, o);
const both = G.buildConversion(ord({}), { gclid: 'G', gbraid: 'B', wbraid: 'W' }, sc, R, '+05:30');
a.strictEqual(both.kind, 'gclid');
a.deepStrictEqual(['gclid', 'gbraid', 'wbraid'].filter(k => both.conversion[k]), ['gclid']);
a.strictEqual(both.conversion.conversionDateTime, '2026-11-10 00:10:00+05:30');
a.strictEqual(both.conversion.conversionValue, 2799);          // net (current_total_price), not gross
a.strictEqual(both.conversion.currencyCode, 'INR');
a.strictEqual(both.conversion.orderId, '#HTR-1');
a.strictEqual(both.conversion.conversionAction, R);
a.strictEqual(both.conversion.userIdentifiers.length, 2);        // hashed email + phone ride along
const br = G.buildConversion(ord({}), { gbraid: 'B', wbraid: 'W' }, sc, R);
a.strictEqual(br.kind, 'gbraid'); a.ok(!br.conversion.wbraid);
// identifiers only: no click ID at all, matched by enhanced conversions for leads
const idOnly = G.buildConversion(ord({ email: '', customer: { email: 'c@d.com' }, billing_address: {}, shipping_address: { phone: '+91 99999 88888' } }), {}, sc, R);
a.strictEqual(idOnly.kind, 'identifiers'); a.ok(!idOnly.conversion.gclid);
a.deepStrictEqual(idOnly.conversion.userIdentifiers.map(x => Object.keys(x)[0]), ['hashedEmail', 'hashedPhoneNumber']);
a.strictEqual(G.buildConversion(ord({ email: '', billing_address: {} }), {}, sc, R).skip, 'no_click_id_or_identifiers');
a.ok(!both.conversion.consent);                                 // consent only when configured
a.deepStrictEqual(G.buildConversion(ord({}), { gclid: 'G' }, G.storeConfig(Object.assign({}, client, { gadsAdUserDataConsent: 'granted' })), R).conversion.consent, { adUserData: 'GRANTED' });

// ---------- exclusions
a.strictEqual(G.buildConversion(ord({ cancelled_at: '2026-11-10T00:00:00Z' }), { gclid: 'G' }, sc, R).skip, 'cancelled');
a.strictEqual(G.buildConversion(ord({ test: true }), { gclid: 'G' }, sc, R).skip, 'test_order');
a.strictEqual(G.buildConversion(ord({ name: '#HTR-24259-D2C' }), { gclid: 'G' }, sc, R).skip, 'excluded_order');
a.strictEqual(G.buildConversion(ord({}), { gclid: 'TEST123' }, sc, R).skip, 'test_click_id');
a.strictEqual(G.buildConversion(ord({ discount_codes: [{ code: 'test123' }] }), { gclid: 'G' }, sc, R).skip, 'test_code');
a.strictEqual(G.buildConversion(ord({ financial_status: 'refunded' }), { gclid: 'G' }, sc, R).skip, 'refunded');
a.strictEqual(G.buildConversion(ord({ current_total_price: '0.00' }), { gclid: 'G' }, sc, R).skip, 'zero_value');

// ---------- dedupe
a.strictEqual(G.dedupeReason({ kind: 'gclid', createdAt: '2026-11-07T00:00:00Z' }, null, sc), 'file_path_before_cutover');
a.strictEqual(G.dedupeReason({ kind: 'gbraid', createdAt: '2026-11-07T00:00:00Z' }, null, sc), null); // never in the gclid-only file
a.strictEqual(G.dedupeReason({ kind: 'gclid', createdAt: '2026-11-09T00:00:00Z' }, { via: 'file', status: 'ok' }, sc), 'uploaded_via_file');
a.strictEqual(G.dedupeReason({ kind: 'gclid', createdAt: '2026-11-09T00:00:00Z' }, { via: 'api', status: 'ok' }, sc), 'already_uploaded');
a.strictEqual(G.dedupeReason({ kind: 'gclid', createdAt: '2026-11-09T00:00:00Z' }, { via: 'api', status: 'rejected' }, sc), null); // retried

// ---------- partial failure parsing
const pf = G.parsePartialFailure({ results: [{}, { gclid: 'x' }], partialFailureError: { message: 'x', details: [{ errors: [{ errorCode: { conversionUploadError: 'UNPARSEABLE_GCLID' }, message: 'bad gclid', location: { fieldPathElements: [{ fieldName: 'conversions', index: 0 }, { fieldName: 'gclid' }] } }] }] } }, 2);
a.deepStrictEqual(pf, [{ ok: false, reason: 'UNPARSEABLE_GCLID: bad gclid' }, { ok: true }]);

// ---------- end to end with stubbed Shopify + Google, in-memory log
(async function () {
  const mem = {}; G.setStore({ async get(p) { return mem[p] ? JSON.parse(mem[p]) : null; }, async put(p, o) { mem[p] = JSON.stringify(o); } });
  process.env.GADS_CLIENT_ID = 'id'; process.env.GADS_CLIENT_SECRET = 'sec'; process.env.GADS_REFRESH_TOKEN = 'rt';
  const orders = [
    ord({ name: '#A1', created_at: '2026-11-09T10:00:00Z', note_attributes: [{ name: 'gclid', value: 'Cj0A' }] }),
    ord({ name: '#A2', created_at: '2026-11-09T11:00:00Z', note_attributes: [{ name: 'gbraid', value: 'GB2' }] }),
    ord({ name: '#A3', created_at: '2026-11-09T12:00:00Z' }),                                                         // identifiers only
    ord({ name: '#A4', created_at: '2026-11-07T12:00:00Z', note_attributes: [{ name: 'gclid', value: 'OLD' }] }),       // before cutover → file
    ord({ name: '#HTR-24259-D2C', note_attributes: [{ name: 'gclid', value: 'TEST123' }] }),
    ord({ name: '#A6', created_at: '2026-11-09T13:00:00Z', note_attributes: [{ name: 'gclid', value: 'BAD' }] }),
  ];
  const calls = [];
  global.fetch = async function (url, opts) {
    url = String(url);
    if (url.indexOf('oauth2.googleapis.com') > -1) return new Response(JSON.stringify({ access_token: 't', expires_in: 3600 }));
    if (url.indexOf('/orders.json') > -1) return new Response(JSON.stringify({ orders }));
    if (url.indexOf(':uploadClickConversions') > -1) {
      const b = JSON.parse(opts.body); calls.push(b);
      const bad = b.conversions.findIndex(c => c.gclid === 'BAD');
      return new Response(JSON.stringify({ results: b.conversions.map(() => ({})), partialFailureError: bad < 0 ? undefined : { message: 'x', details: [{ errors: [{ errorCode: { conversionUploadError: 'UNPARSEABLE_GCLID' }, message: 'The click ID could not be decoded.', location: { fieldPathElements: [{ fieldName: 'conversions', index: bad }] } }] }] } }));
    }
    throw new Error('unexpected fetch ' + url);
  };
  const cfg = { shopifyApiVersion: '2025-01' };
  const dry = await G.runUpload(client, { token: 'x', cfg, days: 7, validateOnly: true, tz: '+05:30' });
  a.strictEqual(calls[0].validateOnly, true); a.strictEqual(calls[0].partialFailure, true);
  a.strictEqual(dry.sent, 4); a.strictEqual(dry.ok, 3); a.strictEqual(dry.rejected, 1);
  a.ok(!mem['gads-log/heatronicss.myshopify.com.json'], 'validate_only must not write the uploaded-order log');
  const live = await G.runUpload(client, { token: 'x', cfg, days: 7, tz: '+05:30' });
  a.strictEqual(calls[1].validateOnly, false); a.strictEqual(live.ok, 3);
  const log = JSON.parse(mem['gads-log/heatronicss.myshopify.com.json']).orders;
  a.strictEqual(log['#A1'].status, 'ok'); a.strictEqual(log['#A6'].status, 'rejected'); a.ok(!log['#A4']);
  const again = await G.runUpload(client, { token: 'x', cfg, days: 7, tz: '+05:30' });
  a.strictEqual(again.sent, 1, 'only the rejected row is retried'); a.strictEqual(calls[2].conversions[0].orderId, '#A6');
  const h = await G.health(client, { token: 'x', cfg, days: 7 });
  a.strictEqual(h.orders, 6); a.strictEqual(h.excluded, 1); a.strictEqual(h.gclid, 3); a.strictEqual(h.gbraid, 1); a.strictEqual(h.identifiersOnly, 1);
  a.strictEqual(h.uploadedOk, 3); a.strictEqual(h.rejected, 1); a.strictEqual(h.pending, 1); // #A4 still with the file path
  // the live upload refuses without a cutover time
  const noCut = await G.runUpload(Object.assign({}, client, { gadsApiSince: '' }), { token: 'x', cfg, days: 7 });
  a.ok(/gadsApiSince/.test(noCut.error));
  // file mode never calls the API unless forced
  const n = calls.length; const fm = await G.runUpload(Object.assign({}, client, { gadsUploadMode: 'file' }), { token: 'x', cfg });
  a.ok(fm.skipped); a.strictEqual(calls.length, n);
  console.log('gads: all passed');
})().catch(function (e) { console.error(e); process.exit(1); });
