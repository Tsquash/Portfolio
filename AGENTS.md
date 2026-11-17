# Portfolio agent guide

Read this first. This is the durable operating guide for agents working on the portfolio; keep it concise and current.

## Current implementation

- Dependency-free static site in `site/`; no package manager, framework, build step, or automated test suite.
- Classic monochrome Macintosh desktop UI. It boots on a visitor's first load in a browser session, then restores open windows, positions, sizes, view mode, and photo state from `sessionStorage`.
- Desktop and menu items expose Projects, Welcome/About, Resume, GitHub, LinkedIn, Media, Instagram, and Spotify.
- Current content is one Air Quality Monitor project, six generated photo albums (51 images), and two native-video-player windows (`Monadnock.mp4` and `Dandelion.mp4`).
- Mouse users select with one click and open with two; touch and keyboard activation open with one action.
- At widths up to 700 px, windows use the compact/mobile layout and only the active window is normally visible.
- Hosting target is Byet at `http://caleblightfoot.byethost13.com`; deployment copies `site/` to `/htdocs`.

## Source map

| Path | Source of truth for |
| --- | --- |
| `site/content.js` | Name, bio, portrait, social URLs, videos, projects, project parts/tags |
| `site/desktop.js` | Window definitions/renderers, desktop icons, interactions, startup, persistence, responsive behavior |
| `site/desktop.css` | All site styling; mobile breakpoint is `700px` |
| `site/index.html` | Page metadata, script order, menu markup, desktop/window shell |
| `site/assets/Photos/<album>/` | Album images; each immediate subdirectory is an album |
| `site/photo-albums.js` | Generated album manifest; never hand-edit |
| `tools/generate_photo_albums.py` | Manifest generator and supported image extensions |
| `site/assets/resume.pdf` | Resume shown in the Resume window |
| `site/assets/icons/` | Finder/social/window icons |
| `site/assets/fonts/ChicagoFLF.woff2` | Self-hosted UI font |
| `site/404.html`, `site/.htaccess` | Domain-root custom 404 page and Apache mapping |
| `tools/dither.html` | Standalone in-browser image dithering utility; not loaded by the portfolio |
| `deploy.sh` | Regenerate albums, then mirror the full site to `/htdocs` |
| `deploy_one.sh` | Upload named files only; arguments are paths relative to `site/` |

Script load order matters: `photo-albums.js` defines `window.portfolioPhotoAlbums`, `content.js` assigns it to `window.portfolioContent.albums`, and `desktop.js` renders that content.

## Common updates

### Text, links, videos, and projects

Edit `site/content.js`. A project needs a unique slug-like `id`, visitor-facing `name` and `summary`, a `parts` array (`name`, `detail`, `url`), and a `tags` array. Project folder/window definitions are created automatically from this array.

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

## Efficient workflow

1. Run `git status --short`; preserve unrelated and pre-existing user changes.
2. Read this file, then only the source-map entries relevant to the task. Do not scan binary photo/video assets unless the task requires visual inspection.
3. Edit source files, not generated output. Regenerate `site/photo-albums.js` only when album contents change.
4. Preview from the repository root with `python3 -m http.server 8000 --directory site`, then visit `http://localhost:8000/`. A direct `site/index.html` open also works for most UI checks, but an HTTP preview better matches hosting.
5. Run proportionate checks before handoff:
   - `python3 tools/generate_photo_albums.py` after photo changes.
   - `node --check site/content.js && node --check site/desktop.js` after JavaScript changes, when Node is available.
   - Check desktop and narrow/mobile layouts, mouse/touch-equivalent opening, keyboard activation, window close/zoom/drag, media navigation, external links, and state restoration when affected.
   - Test the custom 404 on Apache/Byet; Python's simple server does not apply `.htaccess`.
6. Report what changed and what was actually verified. Do not claim browser or deployment verification unless performed.

## Deployment guardrails

Deploy only when the user explicitly asks. `deploy.sh` requires `lftp`, prompts for the FTP password, regenerates albums, uploads changed/new files, and does not delete remote-only files. `deploy_one.sh desktop.css content.js` (for example) uploads only those paths and does **not** regenerate the album manifest.

The FTP username is intentionally present in the scripts; do not store a password or other secrets. Login uses verified TLS, but the host's directory listings and file data use unencrypted FTP data connections because its data-channel TLS negotiation fails. The 404 page uses root-relative asset paths and `.htaccess` maps `/404.html`, so deployment is expected at the domain document root (`/htdocs`). Remember that `.htaccess` is hidden in many GUI clients.

## Maintain this guide after every session

Before ending each work session, update `portfolio_agent.md` with any durable, verified instruction, location, command, invariant, or pitfall that would have reduced investigation or token use during that session. Correct or replace stale guidance instead of appending a chronological log. Keep only reusable facts—no session diary, speculative notes, completed-task narration, or duplicated source code. If the implementation changes, update the affected "Current implementation," source-map, workflow, or recipe text in the same change.
