'use strict';
// node tests/click-ids.test.js
const S = require('../shopify.js');
const a = require('assert');
a.strictEqual(S.clickIdsOf({ note_attributes: [{ name: '_gclid', value: 'G1' }] }).gclid, 'G1');
a.strictEqual(S.clickIdsOf({ note_attributes: [{ name: 'gclid', value: 'G2' }] }).source, 'note_attributes');
a.strictEqual(S.clickIdsOf({ note_attributes: [{ name: 'gbraid', value: 'B1' }] }).gbraid, 'B1');
a.strictEqual(S.gclidOf({ note_attributes: [{ name: 'gbraid', value: 'B1' }] }), null);
const l = S.clickIdsOf({ note_attributes: [], landing_site: '/products/x?utm_source=google&gclid=Cj0K%2Dabc&x=1' });
a.strictEqual(l.gclid, 'Cj0K-abc'); a.strictEqual(l.source, 'landing_site');
a.strictEqual(S.clickIdsOf({ note_attributes: [{ name: 'gclid', value: 'N' }], landing_site: '/?gclid=L' }).gclid, 'N');
a.strictEqual(S.clickIdsOf({ landing_site: '/?wbraid=W9' }).wbraid, 'W9');
a.strictEqual(S.gclidOf({}), null);
console.log('click-ids: all passed');
