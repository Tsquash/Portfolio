#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

python3 tools/update_asset_version.py
python3 tools/generate_photo_albums.py
python3 tools/generate_projects.py

if ! command -v lftp >/dev/null 2>&1; then
  echo 'Install lftp first: brew install lftp' >&2
  exit 1
fi

# Prompts for the hosting password; no credentials are stored in this file.
# Byet's data TLS connection fails, so public files/listings use clear data
# connections. Login still requires TLS and certificate verification.
lftp -u b13_43428790 ftp://ftpupload.net -e '
  set cmd:fail-exit true;
  set ftp:ssl-force true;
  set ssl:verify-certificate true;
  set ftp:ssl-protect-list false;
  set ftp:ssl-protect-data false;
  set net:timeout 20;
  set net:max-retries 2;
  set net:reconnect-interval-base 1;
  set net:reconnect-interval-multiplier 1;
  set net:reconnect-interval-max 1;
  mirror --reverse --parallel=2 --verbose --no-perms --exclude-glob .DS_Store --exclude-glob monadnock.mov ./site /htdocs;
  bye;
'
echo 'Deployment complete: http://caleblightfoot.byethost13.com'
