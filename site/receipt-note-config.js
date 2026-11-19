/*
 * Public browser configuration for the receipt-note relay.
 *
 * Set endpoint to the HTTPS URL printed by `wrangler deploy` after deploying
 * receipt-relay/. This file is public: never put the Pi token, Turnstile secret,
 * or any other credential here.
 */
window.receiptNoteConfig = {
  endpoint: 'https://portfolio-receipt-relay.caleblightfoot.workers.dev',
  turnstileSiteKey: '0x4AAAAAAGH_aFflEOBN7UQq'
};
