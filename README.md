# X Search Tabs

A Chrome extension that simplifies X/Twitter's advanced search with an intuitive UI for creating, saving, and managing complex search queries without memorizing cryptic syntax.

## Features

### 🔍 Advanced Search Builder
- **Engagement Filters**: Set minimum likes, retweets, and replies
- **Date Range**: Search by specific dates or use quick presets (today, last week, last month)
- **User Filters**: Search from specific users, mentions, verified accounts, or your network
- **Content Type**: Filter by media (images, videos), links, replies, retweets, or quotes
- **Language Support**: Search in specific languages
- **Real-time Preview**: See your generated query as you build it

### 💾 Save & Manage Searches
- Save unlimited custom searches with names and categories
- 10 pre-loaded templates for common searches (Viral Content, Recent & Popular, Video Content, etc.)
- Color-coded categories for easy organization
- Usage analytics (track how often you use each search)
- Import/Export functionality for sharing searches
- Quick filter to find saved searches

### 🎨 Seamless Integration
- **Popup Interface**: Full-featured search builder accessible via extension icon
- **Sidebar on X.com**: Quick access to saved searches with a floating toggle button
- **One-Click Apply**: Instantly apply any saved search to X/Twitter's search box
- Cross-device sync via Chrome Storage Sync

## Installation

### Install from Source (Developer Mode)

1. **Clone or download this repository**
   ```bash
   cd ~/Desktop
   git clone <repository-url> x-search-tabs
   cd x-search-tabs
   ```

2. **Open Chrome Extensions page**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)

3. **Load the extension**
   - Click "Load unpacked"
   - Select the `x-search-tabs` folder
   - The extension icon should appear in your toolbar

4. **Pin the extension** (optional)
   - Click the puzzle piece icon in Chrome toolbar
   - Find "X Search Tabs" and click the pin icon

## Usage

### Creating a Search

1. Click the X Search Tabs extension icon
2. Switch to "Search Builder" tab
3. Fill in your desired criteria:
   - Enter keywords
   - Set engagement thresholds (min likes, retweets, replies)
   - Choose date ranges
   - Select content filters
4. Watch the query preview update in real-time
5. Click "Apply Search" to search immediately, or "Save Search" to save for later

### Using Saved Searches

**From Popup:**
1. Click the extension icon
2. Switch to "Saved Searches" tab
3. Click any saved search to apply it

**From X.com Sidebar:**
1. Visit x.com or twitter.com
2. Click the blue toggle button on the right edge of the screen
3. Browse your saved searches in the sidebar
4. Click any search to apply it instantly

### Pre-loaded Templates

The extension comes with 10 ready-to-use templates:
- **Viral Content** - Posts with 100+ likes and 50+ retweets
- **Recent & Popular** - Posts from last month with 10+ likes
- **Video Content** - Video posts with 20+ likes
- **Questions Only** - Posts containing questions
- **News Articles** - Posts with links
- **Your Network** - Posts from people you follow (no retweets)
- **Verified Only** - Posts from verified accounts
- **Image Posts** - Posts with images
- **Trending Today** - Today's highly engaged posts
- **Quote Tweets** - Quote tweets with 5+ likes

### Managing Searches

- **Edit**: Click the pencil icon on any saved search to modify it
- **Delete**: Click the trash icon to remove a search
- **Filter**: Use the search box in "Saved Searches" tab to filter by name, query, or category
- **Export**: Click "Export" to download all searches as JSON
- **Import**: Click "Import" to load searches from a JSON file

## Search Operators Supported

### Engagement
- `min_faves:N` - Minimum likes
- `min_retweets:N` - Minimum retweets
- `min_replies:N` - Minimum replies

### Date/Time
- `since:YYYY-MM-DD` - After date
- `until:YYYY-MM-DD` - Before date

### Users
- `from:username` - Posts from user
- `to:username` - Replies to user
- `@username` - Mentions of user
- `filter:verified` - Verified accounts
- `filter:blue_verified` - Blue verified
- `filter:follows` - From people you follow

### Content Type
- `filter:media` - Has media
- `filter:images` - Has images
- `filter:videos` - Has videos
- `filter:links` - Has links
- `filter:replies` / `-filter:replies` - Include/exclude replies
- `filter:retweets` / `-filter:retweets` - Include/exclude retweets
- `filter:quote` - Quote tweets only

### Language
- `lang:XX` - Language code (en, es, fr, de, etc.)

## Project Structure

```
x-search-tabs/
├── manifest.json              # Extension configuration
├── popup/
│   ├── popup.html            # Popup interface
│   ├── popup.css             # Popup styles
│   └── popup.js              # Popup logic
├── content/
│   ├── content.js            # Content script for X.com
│   └── sidebar.css           # Sidebar styles
├── background/
│   └── service-worker.js     # Background service worker
├── lib/
│   ├── storage.js            # Chrome Storage wrapper
│   ├── query-builder.js      # Query building logic
│   └── templates.js          # Default search templates
├── assets/
│   └── icons/                # Extension icons
└── plans/
    └── extension-plan.md     # Detailed planning document
```

## Technical Details

- **Manifest Version**: V3 (latest Chrome extension standard)
- **Permissions**: `storage`, `activeTab`
- **Host Permissions**: `x.com`, `twitter.com`
- **Storage**: Chrome Storage Sync API (syncs across devices)
- **Framework**: Vanilla JavaScript (no dependencies)

## Development

### Testing Locally

1. Make changes to source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the X Search Tabs card
4. Test on x.com or twitter.com

### Debugging

- **Popup**: Right-click extension icon → Inspect popup
- **Content Script**: Open DevTools on x.com (F12) → Check console
- **Service Worker**: Go to `chrome://extensions/` → Click "service worker" link under extension

## Privacy

- All data stored locally via Chrome Storage Sync
- No external servers or analytics
- No data collection or tracking
- Searches sync across your Chrome browsers when signed in

## Support

For issues, feature requests, or questions, please open an issue in the repository.

## License

MIT License - See LICENSE file for details

---

**Enjoy powerful X/Twitter searches made simple!** 🚀