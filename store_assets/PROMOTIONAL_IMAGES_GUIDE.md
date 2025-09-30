# Promotional Images for Chrome Web Store

This guide covers the images needed for Chrome Web Store submission.

## Current Status

### ✅ Complete

#### Extension Icons
All required icon sizes are generated and ready:
- `assets/icons/icon16.png` (16×16px)
- `assets/icons/icon32.png` (32×32px)
- `assets/icons/icon48.png` (48×48px)
- `assets/icons/icon128.png` (128×128px)

#### Promotional Images
Store promotional images are created and ready:
- `promo-images/promo-440x280.png` - Small promotional tile (REQUIRED)
- `promo-images/promo-1400x560.png` - Marquee promotional tile (optional)

#### Source Files
HTML templates for regenerating images:
- `promo-images/promo-440x280.html`
- `promo-images/promo-1400x560.html`
- `promo-images/convert-to-png.sh` - Script to regenerate PNGs
- `promo-images/generate-icons.sh` - Script to regenerate icon PNGs

### 📸 TODO: Screenshots

You still need to create **1-5 screenshots** for the Chrome Web Store listing.

**Requirements:**
- Format: PNG or JPEG
- Dimensions: 1280×800px or 640×400px
- Minimum: 1 screenshot (required)
- Maximum: 5 screenshots
- File size: Max 1MB each

**Suggested Screenshots:**
1. **Search Builder** - Show the popup with various filters being used
2. **Saved Searches** - Display the saved searches tab with categories
3. **Sidebar Integration** - Show the sidebar on X.com with saved searches
4. **Search Applied** - Demonstrate a search being applied on X/Twitter
5. **Category Management** - Show the categories tab with color customization

**Save screenshots to:** `screenshots/` directory (already exists with some images)

## Image Specifications

### Required

| Image Type | Dimensions | Format | Max Size | Location |
|------------|-----------|--------|----------|----------|
| Extension Icons | 16×16, 32×32, 48×48, 128×128 | PNG | 1MB | `assets/icons/` ✅ |
| Small Promo Tile | 440×280 | PNG/JPEG | 1MB | `promo-images/` ✅ |
| Screenshots | 1280×800 or 640×400 | PNG/JPEG | 1MB each | `screenshots/` ⚠️ |

### Optional (But Recommended)

| Image Type | Dimensions | Format | Max Size | Location |
|------------|-----------|--------|----------|----------|
| Marquee Promo Tile | 1400×560 | PNG/JPEG | 1MB | `promo-images/` ✅ |

## Creating Screenshots

### Quick Method
1. Load extension in Chrome
2. Visit x.com
3. Take screenshots using:
   - **macOS**: Cmd+Shift+4 (select area)
   - **Windows**: Win+Shift+S (snipping tool)
   - **Chrome DevTools**: Toggle device toolbar, set custom dimensions

### Resize if Needed
If screenshots aren't exactly 1280×800 or 640×400:
- Use Preview (macOS) or Paint (Windows)
- Or online tool: [ResizeImage.net](https://resizeimage.net)

## Regenerating Promotional Images

If you need to update the promo images:

```bash
cd promo-images
./convert-to-png.sh
```

To regenerate extension icons:

```bash
cd promo-images
./generate-icons.sh
```

## Design Guidelines

### Promotional Images
- Use dark theme to match extension branding
- Include blue accent color (#3b82f6)
- Show the X Search Pro logo (blue X with white magnifying glass)
- Keep text minimal and readable
- Show actual UI elements

### Screenshots
- Capture real functionality
- Use clean test data (no personal info)
- Show the extension in action
- Ensure good contrast and readability
- Crop to exact dimensions

## Quality Checklist

Before submitting:
- [ ] All images are high resolution (no pixelation)
- [ ] Screenshots show actual functionality
- [ ] No personal information visible
- [ ] File sizes under 1MB each
- [ ] Dimensions are exactly as specified
- [ ] Images accurately represent the extension
- [ ] Professional quality and polish

## File Structure

```
x-search-pro/
├── assets/icons/          # Extension icons (✅ complete)
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── promo-images/          # Promotional tiles (✅ complete)
│   ├── promo-440x280.png
│   ├── promo-1400x560.png
│   ├── promo-440x280.html
│   ├── promo-1400x560.html
│   ├── convert-to-png.sh
│   └── generate-icons.sh
└── screenshots/           # Chrome Web Store screenshots (⚠️ TODO)
    └── (add 1-5 screenshots here)
```

## Resources

- [Chrome Web Store Image Requirements](https://developer.chrome.com/docs/webstore/images/)
- [Chrome Web Store Best Practices](https://developer.chrome.com/docs/webstore/best_practices/)

---

**Next Step:** Create 1-5 screenshots and save them to the `screenshots/` directory, then you're ready for Chrome Web Store submission!