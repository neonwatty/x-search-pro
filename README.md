# X Search Pro

**Build your personal X/Twitter search library.**

A Chrome extension with smart saved searches that auto-update their time ranges. Save, organize, and color-code your advanced X searches—set it once, use it forever.

https://github.com/user-attachments/assets/f39d5ed9-b679-4ac4-bb32-52e11b721819


## Why X Search Pro?

**The Problem:** X.com has advanced search (`x.com/search-advanced`), but it has no memory. Every time you need to monitor brand mentions, track competitors, or find viral content, you rebuild the same complex query from scratch.

**The Solution:** X Search Pro solves this with **smart saved searches** that automatically update their time ranges—set it once, use it forever. Build and organize your personal search library with categories, colors, and quick filters.

| Feature | X.com Advanced Search | X Search Pro |
|---------|----------------------|--------------|
| Build complex queries | ✅ | ✅ |
| **Save searches** | ❌ | ✅ Unlimited |
| **Auto-updating time ranges** | ❌ | ✅ Sliding windows |
| **Categorize** | ❌ | ✅ Custom categories |
| **Color coding** | ❌ | ✅ Visual organization |
| **Quick access** | ❌ Navigate to `/search-advanced` | ✅ Sidebar + popup |
| **Templates** | ❌ | ✅ 10 pre-loaded |
| **Filter your library** | ❌ | ✅ Instant search |
| **Search counts** | ❌ | ✅ Per category |

**Bottom line:** X.com's advanced search is a tool you use once. X Search Pro is a library you build over time.

## Features

### 💾 Build Your Search Library

#### 📚 **Save**
- Save unlimited custom searches with descriptive names
- 10 pre-loaded templates to start from (Viral Content, Video Posts, Questions, etc.)
- Never rebuild the same query twice

#### 🏷️ **Categorize**
- Organize searches by topic, project, or purpose
- Create custom categories (e.g., "Brand Monitoring", "Competitors", "Research")
- Filter your library by category

#### 🎨 **Color Code**
- Assign custom colors to each category
- Visual scanning for instant recognition
- Make your library intuitive and organized

#### 🗂️ **Organize**
- Quick filter: search your saved queries by name, content, or category
- Track search counts per category
- Edit saved searches without starting over
- Delete outdated searches

### 🔍 Advanced Search Builder
- **Engagement Filters**: Set minimum likes, retweets, and replies
- **Smart Time Ranges**: Use sliding windows (last 24 hours, last week, last month) that auto-update, or set fixed dates
- **User Filters**: Search from specific users, mentions, verified accounts, or your network
- **Content Type**: Filter by media (images, videos), links, replies, retweets, or quotes
- **Language Support**: Search in specific languages
- **Real-time Preview**: See your generated query as you build it

### 🎨 Seamless Integration
- **Popup Interface**: Full-featured search builder and library accessible via extension icon
- **Sidebar on X.com**: Quick access to your entire search library with a floating toggle button
- **One-Click Apply**: Instantly apply any saved search to X/Twitter's search box
- **Always Available**: Access your library from anywhere on X.com

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
   - Find "X Search Pro" and click the pin icon

## Usage

### Building Your Search Library

1. **Create your first search:**
   - Click the X Search Pro extension icon
   - Switch to "Search Builder" tab
   - Fill in your criteria (keywords, engagement, dates, content type)
   - Watch the query preview update in real-time
   - Click "Save Search" and give it a name

2. **Organize your library:**
   - Create categories (e.g., "Brand Monitoring", "Competitors")
   - Assign colors to categories for visual recognition
   - Add more searches as your needs grow

3. **Start with templates:**
   - Switch to "Saved Searches" tab
   - Explore 10 pre-loaded templates
   - Use them as-is or customize and save your own versions

### Using Your Search Library

**From X.com Sidebar (Recommended):**
1. Visit x.com or twitter.com
2. Click the blue toggle button on the right edge of the screen
3. Browse your organized library in the sidebar
4. Click any search to apply it instantly

**From Popup:**
1. Click the extension icon
2. Switch to "Saved Searches" tab
3. Filter by category or search by name
4. Click any saved search to apply it

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

### Managing Your Library

- **Edit**: Click the pencil icon on any saved search to modify criteria without rebuilding
- **Delete**: Click the trash icon to remove outdated searches
- **Filter**: Use the search box to instantly find searches by name, query, or category
- **Categorize**: Assign searches to categories and apply custom colors
- **View Counts**: See how many searches are in each category

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
x-search-pro/
├── manifest.json           # Extension configuration
├── popup/                  # Extension popup UI
├── content/                # Content scripts for X.com
├── background/             # Service worker
├── lib/                    # Shared utilities (query-builder, storage, templates)
├── assets/                 # Icons and images
└── tests/                  # Playwright E2E and unit tests
```

## Technical Details

- **Manifest Version**: V3 (latest Chrome extension standard)
- **Permissions**: `storage`, `activeTab`
- **Host Permissions**: `x.com`, `twitter.com`
- **Storage**: Chrome Storage API (local storage)
- **Framework**: Vanilla JavaScript (no dependencies)

## Development

### Local Testing

1. Make code changes
2. Reload extension at `chrome://extensions/`
3. Test on x.com or twitter.com

### Testing & Quality

```bash
npm install              # Install dependencies
npm run test:install     # Install Playwright browsers (first time only)

# Run tests
npm test                 # Unit tests only (fast)
npm run test:e2e         # Full E2E tests with X.com integration
npm run test:e2e:headed  # E2E tests with browser UI visible

# Code quality
npm run lint             # ESLint
npm run typecheck        # TypeScript validation
```

**Test Requirements:**
- Node.js 18+
- Create `.env` file with X.com test credentials (see `tests/README.md`)
- E2E tests require Chrome/Chromium and internet connection

For detailed testing documentation, see [`tests/README.md`](tests/README.md).

### Pre-Push Hook

This project uses **Husky** to enforce code quality before pushing to remote:

**What runs automatically on `git push`:**
1. 🔍 **ESLint** - Code linting
2. 📝 **TypeScript** - Type checking
3. 🧪 **Unit Tests** - 97 unit tests
4. 🎭 **E2E Tests** - Full workflow tests on real X.com

**Total time:** ~2-3 minutes

**To bypass** (emergency only): `git push --no-verify`

The hook ensures all code pushed to remote is tested and working. Configure your test credentials in `.env` before your first push.

### Debugging

- **Popup**: Right-click extension icon → Inspect popup
- **Content Script**: Open DevTools on x.com (F12) → Check console
- **Service Worker**: `chrome://extensions/` → Click "service worker" link
- **Tests**: `npm run test:e2e:debug` for Playwright inspector

## Privacy

- All data stored locally in your browser
- No external servers or analytics
- No data collection or tracking
- Your search library never leaves your device

## Support

For issues, feature requests, or questions, please open an issue in the repository.

## License

MIT License - See LICENSE file for details

---

**Stop rebuilding. Start organizing. Build your X search library today.** 🚀
