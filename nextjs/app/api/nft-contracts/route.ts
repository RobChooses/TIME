import { NextResponse } from 'next/server';

export async function GET() {
  console.log("Fetching NFT contracts for wallet:", process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESS);
  
  try {
    const baseUrl = `https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}/getNFTs`;
    const owner = process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESS;

    console.log("** Going to fetch:", `${baseUrl}?owner=${owner}`);

    const response = await fetch(`${baseUrl}?owner=${owner}`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    const data = await response.json();

    // Transform the data to only include required fields
    const simplifiedNFTs = data.ownedNfts.map((nft: any) => ({
      contractAddress: nft.contract.address,
      title: nft.contractMetadata?.name || '',
      imageUrl: nft.tokenUri?.gateway || ''
    }));

    return NextResponse.json(
      { 
        success: true, 
        data: simplifiedNFTs 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching NFT contracts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch NFT contracts' 
      },
      { status: 500 }
    );
  }
}
