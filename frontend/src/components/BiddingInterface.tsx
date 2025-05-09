import React, { useState, useEffect } from 'react';
import { Bid, placeBid, getBids } from '../services/listingService';

interface BiddingInterfaceProps {
  listingId: number;
  currentUserId: number;
  startingPrice: number;
  currentBid?: number;
  isSeller: boolean;
  onCloseBidding: () => void;
  onPlaceBid: (amount: number) => Promise<void>;
  onBidPlaced?: (newBid: number) => void;
}

const BiddingInterface: React.FC<BiddingInterfaceProps> = ({
  listingId,
  currentUserId,
  startingPrice,
  currentBid,
  isSeller,
  onCloseBidding,
  onPlaceBid,
  onBidPlaced
}) => {
  const [bidAmount, setBidAmount] = useState('');
  const [bids, setBids] = useState<Bid[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchBids();
  }, [listingId]);

  const fetchBids = async () => {
    try {
      const fetchedBids = await getBids(listingId);
      setBids(fetchedBids);
    } catch (error) {
      console.error('Error fetching bids:', error);
    }
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const amount = parseFloat(bidAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid bid amount');
      }

      if (currentBid && amount <= currentBid) {
        throw new Error('Bid amount must be higher than current bid');
      }

      if (amount < startingPrice) {
        throw new Error('Bid amount must be at least the starting price');
      }

      let response;
      if (onPlaceBid) {
        await onPlaceBid(amount);
        response = true; // Assume success if onPlaceBid doesn't throw
      } else {
        // Debug log for bid payload
        // console.log('Placing bid with:', {
        //   listing_id: listingId,
        //   bidder_id: currentUserId,
        //   amount
        // });
        response = await placeBid({
          listing_id: listingId,
          bidder_id: currentUserId,
          amount
        });
      }

      // Only proceed if we got a valid response
      if (response) {
        // Fetch the updated bids from the server first
        await fetchBids();
        
        // Only show success message if we successfully fetched the updated bids
        if (bids.length > 0) {
          setBidAmount('');
          setSuccess('Bid placed successfully!');
          onBidPlaced?.(amount);
        } else {
          throw new Error('Failed to confirm bid was placed');
        }
      }
    } catch (err: unknown) {
      let errorMessage = 'Failed to place bid';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      setError(errorMessage);
      setSuccess(null); // Ensure success message is cleared on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Bid History</h3>
        {bids.length > 0 ? (
          <div className="space-y-2">
            {bids.map((bid) => (
              <div key={bid.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-gray-600">
                  ${bid.amount.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(bid.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
            No bids yet
          </div>
        )}
      </div>

      {(
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Place a Bid</h3>
          <form onSubmit={handleBidSubmit} className="space-y-4">
            <div>
              <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700">
                Your Bid Amount
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="bidAmount"
                  id="bidAmount"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="0.00"
                  step="0.01"
                  min={currentBid ? currentBid + 0.01 : startingPrice}
                />
              </div>
              <div className="mt-1 p-2 bg-gray-50 text-gray-600 rounded-md text-sm">
                Minimum bid: ${(currentBid ? currentBid + 0.01 : startingPrice).toFixed(2)}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm border border-green-200">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Placing Bid...' : 'Place Bid'}
            </button>
          </form>
        </div>
      )}

      {/* {isSeller && onCloseBidding && (
        <button
          onClick={onCloseBidding}
          className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
        >
          Close Bidding
        </button>
      )} */}
    </div>
  );
};

export default BiddingInterface; 