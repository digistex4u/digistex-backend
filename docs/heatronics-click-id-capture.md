# Heatronics — Google click-ID capture (gclid / gbraid / wbraid)

## Why most Heatronics orders have no click ID

Between 4 and 10 Nov 2026, only 18 of the last 64 orders (28%) carried a Google click ID. As a result, the daily CRM-PURCHASE offline upload
counted 5 bed-warmer sales against about 35 Shopify units.

How the backend finds a click ID (`shopify.js` → `server.js doPull`):

1. **Order `note_attributes`, `gclid` / `_gclid` only.** This is the only source the upload trusts. A click ID is there only if
   something on the storefront wrote it to the **cart attributes** before checkout. Shopify and Shopflo then copy those into the order.
2. **CRM fallback by email/phone (`CRM_LOOKUP`).** This exists for pramogh, ratnalogy and hoq only. **Heatronics has no entry**, because no CRM
   tracker on heatronics.in feeds a `gclid-lookup` endpoint. Any Heatronics order without the attribute is dropped from the upload.

What causes the 72% gap (in order of likely size):

- **Nothing on heatronics.in reliably writes the click ID to the cart.** The Ratnalogy/Pramogh approach (mycrm / pramogh-crm-hub
  `tracker.js`) writes `_gclid` only when the checkout button is clicked. Shopflo's checkout button often runs its own handler and
  redirects before that `fetch('/cart/update.js')` finishes, so the attribute is lost. The click ID is also only kept if the customer clicks
  checkout in the session where it was captured.
- **iOS traffic carries `gbraid` / `wbraid`, not `gclid`.** Nothing captured or read those, so every iPhone or Google-app purchase looked
  like it had no click ID.
- **`landing_site` was never read.** Shopify stores the first URL of the session on the order, and it often still contains `?gclid=`.
  The backend did not request that field.
- **Phone fallback was broken for orders.** `fetchOrders` restricted `fields` to a list without `phone` / `billing_address`, so the
  CRM lookup only ever got an email. This doesn't affect Heatronics today, because it has no CRM, but it was a bug for the other stores.

## What this PR changes

**Backend (safe, no behaviour change for existing gclid rows):**
- `clickIdsOf(order)` reads `gclid`, `gbraid` and `wbraid` from note_attributes (with or without `_`). If none are there, it falls back to the
  order's `landing_site` query string. `gclidOf` now uses it, so orders whose gclid is only in `landing_site` reach the upload.
- `fetchOrders` also requests `phone, billing_address, landing_site`.
- `/api/diag` now also reports `braidOnlyRows` (orders with only a gbraid/wbraid) and `gclidFromLandingSite`.
- The Google Ads CSV is still **gclid-only**. gbraid/wbraid orders are counted in diag but not uploaded yet: Google's click-conversion
  file template keys on "Google Click ID", and gbraid/wbraid uploads need the API path (`ClickConversion.gbraid/wbraid`). That is a
  separate change once we see how many iOS orders there are.

**Theme snippet** (`theme-snippets/dgx-click-ids.liquid`). The Heatronics theme is **not in any digistex4u repo**, so it must be
installed in the Shopify admin. What the snippet does:
- Reads `gclid` / `gbraid` / `wbraid` from the landing URL. It stores the latest click for **90 days** in a first-party cookie (`_dgx_cid`)
  and in localStorage.
- **On every page load** it writes them to the cart attributes (`gclid`, `gbraid`, `wbraid`, `dgx_click_ts`). It first reads `/cart.js`
  and skips the write when the values are already there. This is the same page-load approach as Pramogh's `pmg_vid` tag, so the cart
  carries the ID long before anyone clicks checkout.
- It re-syncs after `/cart/add` or `/cart/clear`, which covers a new cart and Shopflo buy-now.
- **Before checkout** it fires a `sendBeacon` cart update in the capture phase. It runs before Shopflo's handler and survives the redirect.
- No personal data. It never blocks the page, and every call fails silently.

## Install instructions (Heatronics Shopify admin, ~5 minutes)

1. Shopify admin → **Online Store → Themes**. On the live theme, click **⋯ → Duplicate**. Work on the copy first.
2. On the copy: **⋯ → Edit code**.
3. Under **Snippets**, click **Add a new snippet**, name it `dgx-click-ids`, and paste the whole of
   `theme-snippets/dgx-click-ids.liquid`. Save.
4. Open **Layout → theme.liquid**. Just **before `</head>`**, add this line and save:
   ```liquid
   {% render 'dgx-click-ids' %}
   ```
5. If the theme already has a script that writes `gclid` to the cart (search the code for `cart/update` and `gclid`), keep only one
   of them, or the two will overwrite each other.
6. Preview the duplicate theme and run the test plan below. When it passes, **Publish** the duplicate.
7. In Shopflo's dashboard, confirm that cart attributes / note attributes are passed through to Shopify orders (this is on by
   default). Pramogh's Shopflo orders already return `pmg_vid` this way.

## Test plan

1. Open `https://heatronics.in/?gclid=TEST123` (on the preview theme, add `&preview_theme_id=<id>`).
2. Open `https://heatronics.in/cart.js`. `attributes.gclid` should be `"TEST123"` and `dgx_click_ts` should be set, even with an empty cart.
3. Browse to another page, add a bed warmer to the cart and reload `/cart.js`. `gclid` should still be `TEST123`.
4. Open a new tab at `https://heatronics.in/` with no parameters and check `/cart.js`. `gclid` should still be `TEST123` (cookie, 90 days).
5. Repeat step 1 with `?gbraid=TESTBR1`. `/cart.js` should show `gbraid: "TESTBR1"` and an empty `gclid` (the latest click wins).
6. Optional, end to end: place a ₹1 test or COD order through Shopflo with `?gclid=TEST123`. The order page's **Additional details**
   should show `gclid TEST123`, and `/api/pull?client=heatronics&type=orders&days=1` should list it with that gclid.
   Cancel or refund the test order. Don't let a TEST gclid reach the Google upload: delete the row from that day's CSV, or run the
   test after the 06:00 IST cron.
7. After about 7 days live, `/api/diag` should show Heatronics `coverage` rising from ~28%. Organic, direct and Meta orders will never
   carry a Google click ID, so 100% is not the target. Compare `gclidRows` against Google-attributed orders in Shopify.

These checks were already run against a mock store in headless Chromium: capture, cart write, no repeat POST on the next page, re-sync after a cart clear,
the checkout beacon, a gbraid replacing a gclid, and the 90-day cookie. `npm test` covers the backend parser.

## Update (job 61): Google Ads API upload

The gaps above are now closed in the backend. See `docs/google-ads-api-upload.md`.
- gbraid / wbraid orders go up through the Google Ads API (`gads.js`). The CSV is still gclid-only and is phased out store by store.
- Heatronics has no CRM, so orders without a click ID go up with the hashed email/phone from the Shopify order (enhanced conversions for leads).
- Shopflo's `landing_page_url` note attribute is now read as a click-ID source, after note attributes and before `landing_site`.
- `/gads/health` replaces `/diag` coverage for the API stores. It also counts identifier-only and no-signal orders.
- The theme snippet is unchanged. This PR doesn't touch any theme.
