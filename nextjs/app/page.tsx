import Image from "next/image";

// Types for NFT collections
type NFTCollection = {
  id: string;
  title: string;
  imageUrl: string;
  contractAddress: string;
  createdAt: string;
}

// Updated fetch function to handle the response structure
async function getNFTCollections(): Promise<NFTCollection[]> {
  try {
    const response = await fetch('http://localhost:3000/api/nft-contracts', {
      cache: 'no-store'  // Forces fresh data on every request
      // Alternatively, use:
      // next: { revalidate: 0 }  // For dynamic data
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch NFT collections');
    }
    
    const result = await response.json();
    
    // Transform the API response and ensure imageUrl is an absolute URL
    const collections = result.data.map((nft: any, index: number) => ({
      id: nft.contractAddress,
      title: nft.title,
      // Ensure the imageUrl is an absolute URL
      imageUrl: new URL(nft.imageUrl, 'http://localhost:3000').toString(),
      contractAddress: nft.contractAddress,
      createdAt: new Date().toISOString()
    }));
    
    return collections;
    
  } catch (error) {
    console.error('Error fetching NFT collections:', error);
    return []; // Return empty array on error
  }
}

export default async function Home() {
  const collections = await getNFTCollections();

  return (
    <div className="min-h-screen bg-[#e7dbb8] dark:bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        {/* Masthead with updated title */}
        <header className="text-center mb-12 border-b-4 border-[#2b2517] dark:border-gray-700 pb-6">
          <h1 className="font-serif text-6xl mb-2 tracking-tight text-[#2b2517] dark:text-gray-100 
                        [text-shadow:2px_2px_0px_rgba(0,0,0,0.1)]">
            TIMe: Today in Memes
          </h1>
          <div className="flex flex-col items-center gap-4 text-sm font-serif">
            <div className="w-full max-w-xl flex items-center justify-center gap-4 my-4">
              <div className="h-0.5 flex-1 bg-[#2b2517] dark:bg-gray-700"></div>
              <div className="text-[#2b2517] dark:text-gray-300">✦</div>
              <div className="h-0.5 flex-1 bg-[#2b2517] dark:bg-gray-700"></div>
            </div>

            <p className="text-gray-700 dark:text-gray-300 text-2xl">
              Today's Moments, Tomorrow's Collectibles 📰✨
            </p>
          </div>
        </header>

        {/* NFT Collections Grid with empty state */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.length > 0 ? (
            collections.map((collection) => (
              <article 
                key={collection.id}
                className="bg-[#fcfaf7] dark:bg-gray-800 border border-[#d3c7b5] dark:border-gray-700 
                           overflow-hidden shadow-[4px_4px_0px_0px_rgba(43,37,23,0.2)] 
                           hover:shadow-[6px_6px_0px_0px_rgba(43,37,23,0.2)] 
                           transition-shadow duration-300"
              >
                <div className="relative h-64 w-full border-b border-gray-200 dark:border-gray-700">
                  {collection.title}
                  <Image
                    src={collection.imageUrl.replace(/0$/, '')}
                    alt={collection.title}
                    fill
                    className="object-cover"
                    priority={collection.id === '1'}
                  />
                </div>
                <div className="p-6">
                  <h2 className="font-serif text-xl font-bold mb-3 leading-tight text-gray-900 dark:text-gray-100">
                    {collection.title}
                  </h2>
                  <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <button
                      className="font-serif text-sm px-4 py-2 bg-[#2b2517] text-white rounded
                               hover:bg-[#403725] transition-colors duration-200
                               dark:bg-gray-700 dark:hover:bg-gray-600
                               focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2b2517]
                               dark:focus:ring-gray-500"
                      aria-label={`Mint NFT from ${collection.title} collection`}
                    >
                      Mint NFT
                    </button>
                    <a
                      href={`https://sepolia.basescan.org/address/${collection.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-serif text-sm text-gray-900 dark:text-gray-300 hover:underline 
                               underline-offset-4 decoration-dotted"
                      aria-label={`View contract ${collection.contractAddress} on Base Sepolia Explorer`}
                    >
                      View Contract →
                    </a>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-700 dark:text-gray-300 font-serif text-lg">
                No NFT collections found. Please check back later.
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-16 pb-8 text-center border-t border-[#d3c7b5] dark:border-gray-700 pt-8">
        <p className="font-serif italic text-[#2b2517] dark:text-gray-400">
          TIMe: Today in Memes
        </p>
      </footer>
    </div>
  );
}
