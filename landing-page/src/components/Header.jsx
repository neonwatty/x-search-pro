import { Link } from 'react-router-dom'

const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/x-search-pro/belfofaehpmgnifoddppdfgofflnkoja'

function Header() {
  return (
    <header className="bg-white border-b border-gray-100">
      <nav className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">X Search Pro</span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link to="/blog" className="text-gray-600 hover:text-gray-900 transition-colors">
              Blog
            </Link>
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Install Free
            </a>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header
