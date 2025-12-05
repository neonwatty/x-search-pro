import { useParams, Link, Navigate } from 'react-router-dom'
import { getBlogPost, getRecentPosts } from '../data/blogPosts'

const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/x-search-pro/belfofaehpmgnifoddppdfgofflnkoja'

function BlogPost() {
  const { slug } = useParams()
  const post = getBlogPost(slug)
  const recentPosts = getRecentPosts(3).filter(p => p.slug !== slug)

  if (!post) {
    return <Navigate to="/blog" replace />
  }

  return (
    <div className="py-16">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/blog"
          className="text-blue-500 hover:text-blue-600 transition-colors inline-flex items-center mb-8"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Blog
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full">
              {post.category}
            </span>
            <span className="text-gray-500 text-sm">{post.date}</span>
            <span className="text-gray-500 text-sm">{post.readTime}</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
          <p className="text-xl text-gray-600">{post.excerpt}</p>
        </header>

        <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-blue-500 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100">
          <BlogContent content={post.content} />
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="bg-blue-50 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Search Smarter?
            </h3>
            <p className="text-gray-600 mb-6">
              Try X Search Pro free and build your personal search library.
            </p>
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
            >
              Install X Search Pro - Free
            </a>
          </div>
        </div>
      </article>

      {recentPosts.length > 0 && (
        <aside className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">More Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentPosts.slice(0, 2).map((relatedPost) => (
              <Link
                key={relatedPost.slug}
                to={`/blog/${relatedPost.slug}`}
                className="bg-white border border-gray-100 rounded-xl p-6 hover:border-blue-100 hover:shadow-lg transition-all"
              >
                <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                  {relatedPost.category}
                </span>
                <h3 className="text-lg font-semibold text-gray-900 mt-3 hover:text-blue-500 transition-colors">
                  {relatedPost.title}
                </h3>
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                  {relatedPost.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </aside>
      )}
    </div>
  )
}

function BlogContent({ content }) {
  const lines = content.trim().split('\n')
  const elements = []
  let currentCodeBlock = null
  let currentList = []

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-4">
          {currentList.map((item, i) => (
            <li key={i} className="text-gray-600">{item}</li>
          ))}
        </ul>
      )
      currentList = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('```')) {
      if (currentCodeBlock !== null) {
        flushList()
        elements.push(
          <pre key={`code-${elements.length}`} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
            <code>{currentCodeBlock}</code>
          </pre>
        )
        currentCodeBlock = null
      } else {
        flushList()
        currentCodeBlock = ''
      }
    } else if (currentCodeBlock !== null) {
      currentCodeBlock += (currentCodeBlock ? '\n' : '') + line
    } else if (line.startsWith('# ')) {
      flushList()
      elements.push(
        <h1 key={`h1-${i}`} className="text-3xl font-bold text-gray-900 mt-8 mb-4">
          {line.slice(2)}
        </h1>
      )
    } else if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={`h2-${i}`} className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={`h3-${i}`} className="text-xl font-semibold text-gray-900 mt-6 mb-3">
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      currentList.push(line.slice(2))
    } else if (line.match(/^\d+\. /)) {
      currentList.push(line.replace(/^\d+\. /, ''))
    } else if (line.startsWith('**') && line.endsWith('**')) {
      flushList()
      elements.push(
        <p key={`bold-${i}`} className="font-semibold text-gray-900 mt-4">
          {line.slice(2, -2)}
        </p>
      )
    } else if (line.trim() === '---') {
      flushList()
      elements.push(<hr key={`hr-${i}`} className="my-8 border-gray-200" />)
    } else if (line.trim()) {
      flushList()
      const formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')

      elements.push(
        <p
          key={`p-${i}`}
          className="text-gray-600 my-4"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      )
    }
  }

  flushList()

  return <>{elements}</>
}

export default BlogPost
