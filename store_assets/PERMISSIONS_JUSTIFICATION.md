# Chrome Web Store - Permissions Justification

## Extension: X Search Pro
**Single Purpose**: Simplify X/Twitter advanced search by providing an intuitive UI for creating, saving, and managing complex search queries without memorizing cryptic syntax.

## Required Permissions Justification

### 1. `storage` Permission
**Why it's needed**:
- Save user's custom search queries locally
- Store search templates and categories
- Maintain user preferences and settings
- Track local usage statistics for saved searches
- Enable Chrome sync to access saved searches across devices

**User benefit**: Users can save unlimited custom searches, organize them with categories, and access them across all their Chrome browsers when signed in.

### 2. `activeTab` Permission
**Why it's needed**:
- Inject the search query into the X/Twitter search box when user clicks a saved search
- Display the sidebar interface on X.com/Twitter.com pages
- Detect when user is on X/Twitter to enable relevant features

**User benefit**: One-click application of complex search queries directly on X/Twitter without manual copying and pasting.

### 3. Host Permissions (`*://x.com/*`, `*://twitter.com/*`)
**Why these specific hosts**:
- **x.com**: The current domain for X (formerly Twitter)
- **twitter.com**: The legacy domain that still redirects to X.com

**Why it's needed**:
- Inject the sidebar UI component only on X/Twitter pages
- Apply saved searches by programmatically updating the search input field
- Ensure the extension works on both the new (x.com) and legacy (twitter.com) domains

**User benefit**: Seamless integration with X/Twitter's interface, providing a native-feeling experience with the sidebar and instant search application.

## Minimal Permission Approach

We follow Chrome's principle of least privilege:
- ✅ We only request permissions essential for core functionality
- ✅ We don't request broad permissions like `<all_urls>` or `tabs`
- ✅ We limit host permissions to only X/Twitter domains
- ✅ We use `activeTab` instead of broader tab permissions
- ✅ No permissions for accessing user's browsing history
- ✅ No permissions for modifying other websites

## Data Handling Compliance

Our extension complies with Chrome Web Store's User Data Policy:
- All data is stored locally using Chrome Storage Sync API
- No data is transmitted to external servers
- No analytics or tracking services are used
- User has full control to view, edit, and delete their data
- Clear privacy policy provided to users

## Single Purpose Compliance

The extension maintains a single, narrow focus:
- **Single Purpose**: Enhanced search interface for X/Twitter
- All features directly support this single purpose:
  - Building search queries (core purpose)
  - Saving searches for reuse (supports core purpose)
  - Organizing saved searches (supports core purpose)
  - Applying searches with one click (supports core purpose)

No unrelated features or hidden functionality are included.

## Security Considerations

- No remote code execution
- No external JavaScript libraries loaded at runtime
- All code is bundled with the extension package
- No communication with external servers
- No collection of personally identifiable information

---

**Last Updated**: September 28, 2025
**Extension Version**: 0.1.0