import React from 'react';
import BiddingInterface from './BiddingInterface';
import { getUserId } from '../services/authService';

interface ListingDetailProps {
  listing: {
    id: number;
    title: string;
    description: string;
    price: number;
    image_urls: string[];
    condition: string;
    pricing_mode: 'fixed' | 'auction';
    current_bid?: number;
    user_id: number;
  };
  isSeller: boolean;
}

const ListingDetail: React.FC<ListingDetailProps> = ({ listing, isSeller }) => {
  const currentUserId = getUserId();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">{listing.title}</h1>
        {listing.pricing_mode?.toLowerCase() === 'auction' && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            🏷️ Auction
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {listing.image_urls.length > 0 && (
            <img
              src={listing.image_urls[0]}
              alt={listing.title}
              className="w-full h-auto rounded-lg"
            />
          )}
        </div>
        
        <div>
          {listing.pricing_mode === 'auction' ? (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Auction Details</h3>
              {listing.current_bid ? (
                <p className="text-orange-500 font-bold">
                  Current Bid: ${listing.current_bid.toFixed(2)}
                </p>
              ) : (
                <p className="text-orange-500 font-bold">
                  Starting Price: ${listing.price.toFixed(2)}
                </p>
              )}
            </div>
          ) : (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Price</h3>
              <p className="text-orange-500 font-bold">${listing.price.toFixed(2)}</p>
            </div>
          )}
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-700">{listing.description}</p>
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Condition</h3>
            <p className="text-gray-700">{listing.condition}</p>
          </div>
          
          {listing.pricing_mode === 'auction' && currentUserId && (
            <BiddingInterface
              listingId={listing.id}
              currentUserId={parseInt(currentUserId)}
              startingPrice={listing.price}
              currentBid={listing.current_bid}
              isSeller={isSeller}
              onCloseBidding={() => {}}
              onPlaceBid={async (amount) => {
                try {
                  console.log('Placing bid:', amount);
                } catch (error) {
                  console.error('Error placing bid:', error);
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingDetail; 