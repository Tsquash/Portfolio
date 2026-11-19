# Portfolio receipt relay

Byet only hosts static files, so it cannot call a script on the Raspberry Pi. This
Cloudflare Worker + D1 database is the narrow, public-facing relay: visitors send
notes to it; the Pi polls it over an outbound HTTPS connection; the Pi prints a
leased note and acknowledges it. Do **not** port-forward the Pi or expose an HTTP
endpoint from the home network.

## Deploy the relay

1. Install Node.js and sign in to Cloudflare: `npx wrangler login`.
2. From this directory, create the database:
   `npx wrangler d1 create portfolio-receipt-relay`.
   Copy the returned `database_id` into `wrangler.toml`.
3. Apply the schema:
   `npx wrangler d1 execute portfolio-receipt-relay --remote --file=schema.sql`.
4. In Cloudflare Turnstile, create a widget for the exact portfolio hostname(s),
   including `caleblightfoot.space` and any Byet hostname you will use. It must be
   a managed widget. Keep its secret key private.
5. Add the Worker secrets (use the exact browser origin, no trailing slash):

   ```sh
   npx wrangler secret put PI_TOKEN
   npx wrangler secret put TURNSTILE_SECRET
   npx wrangler secret put IP_HASH_SECRET
   npx wrangler secret put SITE_ORIGIN
   ```

   Generate `PI_TOKEN` and `IP_HASH_SECRET` with a password manager; each should
   be a distinct random value of at least 32 bytes. `SITE_ORIGIN` is a Worker
   secret so the public endpoint cannot be used from arbitrary browser origins.
6. Deploy: `npx wrangler deploy`. Set the resulting HTTPS Worker URL and the
   Turnstile *site key* (not secret key) in `site/receipt-note-config.js`, then
   deploy the site normally.

The Worker deliberately provides at-least-once delivery. If the Pi prints a note
but loses connectivity before `/ack`, the lease expires and it can print once more.
That trade-off prevents lost notes; the receipt itself is the durable record.

## UI contract

The future window should render Turnstile with
`window.receiptNoteConfig.turnstileSiteKey`, collect the returned token, then call:

```js
await window.submitReceiptNote(noteText, turnstileToken);
```

It should impose `window.receiptNoteMaxCharacters` as the textarea limit, show the
returned success state only after the promise resolves, and reset Turnstile after
each attempt. The accepted response means queued—not necessarily printed yet.

## Pi setup

Copy `pi/receipt-note-poller.py` onto the Pi beside `note.py`, set its environment
variables as described in that file, and run it as a systemd service. The token
must live only on the Pi and in the Worker secret store—not in this repository or
the static website.

On the Pi, after confirming `python3 note.py 'test'` still prints locally:

```sh
python3 -m pip install requests
sudo install -m 644 receipt-note-poller.service /etc/systemd/system/receipt-note-poller.service
sudo install -m 600 portfolio-receipt-poller.env.example /etc/portfolio-receipt-poller.env
sudoedit /etc/portfolio-receipt-poller.env
sudoedit /etc/systemd/system/receipt-note-poller.service
sudo systemctl daemon-reload
sudo systemctl enable --now receipt-note-poller
sudo systemctl status receipt-note-poller
```

In the service file replace the Pi user, the directory that contains `note.py`, and
`RECEIPT_NOTE_POLLER_PATH` with the absolute path to `receipt-note-poller.py`.
The selected user must retain permission to access the Epson USB device (verify
this with the existing local `note.py` test). Use `journalctl -u
receipt-note-poller -f` to watch errors. Do not run more than one poller instance,
or two printers may claim/print jobs out of order.
