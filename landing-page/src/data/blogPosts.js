export const blogPosts = [
  {
    slug: 'twitter-advanced-search-guide',
    title: 'How to Use Twitter Advanced Search: Complete Guide to Search Operators',
    excerpt: 'Master Twitter advanced search with this complete guide. Learn search operators, date filters, and how to find old tweets without memorizing complex syntax.',
    date: '2024-12-01',
    category: 'Guide',
    readTime: '5 min read',
    content: `
# How to Use Twitter Advanced Search: Complete Guide to Search Operators

Twitter advanced search is powerful but hard to use. You need to memorize operators like \`min_faves:1000\` or \`since:2024-01-01\` just to filter results. This guide shows you how to use Twitter search operators - and an easier way with X Search Pro.

## What is Twitter Advanced Search?

Twitter advanced search lets you filter tweets by:
- **Date range** (since/until operators)
- **Engagement** (minimum likes, retweets, replies)
- **User** (from:, to:, @mentions)
- **Content type** (images, videos, links)
- **Language and location**

The problem? You have to type these operators manually every time.

## Essential Twitter Search Operators

### Search by Date
\`\`\`
since:2024-01-01 until:2024-12-01
\`\`\`

### Find Tweets with Minimum Likes
\`\`\`
min_faves:1000
\`\`\`

### Search from a Specific User
\`\`\`
from:username
\`\`\`

### Filter by Media Type
\`\`\`
filter:images
filter:videos
filter:links
\`\`\`

### Exclude Replies
\`\`\`
-filter:replies
\`\`\`

## Combining Operators

The real power comes from combining these:

**Find viral AI posts from the last week:**
\`\`\`
AI min_faves:1000 since:2024-11-24 -filter:replies
\`\`\`

**Find images from a specific user:**
\`\`\`
from:username filter:images
\`\`\`

## The Problem with Manual Advanced Search

Every time you want to run an advanced search, you have to:
1. Remember the exact operator syntax
2. Type it out correctly
3. Update the dates manually (they go stale)
4. Repeat for every search

## A Better Way: X Search Pro

X Search Pro is a Chrome extension that makes Twitter advanced search easy:

1. **Visual Query Builder** - Select filters from dropdowns instead of memorizing syntax
2. **Save Searches** - Store your searches and run them with one click
3. **Sliding Windows** - Date ranges auto-update so searches stay fresh
4. **Sidebar Access** - Run searches directly from X.com without opening popups

Stop memorizing search operators. Build your query visually and save it forever.
    `
  },
  {
    slug: 'search-twitter-by-date-find-old-tweets',
    title: 'How to Search Twitter by Date and Find Old Tweets',
    excerpt: 'Learn how to search Twitter by date, find tweets from specific dates, and locate old tweets. Plus: auto-updating date filters that never go stale.',
    date: '2024-11-28',
    category: 'Tutorial',
    readTime: '4 min read',
    content: `
# How to Search Twitter by Date and Find Old Tweets

Need to find tweets from a specific date? Want to search old tweets from months ago? Twitter's date search is powerful but the syntax is clunky - and the dates go stale immediately.

## How to Search Twitter by Date

Twitter uses \`since:\` and \`until:\` operators:

\`\`\`
your search terms since:2024-01-01 until:2024-01-31
\`\`\`

This finds tweets from January 2024. But tomorrow, this search is already outdated.

## Find Tweets from a Specific Date

To find tweets from a single day:
\`\`\`
topic since:2024-06-15 until:2024-06-16
\`\`\`

## Search Old Tweets by User

Combine date filters with user filters:
\`\`\`
from:username since:2023-01-01 until:2023-12-31
\`\`\`

This finds all tweets from a user in 2023.

## The Problem: Static Dates Go Stale

When you save a search like "AI posts from the last week":
\`\`\`
AI since:2024-11-20 until:2024-11-27
\`\`\`

Tomorrow? The dates are wrong. Next week? Completely useless.

You'd have to manually edit the dates every single time you run the search.

## The Solution: Sliding Window Searches

X Search Pro introduces **sliding windows** - date ranges that auto-update relative to today:

- **1 Day Window**: Always searches the last 24 hours
- **1 Week Window**: Always searches the last 7 days
- **1 Month Window**: Always searches the last 30 days

When you click a saved search, X Search Pro:
1. Gets today's date
2. Calculates fresh since/until dates
3. Runs the search with current dates

**Save it once. Dates stay fresh forever.**

## Best Use Cases for Date Searches

### Find Breaking News (1 Day)
Search your topic with a 1-day sliding window to always see the latest.

### Weekly Content Research (1 Week)
Find viral posts from the past week for content inspiration.

### Track Trends Over Time (1 Month)
Monitor how conversations evolve with a 30-day window.

## How to Set Up Auto-Updating Date Searches

With X Search Pro:

1. Open the Search Builder
2. Enter your keywords and filters
3. Select "Sliding Window" for the date option
4. Choose 1 Day, 1 Week, or 1 Month
5. Save your search

Access it anytime from the sidebar on X.com. Dates update automatically every time you run it.

Stop manually editing date filters. Let your searches stay fresh on their own.
    `
  }
]

export function getBlogPost(slug) {
  return blogPosts.find(post => post.slug === slug)
}

export function getRecentPosts(count = 5) {
  return blogPosts.slice(0, count)
}
