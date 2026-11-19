# Portfolio agent guide

Read this first. This is the durable operating guide for agents working on the portfolio; keep it concise and current.

## Current implementation

- Dependency-free static site in `site/`; no package manager, framework, build step, or automated test suite.
- Classic monochrome Macintosh desktop UI. It boots on a visitor's first load in a browser session, then restores open windows, positions, sizes, view mode, and photo state from `sessionStorage`.
- Desktop and menu items expose Projects, Welcome/About, Resume, GitHub, LinkedIn, Media, Instagram, Spotify, and a Note Print receipt-note composer. Special → Send a Note… opens the same composer.
- Current content is one Markdown-defined Air Quality Monitor project, six generated photo albums (51 images), and two native-video-player windows (`Monadnock.mp4` and `Dandelion.mp4`).
- Mouse users select with one click and open with two; touch and keyboard activation open with one action.
- At widths up to 700 px, windows use the compact/mobile layout and only the active window is normally visible.
- Hosting target is Byet at `http://caleblightfoot.byethost13.com`; deployment copies `site/` to `/htdocs`.

## Source map

| Path | Source of truth for |
| --- | --- |
| `site/content.js` | Name, bio, portrait, social URLs, videos, and generated project/album manifests |
| `site/desktop.js` | Window definitions/renderers, desktop icons, interactions, startup, persistence, responsive behavior |
| `site/desktop.css` | All site styling; mobile breakpoint is `700px` |
| `site/index.html` | Page metadata, script order, menu markup, desktop/window shell |
| `site/receipt-note-client.js`, `site/receipt-note-config.js` | Public receipt relay submission API and public endpoint/Turnstile configuration |
| `site/assets/Photos/<album>/` | Album images; each immediate subdirectory is an album |
| `site/photo-albums.js` | Generated album manifest; never hand-edit |
| `tools/generate_photo_albums.py` | Manifest generator and supported image extensions |
| `site/assets/Projects/<project>/` | One Markdown file plus optional project images; each immediate subdirectory is a project |
| `site/projects.js` | Generated project manifest; never hand-edit |
| `tools/generate_projects.py` | Project manifest generator and Markdown title validation |
| `site/assets/resume.pdf` | Resume shown in the Resume window |
| `site/assets/icons/` | Finder/social/window icons |
| `site/assets/fonts/ChicagoFLF.woff2` | Self-hosted UI font |
| `site/404.html`, `site/.htaccess` | Domain-root custom 404 page and Apache mapping |
| `tools/dither.html` | Standalone in-browser image dithering utility; not loaded by the portfolio |
| `deploy.sh` | Regenerate albums/projects, then mirror the full site to `/htdocs` |
| `deploy_one.sh` | Upload named files only; arguments are paths relative to `site/` |

Script load order matters: `photo-albums.js` and `projects.js` define their manifests, `content.js` assigns them to `window.portfolioContent`, and `desktop.js` renders that content.

## Common updates

### Text, links, videos, and projects

Project folders are data-driven. Create one immediate folder under `site/assets/Projects/`, put exactly one `.md` file in it, and use its first level-one heading (`# Title`) as the visitor-facing project name. Any supporting images belong in that same folder and use relative Markdown image paths, such as `![Display](display.png)`. Run `python3 tools/generate_projects.py` and commit the regenerated `site/projects.js`; the project folder/window definitions are created automatically. The supported Markdown subset is headings, paragraphs, bold, italic, inline code, ordered/unordered lists, links, images, and horizontal rules; raw HTML is not rendered.

For a video, add the web-compatible file under `site/assets/` and add `{ id, name, src }` to `videos`. Video window definitions are automatic. Replace `site/assets/resume.pdf` in place to update the resume.

Adding a new top-level desktop item or a new content type is not data-only: update the definitions/renderers and the final `desktopItems` or `desktopPersonalItems` assembly in `site/desktop.js`; add its icon under `site/assets/icons/` and styles in `site/desktop.css` if needed.

### Photos and portrait

- Albums: create/rename/remove an immediate folder under `site/assets/Photos/`, add images, then run `python3 tools/generate_photo_albums.py` and commit the regenerated `site/photo-albums.js`.
- Album and image order is natural, case-insensitive filename order. Folder names become displayed album names; filenames become captions. Empty album folders are included only when Git preserves them (use `.gitkeep`).
- Supported extensions are defined by `IMAGE_EXTENSIONS` in the generator.
- The portrait lives directly in `site/assets/Photos/portrait.png`, so it is not treated as an album. Its path and alt text are in `site/content.js`.
- Do not manually URL-encode media paths; the generator does it.

### UI behavior and saved state

Window content is implemented by `render*` functions and registered with `define(...)` in `site/desktop.js`. Desktop/session persistence uses the key `macintosh-portfolio-desktop-v1` in both `site/index.html` and `site/desktop.js`. Keep those references synchronized. Bump the key/version deliberately if a state-schema change must invalidate old saved state. Clear that session key while testing the startup sequence.

Preserve keyboard operation, coarse-pointer behavior, focus handling, window bounds, and the mobile rules when changing interactions. Test both sides of the 700 px breakpoint.

# Portfolio durable notes

- `.htaccess` sends `Cache-Control: no-cache, must-revalidate` when Apache's `mod_headers` is available, with an immediate expiry fallback through `mod_expires`. `tools/update_asset_version.py`, run by both deployment scripts, also stamps `site/index.html` with a unique asset version and deploys that page with `deploy_one.sh`. This gives each deployment distinct critical CSS/JS URLs even if a host cache ignores the header; it does not affect the desktop's `sessionStorage` restoration.
- The optional receipt-note feature is split from the static site: `receipt-relay/` contains a Cloudflare Worker/D1 relay and Pi poller reference. `site/receipt-note-client.js` exposes `window.submitReceiptNote(note, turnstileToken)` for UI code, while `site/receipt-note-config.js` holds only public Worker URL and Turnstile site-key configuration.
- Never place Pi or Worker secret values in `site/`. The Pi must poll the relay outbound over HTTPS; do not open a home-network port for receipt submissions.
- The receipt-note composer and its Send Note dialog are implemented in `site/desktop.js`; its scalable blank paper recreates the supplied note's 1-bit frame in CSS because `note.png` contains baked-in example copy, while its top-right and resize-corner sprites are native 2× crops of that asset. Turnstile is loaded only when the send dialog opens.
- The Note Print resize grip is a CSS-recreated, 8×8 `note.png` lower-right bitmap. Render each source pixel as a 2×2 CSS pixel cell; because absolutely positioned children anchor to `.receipt-note-paper`'s inner edge, offset the grip `-2px` on the right and bottom to place its final pixel at the frame's outer corner.
- The Note Print must not scroll: when its text grows, `resizeReceiptNote` measures the paper's frame height and expands the window instead. Preserve a manual resize by never shrinking the window during this automatic sizing.
- The Note Print close control is a 16×16 square. Its `left: 8px` position leaves four 2px source-pixel cells between the frame and control.
- The Note Print header is a 20px dithered band; its last 2px row sits beneath the close control. It has no top-right zoom/triangle glyph.
- The Send Note dialog is 232px tall with a 12px form gap; Send has a 10px right inset to align with the prompt’s exclamation point. Its status paragraph is hidden while empty so Send stays close to Turnstile; an error restores the paragraph and expands the dialog to 260px. Disabled image buttons remain black and white (`opacity: 1`).
- The Send button's rest and pressed states are CSS-drawn 80×20 one-bit replicas of the button PNGs, including their transparent stepped-corner silhouette; do not use those raster assets as its background.

## Efficient workflow

1. Run `git status --short`; preserve unrelated and pre-existing user changes.
2. Read this file, then only the source-map entries relevant to the task. Do not scan binary photo/video assets unless the task requires visual inspection.
3. Edit source files, not generated output. Regenerate `site/photo-albums.js` after photo changes and `site/projects.js` after project changes.
4. Preview from the repository root with `python3 -m http.server 8000 --directory site`, then visit `http://localhost:8000/`. A direct `site/index.html` open also works for most UI checks, but an HTTP preview better matches hosting.
5. Run proportionate checks before handoff:
   - `python3 tools/generate_photo_albums.py` after photo changes.
   - `python3 tools/generate_projects.py` after project changes.
   - `node --check site/content.js && node --check site/desktop.js` after JavaScript changes, when Node is available.
   - Check desktop and narrow/mobile layouts, mouse/touch-equivalent opening, keyboard activation, window close/zoom/drag, media navigation, external links, and state restoration when affected.
   - Test the custom 404 on Apache/Byet; Python's simple server does not apply `.htaccess`.
6. Report what changed and what was actually verified. Do not claim browser or deployment verification unless performed.

## Deployment guardrails

Deploy only when the user explicitly asks. `deploy.sh` requires `lftp`, prompts for the FTP password, regenerates album and project manifests, uploads changed/new files, and does not delete remote-only files. `deploy_one.sh desktop.css content.js` (for example) uploads only those paths and does **not** regenerate either manifest.

The FTP username is intentionally present in the scripts; do not store a password or other secrets. Login uses verified TLS, but the host's directory listings and file data use unencrypted FTP data connections because its data-channel TLS negotiation fails. The 404 page uses root-relative asset paths and `.htaccess` maps `/404.html`, so deployment is expected at the domain document root (`/htdocs`). Remember that `.htaccess` is hidden in many GUI clients.

## Maintain this guide after every session

Before ending each work session, update this file with any durable, verified instruction, location, command, invariant, or pitfall that would have reduced investigation or token use during that session. Correct or replace stale guidance instead of appending a chronological log. Keep only reusable facts—no session diary, speculative notes, completed-task narration, or duplicated source code. If the implementation changes, update the affected "Current implementation," source-map, workflow, or recipe text in the same change.
