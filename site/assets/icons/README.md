# Macintosh icons for the portfolio

Copy the five icon PNGs into `site/assets/icons/`. The separate `preview.png` shows how the icons look enlarged.

| PNG | Suggested use | Original artwork |
|---|---|---|
| `menu-happy-mac.png` | Menu button at 32 × 32 | Macintosh Plus ROM startup icon |
| `menu-profile.png` | Alternate menu button at 16 × 16 | System 7.5 File Sharing small icon, `ics#` 258 |
| `linkedin.png` | LinkedIn shortcut at 32 × 32 | System 7.5 Users & Groups, `ICN#` 128 |
| `spotify.png` | Spotify shortcut at 32 × 32 | System 7.5 Audio CD Access, `ICN#` 128 |
| `instagram.png` | Instagram shortcut at 32 × 32 | System 7.5 Apple Photo Access, `ICN#` 129 |

## Menu button

In `site/index.html`, find the `<img>` inside `<summary aria-label="Portfolio menu">`. Set it to:

```html
<img src="assets/icons/menu-happy-mac.png" width="32" height="32" alt="">
```

To use the profile icon instead, change the filename to `menu-profile.png` and use `width="16" height="16"` for native size. The menu CSS already sets `image-rendering: pixelated`.

## Desktop shortcuts

In `site/desktop.js`, the second argument to `item()` sets the PNG basename. Use `'linkedin'`, `'spotify'`, or `'instagram'` and follow the GitHub shortcut's pattern for the click action. Keep the shortcut labels visible so visitors can tell where each one opens.

## Sources

The icons come from Infinite Mac's [Macintosh Plus ROM](https://github.com/mihaip/infinite-mac/blob/785d68857abd2dd47d26edf2ea1938891b9e2a1a/src/Data/Mac-Plus.rom) and [System 7.5 disk image](https://github.com/mihaip/infinite-mac/blob/785d68857abd2dd47d26edf2ea1938891b9e2a1a/Images/System%207.5%20HD.dsk). The System 7.5 PNGs preserve the resource bitmaps and transparency masks. Happy Mac preserves the ROM artwork with transparency added to the outer white background.
