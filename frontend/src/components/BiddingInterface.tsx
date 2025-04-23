import React, { useState, useEffect } from 'react';
import { Bid, placeBid, getBids } from '../services/listingService';

interface BiddingInterfaceProps {
  listingId: number;
  currentUserId: number;
  startingPrice: number;
  currentBid?: number;
  isSeller: boolean;
  onCloseBidding?: () => void;
}

const BiddingInterface: React.FC<BiddingInterfaceProps> = ({
  listingId,
  currentUserId,
  startingPrice,
  currentBid,
  isSeller,
  onCloseBidding
}) => {
  const [bidAmount, setBidAmount] = useState('');
  const [bids, setBids] = useState<Bid[]>([]);
  const [error, setError] = useState<string | null>(null);
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

      await placeBid({
        listing_id: listingId,
        bidder_id: currentUserId,
        amount
      });

      setBidAmount('');
      await fetchBids();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to place bid';
      setError(errorMessage);
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
          <p className="text-gray-500">No bids yet</p>
        )}
      </div>

      {!isSeller && (
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
              <p className="mt-1 text-sm text-gray-500">
                Minimum bid: ${(currentBid ? currentBid + 0.01 : startingPrice).toFixed(2)}
              </p>
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
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

      {isSeller && onCloseBidding && (
        <button
          onClick={onCloseBidding}
          className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
        >
          Close Bidding
        </button>
      )}
    </div>
  );
};

export default BiddingInterface; 