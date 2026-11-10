# Google Ads API upload (CRM-PURCHASE) + enhanced conversions for leads

`gads.js` sends Shopify orders to Google Ads with `ConversionUploadService.UploadClickConversions`
(REST `customers/{id}:uploadClickConversions`, `partialFailure: true`). It replaces the gclid-only CSV feed
(`/export`) one store at a time. The CSV feed stays as the fallback until it is switched off.

## What each conversion carries

| Field | Value |
|---|---|
| click ID | exactly one of `gclid` → `gbraid` → `wbraid` (API rejects more than one) |
| `conversionAction` | `customers/<cid>/conversionActions/<id>` from `gadsConversionAction`, else looked up by name (`gadsConversionActionName`, default `CRM-PURCHASE`) |
| `conversionDateTime` | order `created_at` as `yyyy-mm-dd hh:mm:ss+05:30` |
| `conversionValue` | net order value: `current_total_price` (after refunds/edits), override with `gadsValueField` |
| `currencyCode` | order currency (INR) |
| `orderId` | Shopify order name (`#1234`), or the numeric id with `gadsOrderIdField: "id"` — Google dedupes on it |
| `userIdentifiers` | SHA-256 of the normalised email (trim, lowercase; gmail dots/+tag dropped) and phone (E.164, +91 for 10-digit Indian numbers) from the order, `customer`, billing and shipping address. Up to 5. |
| `consent.adUserData` | only when `gadsAdUserDataConsent` is set (needed for EEA users; Indian stores can leave it unset) |

Orders with no click ID but with an email or phone go up as **identifiers only** (enhanced conversions for leads).
Click-ID sources, in order: note attributes (`gclid`/`gbraid`/`wbraid`, with or without `_`) → Shopflo's
`landing_page_url` note attribute → Shopify `landing_site` → the store's CRM lookup (pramogh, ratnalogy, hoq).

## Never double-count

- **Uploaded-order log** in Vercel Blob, `gads-log/<shop>.json`, keyed by store + order id. API successes are
  recorded as `via:"api"`. Rows the CSV feed hands to Google's scheduled fetch (calls with the `EXPORT_KEY`) are
  recorded as `via:"file"`. Either one means the API skips the order. Rejected rows are retried on the next run.
- **Cutover**: `gadsApiSince` (ISO time) is required for live API uploads. gclid orders created before it belong to
  the file path; after it, `/export` stops serving that store's orders, so each order goes through one path only.
- **Excluded**: cancelled, `test: true`, voided/refunded, zero value, tag `test`, order `#HTR-24259-D2C`, and the code
  `TEST123` as a discount code or click ID. Add more with `gadsExcludeOrders` / `gadsExcludeCodes`.
- `validate_only` never writes the log.

## Per-store switch (CLIENTS_JSON)

```jsonc
{ "name": "heatronics", "googleAdsCustomerId": "492-700-2413",
  "gadsUploadMode": "shadow",            // file (default) | shadow | api
  "gadsConversionAction": "<numeric id>", // or leave empty and set gadsConversionActionName
  "gadsApiSince": "2026-11-15T00:30:00Z" // required for "api"
}
```

- `file`: as today. The API is never called (except a forced dry run).
- `shadow`: the daily cron sends the batch with `validate_only=true` next to the live CSV feed. Read the results in `/gads/health`.
- `api`: live upload from the daily cron (last 3 days, so rejected rows get retried). Set `gadsApiSince` to the switch time.
  To fall back, set the store back to `file`.

## Endpoints

- `GET /gads/health?client=<name>&days=7[&crm=1]` — counts only: orders, excluded, gclid / gbraid / wbraid /
  identifiers only / nothing, click-ID sources, uploaded OK (API), uploaded via file, rejected with reasons, pending,
  and the last run. Open, like `/diag`.
- `GET /gads/upload?client=<name>&days=7` — **admin** (`x-admin-password` header, or `Authorization: Bearer CRON_SECRET`).
  Dry run (`validate_only`) by default, works in any mode. `&validate_only=0` uploads for real and only for stores in `api` mode.
  Returns one line per order (order name, kind, status, reason). The same lines go to the runtime log as `[gads] …`.

## Env vars

`GADS_CLIENT_ID`, `GADS_CLIENT_SECRET`, `GADS_REFRESH_TOKEN` (OAuth for the login that has access on the MCC),
`GADS_DEVELOPER_TOKEN`, `GADS_LOGIN_CUSTOMER_ID` (MCC id, digits; per store `gadsLoginCustomerId` overrides it),
optional `GADS_API_VERSION` (default tries v22 → v21 → v20). Blob uses the existing `BLOB_READ_WRITE_TOKEN`.

## Account-side prerequisites (per Google Ads account)

1. Customer data terms accepted (Goals → Conversions → Settings).
2. Enhanced conversions for leads turned on, with the API as the upload method.
3. The OAuth login has Admin access on the MCC.
4. The developer token is approved for Basic or Standard access. Test access can't upload to live accounts.
5. A CRM-PURCHASE action of type *Import → CRM / clicks* in each account. Put its id in `gadsConversionAction`.
