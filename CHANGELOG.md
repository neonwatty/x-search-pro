# Changelog

All notable changes to X Search Pro will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-09-29

### Added
- Advanced search builder with real-time query preview
- Engagement filters (min likes, retweets, replies)
- Date range filters with quick presets (today, last week, last month)
- User filters (from, to, mentions, verified, follows)
- Content type filters (media, images, videos, links, replies, retweets, quotes)
- Language support with 12 common languages
- Save unlimited custom searches with names and categories
- 10 pre-loaded search templates
- Color-coded category system for organizing searches
- Category management (create, rename, delete, assign colors)
- Popup interface with tabbed navigation (Builder, Saved, Categories, Settings, About)
- Sidebar on X.com for quick access to saved searches
- Floating toggle button for sidebar visibility
- Usage analytics (track search usage count and last used time)
- Search filtering in Saved Searches tab
- Chrome Storage Sync for cross-device synchronization
- Settings tab with sidebar visibility toggle
- About tab with social links and project information

### Technical
- Manifest V3 compliance
- Vanilla JavaScript (no external dependencies)
- Comprehensive unit tests with Playwright
- E2E workflow tests
- Pre-commit hooks with linting and type checking
- ESLint and TypeScript configuration

### Fixed
- Category deletion now properly updates search colors to Uncategorized
- Custom colors are preserved when category is deleted
- Tab sizing optimized for better visibility (popup width increased to 500px)
- Tab labels shortened for better fit ("Builder", "Saved" vs "Search Builder", "Saved Searches")

[0.1.0]: https://github.com/neonwatty/x-search-tabs/releases/tag/v0.1.0