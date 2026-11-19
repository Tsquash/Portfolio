#!/usr/bin/env python3
"""Poll the receipt relay and feed leased notes to the local note.py printer.

Required environment variables:
  RECEIPT_RELAY_URL=https://your-worker.workers.dev
  RECEIPT_RELAY_TOKEN=<the same random PI_TOKEN stored as a Worker secret>

This script has no inbound listener. Install `requests` in the Python environment
that can already run note.py: `python3 -m pip install requests`.
"""
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import requests

RELAY_URL = os.environ.get('RECEIPT_RELAY_URL', '').rstrip('/')
TOKEN = os.environ.get('RECEIPT_RELAY_TOKEN', '')
NOTE_SCRIPT = Path(__file__).resolve().with_name('note.py')
POLL_SECONDS = 10


def request_headers():
    return {'Authorization': f'Bearer {TOKEN}'}


def main():
    if not RELAY_URL or not TOKEN:
        sys.exit('RECEIPT_RELAY_URL and RECEIPT_RELAY_TOKEN must be set.')
    if not NOTE_SCRIPT.is_file():
        sys.exit(f'Could not find note.py next to {Path(__file__).name}.')

    while True:
        try:
            response = requests.get(f'{RELAY_URL}/next', headers=request_headers(), timeout=20)
            if response.status_code == 204:
                time.sleep(POLL_SECONDS)
                continue
            response.raise_for_status()
            job = response.json()
            subprocess.run([sys.executable, str(NOTE_SCRIPT)], input=job['note'], text=True, check=True, timeout=240)
            ack = requests.post(
                f'{RELAY_URL}/ack', headers={**request_headers(), 'Content-Type': 'application/json'},
                data=json.dumps({'id': job['id'], 'leaseToken': job['leaseToken']}), timeout=20
            )
            ack.raise_for_status()
        except KeyboardInterrupt:
            return
        except Exception as error:
            print(f'Receipt relay error: {error}', file=sys.stderr, flush=True)
            time.sleep(POLL_SECONDS)


if __name__ == '__main__':
    main()
