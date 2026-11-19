# Portfolio durable notes

- `.htaccess` sends `Cache-Control: no-cache, must-revalidate` when Apache's `mod_headers` is available, with an immediate expiry fallback through `mod_expires`. `tools/update_asset_version.py`, run by both deployment scripts, also stamps `site/index.html` with a unique asset version and deploys that page with `deploy_one.sh`. This gives each deployment distinct critical CSS/JS URLs even if a host cache ignores the header; it does not affect the desktop's `sessionStorage` restoration.

- The Note Print resize grip is a CSS-recreated, 8×8 `note.png` lower-right bitmap. Render each source pixel as a 2×2 CSS pixel cell; because absolutely positioned children anchor to `.receipt-note-paper`'s inner edge, offset the grip `-2px` on the right and bottom to place its final pixel at the frame's outer corner.
- The Note Print must not scroll: when its text grows, `resizeReceiptNote` measures the paper's frame height and expands the window instead. Preserve a manual resize by never shrinking the window during this automatic sizing.
- The Note Print close control is a 16×16 square. Its `left: 8px` position leaves four 2px source-pixel cells between the frame and control.
- The Note Print header is a 20px dithered band; its last 2px row sits beneath the close control. It has no top-right zoom/triangle glyph.
- The Send Note dialog is 260px tall with a 10px form gap. Disabled image buttons remain black and white (`opacity: 1`).
- The Send button's rest and pressed states are CSS-drawn 80×20 one-bit replicas of the button PNGs, including their transparent stepped-corner silhouette; do not use those raster assets as its background.
