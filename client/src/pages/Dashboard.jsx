import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

// Loading skeleton component
function SkeletonLoader({ className = 'h-12 w-full' }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;
}

// Flag map for team emojis
const getTeamFlag = (teamName) => {
  const flagMap = {
    'Argentina': '\u{1F1E6}\u{1F1F7}', 'Australia': '\u{1F1E6}\u{1F1FA}',
    'Brazil': '\u{1F1E7}\u{1F1F7}', 'Canada': '\u{1F1E8}\u{1F1E6}',
    'Croatia': '\u{1F1ED}\u{1F1F7}', 'England': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
    'France': '\u{1F1EB}\u{1F1F7}', 'Germany': '\u{1F1E9}\u{1F1EA}',
    'Japan': '\u{1F1EF}\u{1F1F5}', 'Mexico': '\u{1F1F2}\u{1F1FD}',
    'Netherlands': '\u{1F1F3}\u{1F1F1}', 'Portugal': '\u{1F1F5}\u{1F1F9}',
    'Spain': '\u{1F1EA}\u{1F1F8}', 'Uruguay': '\u{1F1FA}\u{1F1FE}',
    'United States': '\u{1F1FA}\u{1F1F8}', 'USA': '\u{1F1FA}\u{1F1F8}',
    'Morocco': '\u{1F1F2}\u{1F1E6}', 'Italy': '\u{1F1EE}\u{1F1F9}',
    'Belgium': '\u{1F1E7}\u{1F1EA}', 'Colombia': '\u{1F1E8}\u{1F1F4}',
    'South Korea': '\u{1F1F0}\u{1F1F7}',
  };
  return flagMap[teamName] || '';
};

// Stage order for determining the "active" stage
const STAGE_ORDER = [
  'Group Stage',
  'Round of 32',
  'Round of 16',
  'Quarterfinals',
  'Semifinals',
  'Third Place',
  'Final',
];

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [matches, setMatches] = useState([]);
  const [userStats, setUserStats] = useState({ rank: null, points: 0 });
  const [nextDeadline, setNextDeadline] = useState(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const [leaderboardData, matchesData, deadlinesData] = await Promise.all([
          api.getLeaderboard(),
          api.getMatches(),
          api.getDeadlines(),
        ]);

        setLeaderboard(leaderboardData || []);

        // Find user's stats from leaderboard
        const userInLeaderboard = leaderboardData?.find(
          (entry) => entry.user_id === user?.id
        );
        if (userInLeaderboard) {
          setUserStats({
            rank: userInLeaderboard.rank,
            points: userInLeaderboard.total_points,
          });
        }

        // Determine the current active stage from deadlines
        const now = new Date();
        let activeStage = null;
        let activeDeadline = null;

        for (const stageName of STAGE_ORDER) {
          const dl = deadlinesData.find(d => d.stage === stageName);
          if (!dl) continue;
          const isLocked = dl.is_locked === 1;
          const isPast = dl.deadline_datetime && new Date(dl.deadline_datetime) < now;
          if (!isLocked && !isPast) {
            activeStage = stageName;
            activeDeadline = dl;
            break;
          }
        }

        // Set next deadline from actual API data
        if (activeDeadline) {
          setNextDeadline({
            stage: activeDeadline.stage,
            deadline: new Date(activeDeadline.deadline_datetime),
          });
        } else {
          setNextDeadline(null);
        }

        // Show upcoming matches for the active stage (or all upcoming if no active stage)
        const activeStageMatches = activeStage
          ? matchesData.filter(m => m.stage === activeStage && m.status !== 'completed')
          : matchesData.filter(m => m.status !== 'completed');

        setMatches(activeStageMatches.slice(0, 6));
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const getTimeUntilDeadline = (deadline) => {
    const now = new Date();
    const diff = deadline - now;
    if (diff <= 0) return 'Deadline passed';
    const totalMinutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const days = Math.floor(hours / 24);

    if (days > 1) return `${days} days remaining`;
    if (days === 1) return `1 day, ${hours % 24}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const formatMatchDay = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMatchTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }) + ' EST';
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Row 1: Welcome + Stats + Leaderboard side by side */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Welcome + Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome back, {user?.display_name || 'Player'}!
            </h1>

            {loading ? (
              <SkeletonLoader className="h-24" />
            ) : (
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Current Rank</p>
                    <p className="text-4xl font-bold">#{userStats.rank || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-100 text-sm font-medium">Total Points</p>
                    <p className="text-4xl font-bold">{userStats.points}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Leaderboard Preview */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top 5 Leaderboard</h2>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <SkeletonLoader key={i} className="h-10" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((entry) => {
                  const medal = getMedalEmoji(entry.rank);
                  const isCurrentUser = entry.user_id === user?.id;

                  return (
                    <div
                      key={entry.user_id}
                      className={`flex items-center justify-between p-3 rounded-lg transition ${
                        isCurrentUser
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold w-8 text-center text-gray-600">
                          {medal || `#${entry.rank}`}
                        </span>
                        <span className={`font-semibold ${
                          isCurrentUser ? 'text-blue-700' : 'text-gray-900'
                        }`}>
                          {entry.display_name}
                        </span>
                      </div>
                      <span className={`font-bold ${
                        isCurrentUser ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        {entry.total_points} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && leaderboard.length > 0 && (
              <Link
                to="/leaderboard"
                className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View Full Leaderboard →
              </Link>
            )}
          </div>
        </div>

        {/* Next Deadline Card */}
        {!loading && nextDeadline && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Next Deadline</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{nextDeadline.stage}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {nextDeadline.deadline.toLocaleString('en-US', {
                    timeZone: 'America/New_York',
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })} EST
                </p>
              </div>
              <div className={`text-right ${
                nextDeadline.deadline - new Date() < 24 * 60 * 60 * 1000
                  ? 'text-orange-600'
                  : 'text-green-600'
              }`}>
                <p className="text-sm font-semibold">
                  {getTimeUntilDeadline(nextDeadline.deadline)}
                </p>
                {nextDeadline.deadline - new Date() < 24 * 60 * 60 * 1000 &&
                  nextDeadline.deadline > new Date() && (
                  <p className="text-xs mt-1">{'⏰'} Hurry up!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Matches — full width, with Submit Predictions button in header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Matches</h2>
            <Link
              to="/predictions"
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-5 rounded-lg transition text-sm shadow-sm"
            >
              Submit Predictions
            </Link>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(4)].map((_, i) => (
                <SkeletonLoader key={i} className="h-36" />
              ))}
            </div>
          ) : matches.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => {
                const homeFlag = getTeamFlag(match.homeTeam);
                const awayFlag = getTeamFlag(match.awayTeam);

                return (
                  <div key={match.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                    {/* Stage label */}
                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">
                      {match.stage}{match.groupLetter ? ` · Group ${match.groupLetter}` : ''}
                    </div>

                    {/* Teams */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex-1 text-center">
                        <div className="text-2xl mb-1">{homeFlag}</div>
                        <div className="text-sm font-semibold text-gray-900 leading-tight">{match.homeTeam}</div>
                      </div>
                      <div className="text-gray-400 font-bold text-lg">vs</div>
                      <div className="flex-1 text-center">
                        <div className="text-2xl mb-1">{awayFlag}</div>
                        <div className="text-sm font-semibold text-gray-900 leading-tight">{match.awayTeam}</div>
                      </div>
                    </div>

                    {/* Date and time */}
                    <div className="border-t pt-3 text-center">
                      <p className="text-xs font-medium text-gray-500">{formatMatchDay(match.date)}</p>
                      <p className="text-xs text-gray-400">{formatMatchTime(match.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No upcoming matches scheduled</p>
          )}

          {!loading && matches.length > 0 && (
            <Link
              to="/matches"
              className="inline-block mt-5 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              See all matches →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
