import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

// Loading skeleton component
function SkeletonLoader({ className = 'h-12 w-full' }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;
}

// Point values reference table
function PointValuesReference() {
  const [isOpen, setIsOpen] = useState(false);

  const pointValues = [
    { stage: 'Group Stage', correctResult: 1, exactScore: 3 },
    { stage: 'Round of 32', correctResult: 2, exactScore: 5 },
    { stage: 'Round of 16', correctResult: 3, exactScore: 7 },
    { stage: 'Quarterfinals', correctResult: 4, exactScore: 9 },
    { stage: 'Semifinals', correctResult: 6, exactScore: 11 },
    { stage: 'Third Place', correctResult: 6, exactScore: 11 },
    { stage: 'Final', correctResult: 10, exactScore: 20 },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition"
      >
        <h3 className="text-lg font-bold text-gray-900">Point Values</h3>
        <span className={`text-2xl transition transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Tournament Stage</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Correct Result</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Exact Score</th>
              </tr>
            </thead>
            <tbody>
              {pointValues.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900 font-medium">{row.stage}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{row.correctResult} pts</td>
                  <td className="py-3 px-4 text-center text-gray-600">{row.exactScore} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Group leaderboard entries by rank for tie display
function groupByRank(leaderboard) {
  const groups = [];
  let currentGroup = null;

  leaderboard.forEach((entry) => {
    if (!currentGroup || currentGroup.rank !== entry.rank) {
      currentGroup = {
        rank: entry.rank,
        totalPoints: entry.total_points,
        entries: [entry],
      };
      groups.push(currentGroup);
    } else {
      currentGroup.entries.push(entry);
    }
  });

  return groups;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getLeaderboard();
        setLeaderboard(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load leaderboard');
        console.error('Leaderboard error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const getRankHeaderStyle = (rank) => {
    if (rank === 1) return 'bg-yellow-50 border-l-4 border-yellow-400';
    if (rank === 2) return 'bg-gray-100 border-l-4 border-gray-400';
    if (rank === 3) return 'bg-orange-50 border-l-4 border-orange-400';
    return 'bg-gray-50 border-l-4 border-gray-300';
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Leaderboard</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const rankedGroups = groupByRank(leaderboard);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-gray-900">Leaderboard</h1>
            <span className="text-4xl">🏆</span>
          </div>
          <p className="text-gray-600">
            {loading ? (
              <SkeletonLoader className="h-4 w-32" />
            ) : (
              `${leaderboard.length} participants competing for the prize pool`
            )}
          </p>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(10)].map((_, i) => (
                <SkeletonLoader key={i} className="h-12" />
              ))}
            </div>
          ) : rankedGroups.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-16">
                        Rank
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Display Name
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        Total Points
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        Exact Scores
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        Correct Results
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedGroups.map((group) => {
                      const medal = getMedalEmoji(group.rank);
                      const isTied = group.entries.length > 1;

                      if (!isTied) {
                        // Single entry — render as a normal row
                        const entry = group.entries[0];
                        const isCurrentUser = entry.user_id === user?.id;
                        const rankStyle = getRankHeaderStyle(group.rank);

                        return (
                          <tr
                            key={entry.user_id}
                            className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                              isCurrentUser ? 'bg-blue-50 border-l-4 border-l-blue-500' : rankStyle
                            }`}
                          >
                            <td className="px-6 py-4">
                              <span className="text-lg font-bold">
                                {medal || `#${group.rank}`}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <Link
                                to={`/user/${entry.user_id}`}
                                className={`font-semibold hover:underline ${
                                  isCurrentUser ? 'text-blue-700' : 'text-gray-900 hover:text-blue-600'
                                }`}
                              >
                                {entry.display_name}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    You
                                  </span>
                                )}
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`font-bold text-lg ${
                                isCurrentUser ? 'text-blue-700' : 'text-gray-900'
                              }`}>
                                {entry.total_points}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-gray-600 font-medium">
                              {entry.exact_scores || 0}
                            </td>
                            <td className="px-6 py-4 text-center text-gray-600 font-medium">
                              {entry.correct_results || 0}
                            </td>
                          </tr>
                        );
                      }

                      // Tied entries — render rank header + indented sub-rows
                      return group.entries.map((entry, subIdx) => {
                        const isCurrentUser = entry.user_id === user?.id;
                        const rankStyle = getRankHeaderStyle(group.rank);

                        return (
                          <tr
                            key={entry.user_id}
                            className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                              isCurrentUser ? 'bg-blue-50 border-l-4 border-l-blue-500' : rankStyle
                            }`}
                          >
                            <td className="px-6 py-4">
                              {subIdx === 0 ? (
                                <div>
                                  <span className="text-lg font-bold">
                                    {medal || `#${group.rank}`}
                                  </span>
                                  <span className="ml-1 text-xs text-gray-500 font-normal">
                                    (T)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400 pl-2">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className={subIdx > 0 ? 'pl-2' : ''}>
                                <Link
                                  to={`/user/${entry.user_id}`}
                                  className={`font-semibold hover:underline ${
                                    isCurrentUser ? 'text-blue-700' : 'text-gray-900 hover:text-blue-600'
                                  }`}
                                >
                                  {entry.display_name}
                                  {isCurrentUser && (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                      You
                                    </span>
                                  )}
                                </Link>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`font-bold text-lg ${
                                isCurrentUser ? 'text-blue-700' : 'text-gray-900'
                              }`}>
                                {entry.total_points}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-gray-600 font-medium">
                              {entry.exact_scores || 0}
                            </td>
                            <td className="px-6 py-4 text-center text-gray-600 font-medium">
                              {entry.correct_results || 0}
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden p-4 space-y-4">
                {rankedGroups.map((group) => {
                  const medal = getMedalEmoji(group.rank);
                  const isTied = group.entries.length > 1;
                  const rankStyle = getRankHeaderStyle(group.rank);

                  return (
                    <div key={group.rank} className="space-y-1">
                      {/* Rank header for ties */}
                      {isTied && (
                        <div className={`rounded-t-lg px-4 py-2 ${rankStyle}`}>
                          <span className="text-xl font-bold">
                            {medal || `#${group.rank}`}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            Tied — {group.totalPoints} pts
                          </span>
                        </div>
                      )}

                      {/* User cards */}
                      {group.entries.map((entry) => {
                        const isCurrentUser = entry.user_id === user?.id;

                        return (
                          <div
                            key={entry.user_id}
                            className={`rounded-lg p-4 transition ${
                              isTied ? 'ml-4 border-l-2 border-gray-300' : ''
                            } ${
                              isCurrentUser
                                ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                : isTied
                                  ? 'bg-white'
                                  : rankStyle || 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                {!isTied && (
                                  <span className="text-2xl font-bold w-10">
                                    {medal || `#${group.rank}`}
                                  </span>
                                )}
                                <div>
                                  <Link
                                    to={`/user/${entry.user_id}`}
                                    className={`font-bold hover:underline ${
                                      isCurrentUser ? 'text-blue-700' : 'text-gray-900 hover:text-blue-600'
                                    }`}
                                  >
                                    {entry.display_name}
                                  </Link>
                                  {isCurrentUser && (
                                    <p className="text-xs text-blue-600 font-medium">You</p>
                                  )}
                                </div>
                              </div>
                              <p className={`font-bold text-lg ${
                                isCurrentUser ? 'text-blue-700' : 'text-gray-900'
                              }`}>
                                {entry.total_points} pts
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-white rounded px-2 py-1">
                                <p className="text-gray-600">Exact Scores</p>
                                <p className="font-bold text-gray-900">{entry.exact_scores || 0}</p>
                              </div>
                              <div className="bg-white rounded px-2 py-1">
                                <p className="text-gray-600">Correct Results</p>
                                <p className="font-bold text-gray-900">{entry.correct_results || 0}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">No leaderboard data available yet</p>
            </div>
          )}
        </div>

        {/* Point Values Reference */}
        <PointValuesReference />
      </div>
    </div>
  );
}
