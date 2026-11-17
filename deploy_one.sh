#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if (($# == 0)); then
  echo "Usage: $0 file ..." >&2
  exit 1
fi

if ! command -v lftp >/dev/null 2>&1; then
  echo 'Install lftp first: brew install lftp' >&2
  exit 1
fi

put_commands=
for file in "$@"; do
  case "$file" in
    ""|/*|..|../*|*/../*|*/..)
      echo "Invalid file path: $file" >&2
      exit 1
      ;;
  esac

  if [[ ! -f "site/$file" ]]; then
    echo "File not found in site/: $file" >&2
    exit 1
  fi

  printf -v put_command '  put %q -o %q;\n' "site/$file" "/htdocs/$file"
  put_commands+="$put_command"
done

# Prompts for the hosting password; no credentials are stored in this file.
lftp -u b13_43428790 ftp://ftpupload.net -e "
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
$put_commands  bye;
"

echo 'Deployment complete: http://caleblightfoot.byethost13.com'
