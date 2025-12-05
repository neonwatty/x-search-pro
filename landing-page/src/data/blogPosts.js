export const blogPosts = [
  {
    slug: 'find-viral-content-x-search',
    title: 'How to Find Viral Content on X with Saved Searches',
    excerpt: 'Stop manually searching X every day. Learn how to build a personal library of searches that automatically find viral posts in your niche.',
    date: '2024-12-01',
    category: 'Guide',
    readTime: '5 min read',
    content: `
# How to Find Viral Content on X with Saved Searches

Finding viral content on X (Twitter) shouldn't require manually typing the same search queries every day. With X Search Pro, you can build a library of saved searches and access them instantly from a sidebar on x.com.

## The Problem with Manual Searching

Every time you want to find viral posts, you have to:
1. Remember the exact search syntax
2. Type out complex queries like \`AI min_faves:1000 since:2024-11-24\`
3. Manually update dates to see recent content
4. Repeat this process across multiple topics

It's tedious and easy to forget the right operators.

## Build Your Search Library

X Search Pro lets you save unlimited searches organized by category. Here's how to set up a viral content finder:

### Step 1: Create a Search

Open the extension and use the Search Builder to set:
- **Keywords**: Your topic (e.g., "AI", "startup", "marketing")
- **Minimum likes**: 1000+ for viral content
- **Date range**: Use a sliding window (more on this below)

### Step 2: Save and Categorize

Give your search a name like "Viral AI Posts" and assign it to a category. Color-code categories so you can quickly identify them.

### Step 3: Access from the Sidebar

On x.com, click the X Search Pro toggle to open the sidebar. All your saved searches appear here - one click applies them instantly.

## Example Searches to Save

**Tech News (viral)**
\`\`\`
(startup OR "series A" OR launch) min_faves:1000
\`\`\`

**AI Content**
\`\`\`
(AI OR "machine learning" OR LLM OR GPT) min_faves:2000
\`\`\`

**Marketing Insights**
\`\`\`
(marketing OR growth OR conversion) min_faves:500 filter:blue_verified
\`\`\`

## The Sidebar Advantage

Instead of opening the extension popup, use the sidebar that lives right on x.com:

- **Always accessible**: No popup switching needed
- **Quick apply**: One click runs any saved search
- **Collapsible**: Minimize to an icon when not in use
- **Synced**: Your searches sync across all your Chrome browsers

## Pro Tips

1. **Create engagement tiers**: Save the same search with different like thresholds (100+, 1000+, 10000+) to catch content at different viral stages

2. **Use categories strategically**: Group by workflow ("Daily Check", "Weekly Review") rather than just topic

3. **Combine with filters**: Add \`filter:images\` or \`filter:videos\` to find viral visual content

Stop wasting time typing the same searches. Build your library once, use it forever.
    `
  },
  {
    slug: 'sliding-window-searches',
    title: 'Sliding Window Searches: Auto-Updating Date Ranges',
    excerpt: 'The killer feature that keeps your saved searches fresh. Learn how sliding windows automatically update date ranges so you always see recent content.',
    date: '2024-11-28',
    category: 'Feature',
    readTime: '4 min read',
    content: `
# Sliding Window Searches: Auto-Updating Date Ranges

The biggest pain point with X search date filters? They're static. Save a search for "AI posts from the last week" and tomorrow it's already outdated.

X Search Pro's sliding window feature solves this completely.

## The Problem with Static Dates

A typical X search with dates looks like:
\`\`\`
AI min_faves:1000 since:2024-11-20 until:2024-11-27
\`\`\`

This works great... today. Tomorrow? The dates are wrong. Next week? Useless. You'd have to manually edit the dates every single time.

## How Sliding Windows Work

Instead of fixed dates, sliding windows calculate dates relative to *today*:

- **1 Day**: Always searches the last 24 hours
- **1 Week**: Always searches the last 7 days
- **1 Month**: Always searches the last 30 days

When you click a saved search with a sliding window, X Search Pro:
1. Gets today's date
2. Calculates the correct since/until dates
3. Builds the query with fresh dates
4. Applies it to X's search

You save it once. It stays current forever.

## Setting Up a Sliding Window Search

In X Search Pro's Search Builder:

1. Enter your keywords and filters
2. In the Date section, select "Sliding Window"
3. Choose your window: 1 Day, 1 Week, or 1 Month
4. Save your search

That's it. Every time you apply this search, dates update automatically.

## Best Use Cases

### Daily Monitoring (1 Day Window)
Perfect for:
- Breaking news in your industry
- Brand mentions
- Competitor activity
- Trending topics

### Weekly Review (1 Week Window)
Perfect for:
- Content inspiration
- Viral post roundups
- Industry trends
- Research gathering

### Monthly Analysis (1 Month Window)
Perfect for:
- Comprehensive topic coverage
- Trend analysis
- Research projects
- Market sentiment

## Combine with Engagement Filters

Sliding windows really shine when paired with engagement thresholds:

**"Show me viral AI posts from the past week"**
- Keywords: AI
- Min likes: 1000
- Sliding window: 1 Week

Every time you run this search, you get the latest viral AI content - no manual date updating required.

## Why This Matters

Without sliding windows, saved searches become stale. You either:
- Manually update dates (tedious)
- Forget and see old content (useless)
- Give up on saved searches entirely

Sliding windows make saved searches actually useful for daily workflows. Set them up once, benefit forever.
    `
  }
]

export function getBlogPost(slug) {
  return blogPosts.find(post => post.slug === slug)
}

export function getRecentPosts(count = 5) {
  return blogPosts.slice(0, count)
}
