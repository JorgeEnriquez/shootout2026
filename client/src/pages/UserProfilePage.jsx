import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
// Simple chevron icon (no external dependency needed)
const ChevronDownIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const STAGES = [
  'Group Stage',
  'Round of 32',
  'Round of 16',
  'Quarterfinals',
  'Semifinals',
  'Third Place',
  'Final'
];

const FLAG_MAP = {
  'Argentina': '🇦🇷',
  'Australia': '🇦🇺',
  'Brazil': '🇧🇷',
  'Canada': '🇨🇦',
  'Croatia': '🇭🇷',
  'England': '🇬🇧',
  'France': '🇫🇷',
  'Germany': '🇩🇪',
  'Japan': '🇯🇵',
  'Mexico': '🇲🇽',
  'Netherlands': '🇳🇱',
  'Portugal': '🇵🇹',
  'Spain': '🇪🇸',
  'Uruguay': '🇺🇾',
  'USA': '🇺🇸',
};

const getTeamFlag = (teamName) => {
  return FLAG_MAP[teamName] || '⚽';
};

const SkeletonLoader = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-32 bg-gray-200 rounded-lg" />
    <div className="h-12 bg-gray-200 rounded-lg" />
    <div className="h-64 bg-gray-200 rounded-lg" />
  </div>
);

const ResultBadge = ({ scoringType, pointsEarned }) => {
  if (scoringType === 'exact') {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
        ✅ Exact
        <span className="ml-1">{pointsEarned} pts</span>
      </span>
    );
  }

  if (scoringType === 'correct') {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
        ☑️ Correct
        <span className="ml-1">{pointsEarned} pts</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
      ❌ {pointsEarned || 0} pts
    </span>
  );
};

const PendingBadge = () => (
  <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
    ⏳ Pending
  </span>
);

const MatchCard = ({ match, prediction, isMatchCompleted }) => {
  const homeTeamName = match.homeTeam?.name || match.homeTeamName || 'Home';
  const awayTeamName = match.awayTeam?.name || match.awayTeamName || 'Away';
  const homeFlag = getTeamFlag(homeTeamName);
  const awayFlag = getTeamFlag(awayTeamName);

  // Determine background color based on result
  let bgColor = 'bg-white';
  if (isMatchCompleted && prediction) {
    if (prediction.scoringType === 'exact') {
      bgColor = 'bg-green-50';
    } else if (prediction.scoringType === 'correct') {
      bgColor = 'bg-blue-50';
    } else {
      bgColor = 'bg-red-50';
    }
  }

  return (
    <div className={`${bgColor} border border-gray-200 rounded-lg p-4 mb-3 shadow-sm`}>
      <div className="text-xs text-gray-500 font-medium mb-3">
        Match #{match.matchNumber} · {match.stage}
      </div>

      {/* Score row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="font-semibold text-gray-900">
            {homeFlag} {homeTeamName}
          </div>
        </div>

        {isMatchCompleted ? (
          <div className="px-4 py-1">
            <div className="text-center font-bold text-lg text-gray-900">
              {match.homeScore} - {match.awayScore}
            </div>
          </div>
        ) : (
          <div className="px-4 py-1 text-center text-sm text-gray-500 font-medium">
            vs
          </div>
        )}

        <div className="flex-1 text-right">
          <div className="font-semibold text-gray-900">
            {awayTeamName} {awayFlag}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-3" />

      {/* Prediction row */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {prediction ? (
            <>
              Prediction: <span className="font-semibold text-gray-900">{prediction.predictedHomeScore} - {prediction.predictedAwayScore}</span>
            </>
          ) : (
            <span className="text-gray-400">No prediction</span>
          )}
        </div>

        <div>
          {isMatchCompleted && prediction ? (
            <ResultBadge
              scoringType={prediction.scoringType}
              pointsEarned={prediction.pointsEarned}
            />
          ) : prediction ? (
            <PendingBadge />
          ) : null}
        </div>
      </div>
    </div>
  );
};

const StageSection = ({ stage, predictions, matches, expandedStages, toggleStage }) => {
  const stagePredictions = predictions.filter(p => p.stage === stage);
  const stageMatches = matches.filter(m => m.stage === stage);
  const isExpanded = expandedStages.has(stage);

  if (stageMatches.length === 0) {
    return null;
  }

  return (
    <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => toggleStage(stage)}
        className="w-full px-4 py-4 bg-white hover:bg-gray-50 flex items-center justify-between"
      >
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-gray-900">
            {stage}
          </h3>
          <p className="text-sm text-gray-500">
            {stagePredictions.length} prediction{stagePredictions.length !== 1 ? 's' : ''}
          </p>
        </div>

        <ChevronDownIcon
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-4">
          {stageMatches.length === 0 ? (
            <p className="text-gray-500 text-sm">No matches in this stage</p>
          ) : (
            <div>
              {stageMatches.map(match => {
                const prediction = stagePredictions.find(p => p.matchId === match.id);
                const isMatchCompleted = match.status === 'completed' || match.status === 'finished';

                return (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={prediction}
                    isMatchCompleted={isMatchCompleted}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const UserProfilePage = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();

  const [leaderboardData, setLeaderboardData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedStages, setExpandedStages] = useState(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all required data in parallel
        const [leaderboard, userPredictions, allMatches] = await Promise.all([
          api.getLeaderboard(),
          api.getUserPredictions(userId),
          api.getMatches(),
        ]);

        // Find the specific user in leaderboard
        const userStats = leaderboard.find(u => String(u.user_id) === String(userId));
        setLeaderboardData(userStats);
        setPredictions(userPredictions);
        setMatches(allMatches);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load user profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const toggleStage = (stage) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stage)) {
      newExpanded.delete(stage);
    } else {
      newExpanded.add(stage);
    }
    setExpandedStages(newExpanded);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <SkeletonLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/leaderboard" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
          ← Back to Leaderboard
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!leaderboardData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/leaderboard" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
          ← Back to Leaderboard
        </Link>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
          User not found. Please try again.
        </div>
      </div>
    );
  }

  const displayName = leaderboardData.display_name || 'Anonymous';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const totalPredictions = predictions.length;
  const exactScores = leaderboardData.exact_scores || 0;
  const correctResults = leaderboardData.correct_results || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link to="/leaderboard" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
        ← Back to Leaderboard
      </Link>

      {/* Header section */}
      <div className="bg-white rounded-lg p-8 mb-8 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-4xl font-bold text-blue-600">{avatarLetter}</span>
          </div>

          {/* User info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{displayName}</h1>
            <p className="text-lg text-gray-600 mb-4">
              Rank #{leaderboardData.rank} · {leaderboardData.total_points} points
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-600">{exactScores}</span>
                <span className="text-gray-600">exact</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-600">{correctResults}</span>
                <span className="text-gray-600">correct</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{totalPredictions}</span>
                <span className="text-gray-600">total predictions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Predictions section */}
      {totalPredictions === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600 mb-2">No predictions yet</p>
          <p className="text-gray-500 text-sm">
            This user hasn't made any predictions for the tournament.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Prediction History</h2>

          {/* Stage sections */}
          <div>
            {STAGES.map(stage => (
              <StageSection
                key={stage}
                stage={stage}
                predictions={predictions}
                matches={matches}
                expandedStages={expandedStages}
                toggleStage={toggleStage}
              />
            ))}
          </div>

          {/* No predictions message (shouldn't happen if totalPredictions > 0, but just in case) */}
          {predictions.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
              No predictions found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
