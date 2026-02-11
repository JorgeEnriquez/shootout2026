import { useEffect, useState } from 'react';
import { api } from '../api';

// Loading skeleton component
function SkeletonLoader({ className = 'h-12 w-full' }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;
}

export default function PrizePoolPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prizePool, setPrizePool] = useState(null);

  useEffect(() => {
    async function fetchPrizePool() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getPrizePool();
        setPrizePool(data);
      } catch (err) {
        setError(err.message || 'Failed to load prize pool');
        console.error('Prize pool error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPrizePool();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getMedalEmoji = (place) => {
    if (place === 1) return '🥇';
    if (place === 2) return '🥈';
    if (place === 3) return '🥉';
    return null;
  };

  const prizeDistribution = [
    { place: 1, percentage: 30 },
    { place: 2, percentage: 20 },
    { place: 3, percentage: 15 },
    { place: 4, percentage: 10 },
    { place: 5, percentage: 8 },
    { place: 6, percentage: 6 },
    { place: 7, percentage: 4 },
    { place: 8, percentage: 3 },
    { place: 9, percentage: 2 },
    { place: 10, percentage: 2 },
  ];

  const calculatePrizeAmount = (percentage) => {
    if (!prizePool) return 0;
    return (prizePool.total_prize_pool * percentage) / 100;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Prize Pool</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Prize Pool</h1>
          <p className="text-gray-600">See how the jackpot is distributed among winners</p>
        </div>

        {/* Jackpot Hero Section */}
        {loading ? (
          <SkeletonLoader className="h-48" />
        ) : (
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg p-8 text-white">
            <p className="text-blue-100 text-sm font-medium mb-2">TOTAL JACKPOT</p>
            <h2 className="text-6xl font-bold mb-4">
              {formatCurrency(prizePool?.total_prize_pool || 0)}
            </h2>
            <p className="text-blue-100 text-lg">
              {prizePool?.participant_count || 0} participants × $104 entry fee
            </p>
          </div>
        )}

        {/* Prize Distribution Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Prize Distribution</h2>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(10)].map((_, i) => (
                <SkeletonLoader key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Place
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Prize Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {prizeDistribution.map((item, index) => {
                    const isTopThree = item.place <= 3;
                    const prizeAmount = calculatePrizeAmount(item.percentage);
                    const medal = getMedalEmoji(item.place);

                    return (
                      <tr
                        key={item.place}
                        className={`border-b border-gray-100 transition ${
                          isTopThree
                            ? 'bg-amber-50 hover:bg-amber-100'
                            : index % 2 === 0
                              ? 'bg-white hover:bg-gray-50'
                              : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <td className={`px-6 py-4 ${isTopThree ? 'text-lg font-bold' : 'text-base font-semibold'}`}>
                          <span className="flex items-center gap-2">
                            {medal && <span className="text-2xl">{medal}</span>}
                            <span className={isTopThree ? 'text-amber-700' : 'text-gray-900'}>
                              {item.place === 1 ? '1st' : item.place === 2 ? '2nd' : item.place === 3 ? '3rd' : `${item.place}th`}
                            </span>
                          </span>
                        </td>
                        <td className={`px-6 py-4 ${isTopThree ? 'text-lg font-semibold text-amber-700' : 'text-gray-600'}`}>
                          {item.percentage}%
                        </td>
                        <td className={`px-6 py-4 text-right ${isTopThree ? 'text-lg font-bold text-amber-700' : 'font-semibold text-gray-900'}`}>
                          {formatCurrency(prizeAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Notes */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 text-sm">
              <span className="font-semibold">Prize Distribution Note:</span> Prize money for tied positions will be combined and split equally among all tied participants.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-900 text-sm">
              <span className="font-semibold">Entry Fee:</span> $104 per participant. All entry fees are added to the prize pool.
            </p>
          </div>
        </div>

        {/* Additional Info */}
        {!loading && prizePool && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Pool Summary</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Participants</p>
                <p className="text-3xl font-bold text-gray-900">{prizePool.participant_count}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Entry Fee per Participant</p>
                <p className="text-3xl font-bold text-gray-900">$104</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Prize Pool</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(prizePool.total_prize_pool)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
