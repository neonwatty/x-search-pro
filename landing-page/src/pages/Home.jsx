import { Link } from 'react-router-dom'

const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/x-search-pro/belfofaehpmgnifoddppdfgofflnkoja'
const YOUTUBE_DEMO_URL = 'https://www.youtube.com/watch?v=Xqn1spThqFk'

function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Save & Organize Your X Searches
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Build a library of powerful searches with auto-updating date ranges. Find viral content instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center"
            >
              Add to Chrome - Free
            </a>
            <a
              href={YOUTUBE_DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-lg font-semibold text-lg border border-gray-300 transition-colors inline-flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Watch Demo
            </a>
          </div>
        </div>
      </section>

      {/* Video Embed Section */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/Xqn1spThqFk"
              title="X Search Pro Demo"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      {/* Features Section - Condensed */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Feature
              title="Sliding Windows"
              description="Auto-updating date ranges that always show recent content"
            />
            <Feature
              title="Organized Library"
              description="Save searches in color-coded categories"
            />
            <Feature
              title="Advanced Filters"
              description="Filter by engagement, media, verified users & more"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to search smarter?
          </h2>
          <a
            href={CHROME_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors inline-block"
          >
            Install X Search Pro - Free
          </a>
        </div>
      </section>
    </div>
  )
}

function Feature({ title, description }) {
  return (
    <div className="text-center">
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  )
}

export default Home
