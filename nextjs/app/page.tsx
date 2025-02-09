import Image from "next/image";

// Types for our meme news
type MemifiedNews = {
  id: string;
  headline: string;
  memeImageUrl: string;
  originalNewsUrl: string;
  timestamp: string;
}

// This will be replaced with actual data fetching
const DUMMY_NEWS: MemifiedNews[] = [
  {
    id: '1',
    headline: 'Tech CEO Announces Revolutionary AI - It Makes Coffee',
    memeImageUrl: '/placeholder-meme.jpg',
    originalNewsUrl: 'https://example.com/news/1',
    timestamp: new Date().toISOString(),
  },
  // ... more dummy data
];

export default async function Home() {
  return (
    <div className="min-h-screen bg-[#e7dbb8] dark:bg-gray-900 
                    ">
      <main className="container mx-auto px-4 py-8">
        {/* Masthead with updated border color */}
        <header className="text-center mb-12 border-b-4 border-[#2b2517] dark:border-gray-700 pb-6">
          <h1 className="font-serif text-6xl mb-2 tracking-tight text-[#2b2517] dark:text-gray-100 
                        [text-shadow:2px_2px_0px_rgba(0,0,0,0.1)]">
            TIMe: Today in Memes
          </h1>
          <div className="flex justify-center items-center gap-4 text-sm font-serif">
            <time className="italic text-gray-700 dark:text-gray-300">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
            <span className="text-gray-500">|</span>
            <p className="text-gray-700 dark:text-gray-300">
              "All the memes fit to print"
            </p>
          </div>
        </header>

        {/* Meme Grid with updated background colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {DUMMY_NEWS.map((news) => (
            <article 
              key={news.id}
              className="bg-[#fcfaf7] dark:bg-gray-800 border border-[#d3c7b5] dark:border-gray-700 
                         overflow-hidden shadow-[4px_4px_0px_0px_rgba(43,37,23,0.2)] 
                         hover:shadow-[6px_6px_0px_0px_rgba(43,37,23,0.2)] 
                         transition-shadow duration-300"
            >
              <div className="relative h-64 w-full border-b border-gray-200 dark:border-gray-700">
                <Image
                  src={news.memeImageUrl}
                  alt={news.headline}
                  fill
                  className="object-cover"
                  priority={news.id === '1'}
                />
              </div>
              <div className="p-6">
                <h2 className="font-serif text-xl font-bold mb-3 leading-tight text-gray-900 dark:text-gray-100">
                  {news.headline}
                </h2>
                <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <time className="font-serif italic text-sm text-gray-600 dark:text-gray-400">
                    {new Date(news.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </time>
                  <a
                    href={news.originalNewsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-serif text-sm text-gray-900 dark:text-gray-300 hover:underline 
                             underline-offset-4 decoration-dotted"
                  >
                    Full Story →
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      <footer className="mt-16 pb-8 text-center border-t border-[#d3c7b5] dark:border-gray-700 pt-8">
        <p className="font-serif italic text-[#2b2517] dark:text-gray-400">
          Published by TIMe
        </p>
      </footer>
    </div>
  );
}
