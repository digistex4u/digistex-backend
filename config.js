'use strict';
let parsed = [];
try { parsed = JSON.parse(process.env.CLIENTS_JSON || '[]'); } catch (e) { parsed = []; }
if (!Array.isArray(parsed)) parsed = parsed && typeof parsed === 'object' ? [parsed] : [];
module.exports = {
  shopifyApiVersion: process.env.SHOPIFY_API_VERSION || '2025-01',
  timezoneOffset: process.env.TZ_OFFSET || '+05:30',
  clients: parsed.filter(c => c && c.enabled !== false)
};
