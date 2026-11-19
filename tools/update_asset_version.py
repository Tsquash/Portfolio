#!/usr/bin/env python3
"""Stamp the static site's cache-busting asset URLs for a deployment."""

from datetime import datetime, timezone
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "site" / "index.html"
ASSETS = (
    "assets/icons/system.png",
    "assets/icons/menu-profile.png",
    "assets/fonts/ChicagoFLF.woff2",
    "desktop.css",
    "photo-albums.js",
    "content.js",
    "receipt-note-config.js",
    "receipt-note-client.js",
    "desktop.js",
)


def main():
    version = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    source = INDEX.read_text()
    source, count = re.subn(
        r'(data-asset-version=")[^"]+(")',
        rf'\g<1>{version}\g<2>',
        source,
        count=1,
    )
    if count != 1:
        raise RuntimeError("Could not update data-asset-version in site/index.html")

    for asset in ASSETS:
        escaped = re.escape(asset)
        source, count = re.subn(
            rf'({escaped}\?v=)[^"]+',
            rf'\g<1>{version}',
            source,
            count=1,
        )
        if count != 1:
            raise RuntimeError(f"Could not update cache version for {asset}")

    INDEX.write_text(source)
    print(f"Updated asset version to {version}")


if __name__ == "__main__":
    main()
