# X/Twitter Search Enhancement Chrome Extension - Detailed Plan

## Extension Overview
A Chrome extension that simplifies X/Twitter's advanced search operators through an intuitive UI, allowing users to create, save, and quickly access complex search queries without memorizing cryptic syntax.

---

## Core Features to Implement

### 1. **Search Operator Categories to Support**

#### Engagement Filters (Most Popular)
- `min_faves:X` - Minimum likes
- `min_retweets:X` - Minimum retweets
- `min_replies:X` - Minimum replies
- `-min_faves:X` / `-min_retweets:X` / `-min_replies:X` - Maximum thresholds

#### Date/Time Filters
- `since:YYYY-MM-DD` - After date
- `until:YYYY-MM-DD` - Before date
- Date range presets (Last 24h, Last week, Last month, Last year, Custom)

#### User Filters
- `from:username` - Posts from user
- `to:username` - Replies to user
- `@username` - Mentions of user
- `filter:verified` - Verified accounts only
- `filter:blue_verified` - Blue checkmark accounts
- `filter:follows` - From people you follow

#### Content Type Filters
- `filter:media` - Has images/videos
- `filter:images` - Has images
- `filter:videos` - Has videos
- `filter:links` - Contains links
- `filter:replies` / `-filter:replies` - Include/exclude replies
- `filter:retweets` / `-filter:retweets` - Include/exclude retweets
- `filter:quote` - Quote tweets only

#### Location Filters
- `near:location within:Xmi/km` - Geographic search
- `geocode:lat,long,radius` - Precise location

#### Language Filter
- `lang:XX` - Language code (en, es, fr, etc.)

---

## 2. **UI/UX Design**

### Main Interface Components

**A. Extension Popup (400x600px)**
- Quick search builder with collapsible sections
- Saved searches list with preview
- "Apply to Current Tab" button
- Import/Export saved searches

**B. Sidebar Overlay (Injected on x.com)**
- Floating button on search pages (toggleable)
- Slide-out panel with quick filters
- Live preview of generated query
- One-click apply to search box

**C. Search Builder Form**
- Grouped by category (Engagement, Date, User, Content, Location, Language)
- Smart inputs:
  - Number sliders for engagement thresholds
  - Date pickers for time ranges
  - Username autocomplete
  - Checkbox toggles for filters
- Real-time query preview at bottom
- "Save Search" and "Apply Now" buttons

---

## 3. **Saved Search System**

### Storage Strategy
- **Chrome Storage API (sync)** - Syncs across devices
- **Data Structure:**
```json
{
  "savedSearches": [
    {
      "id": "uuid",
      "name": "Viral Claude Code Posts",
      "query": "\"claude code\" min_faves:10 min_retweets:5",
      "filters": {
        "keywords": "claude code",
        "minFaves": 10,
        "minRetweets": 5
      },
      "category": "Tech",
      "color": "#3b82f6",
      "createdAt": "2025-09-27",
      "useCount": 0,
      "lastUsed": null
    }
  ],
  "categories": ["Tech", "News", "Personal", "Research"],
  "settings": {
    "showSidebar": true,
    "defaultView": "grid",
    "theme": "auto"
  }
}
```

### Saved Search Features
- Name, description, and color coding
- Custom categories/tags
- Usage analytics (count, last used)
- Quick edit/duplicate/delete
- Drag-and-drop reordering
- Export as JSON for sharing

---

## 4. **Pre-loaded Search Templates**

### Default Templates to Include
1. **Viral Content** - `min_faves:100 min_retweets:50 -filter:replies`
2. **Recent & Popular** - `since:2025-09-01 min_faves:10`
3. **Video Content** - `filter:native_video min_faves:20`
4. **Questions Only** - `? -filter:replies`
5. **News Articles** - `filter:links filter:news`
6. **Your Network** - `filter:follows -filter:retweets`
7. **Verified Only** - `filter:verified min_faves:5`
8. **Local Tweets** - `near:me within:10mi`

---

## 5. **Technical Architecture**

### File Structure
```
x-search-tabs/
├── manifest.json (Manifest V3)
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── content/
│   ├── content.js (Inject sidebar, detect search page)
│   └── sidebar.css
├── background/
│   └── service-worker.js
├── lib/
│   ├── storage.js (Chrome Storage wrapper)
│   ├── query-builder.js (Operator logic)
│   └── templates.js (Default searches)
├── assets/
│   └── icons/ (16, 32, 48, 128px)
└── styles/
    └── shared.css
```

### Key Technologies
- **Manifest V3** for modern Chrome extension
- **Content Scripts** to inject UI on x.com/twitter.com
- **Service Worker** for background tasks
- **Chrome Storage Sync API** for cross-device syncing
- **Vanilla JS** (no framework needed for simplicity)
- **CSS Grid/Flexbox** for responsive layout

### Permissions Required
```json
{
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["*://x.com/*", "*://twitter.com/*"]
}
```

---

## 6. **User Workflows**

### Workflow 1: Create & Save Search
1. Click extension icon → popup opens
2. Fill out search builder form (e.g., min_faves: 50, filter: videos)
3. Preview generated query in real-time
4. Click "Save Search" → name it "Viral Videos"
5. Click "Apply Now" → query inserted into X search box

### Workflow 2: Quick Apply Saved Search
1. On x.com/search page, sidebar button appears
2. Click sidebar → saved searches list displays
3. Click "Viral Videos" → query auto-fills and searches

### Workflow 3: Edit/Manage Searches
1. Open popup → "Manage Searches" tab
2. Grid view of all saved searches
3. Click edit icon → modify filters → save changes
4. View usage stats (used 47 times, last used: today)

---

## 7. **Advanced Features (Phase 2)**

- **Search Chains:** Combine multiple saved searches with OR logic
- **Quick Filters Toolbar:** Small filter chips that appear above search box
- **Keyboard Shortcuts:** `Alt+S` to open sidebar, `Alt+1-9` for quick searches
- **Search History:** Track recent manual searches
- **Share Searches:** Generate shareable links for saved queries
- **Dark Mode:** Auto-detect X theme or manual toggle

---

## 8. **Implementation Phases**

### Phase 1 (MVP)
- Basic popup with search builder
- Support for engagement, date, and content filters
- Save/load searches (local storage)
- Content script to inject query into search box

### Phase 2
- Sidebar injection on x.com
- Pre-loaded templates
- Chrome Storage Sync for cross-device
- Categories and color coding

### Phase 3
- Usage analytics
- Import/export functionality
- Advanced location/language filters
- Polish UI/UX with animations

---

## 9. **Testing Strategy**

- Test on both x.com and twitter.com domains
- Verify operator syntax with X's official docs
- Test edge cases (special characters, long queries)
- Cross-browser testing (Chrome, Edge, Brave)
- Storage quota limits (Chrome Sync: 100KB limit)

---

Ready to build this extension with a modern, user-friendly interface that makes X/Twitter power search accessible to everyone!