/*
 * Public browser configuration for the receipt-note relay.
 *
 * Set endpoint to the HTTPS URL printed by `wrangler deploy` after deploying
 * receipt-relay/. This file is public: never put the Pi token, Turnstile secret,
 * or any other credential here.
 */
window.receiptNoteConfig = {
  endpoint: '',
  turnstileSiteKey: ''
};
