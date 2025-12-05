import { Link } from 'react-router-dom'

const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/x-search-pro/belfofaehpmgnifoddppdfgofflnkoja'

function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            <span className="font-semibold text-gray-900">X Search Pro</span>
          </div>

          <div className="flex items-center space-x-6 text-sm">
            <Link to="/blog" className="text-gray-600 hover:text-gray-900 transition-colors">
              Blog
            </Link>
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Chrome Web Store
            </a>
          </div>

          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} X Search Pro
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
