import React from 'react';

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
  };
  onBidSubmit?: (amount: number) => void;
}

const ListingDetail: React.FC<ListingDetailProps> = ({ listing, onBidSubmit }) => {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">{listing.title}</h1>
        {listing.pricing_mode === 'auction' && (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            🏷️ Auction Item
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
          
          {listing.pricing_mode === 'auction' && onBidSubmit && (
            <div className="mt-6">
              <button
                onClick={() => onBidSubmit(listing.price)}
                className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
              >
                Place Bid
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingDetail; 