import { Link } from 'react-router-dom'
import { blogPosts } from '../data/blogPosts'

function Blog() {
  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            X Search Pro Blog
          </h1>
          <p className="text-xl text-gray-600">
            Tips, tutorials, and strategies for mastering X/Twitter search
          </p>
        </div>

        <div className="space-y-8">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="bg-white border border-gray-100 rounded-xl p-6 hover:border-blue-100 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-4 mb-3">
                <span className="bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full">
                  {post.category}
                </span>
                <span className="text-gray-500 text-sm">{post.date}</span>
                <span className="text-gray-500 text-sm">{post.readTime}</span>
              </div>

              <Link to={`/blog/${post.slug}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-3 hover:text-blue-500 transition-colors">
                  {post.title}
                </h2>
              </Link>

              <p className="text-gray-600 mb-4">{post.excerpt}</p>

              <Link
                to={`/blog/${post.slug}`}
                className="text-blue-500 font-medium hover:text-blue-600 transition-colors inline-flex items-center"
              >
                Read more
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Blog
