import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

// Stages are loaded dynamically from the deadlines API (see useEffect below)

const getTeamFlag = (teamName) => {
  const flagMap = {
    'Argentina': '\u{1F1E6}\u{1F1F7}',
    'Australia': '\u{1F1E6}\u{1F1FA}',
    'Brazil': '\u{1F1E7}\u{1F1F7}',
    'Canada': '\u{1F1E8}\u{1F1E6}',
    'Croatia': '\u{1F1ED}\u{1F1F7}',
    'England': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
    'France': '\u{1F1EB}\u{1F1F7}',
    'Germany': '\u{1F1E9}\u{1F1EA}',
    'Japan': '\u{1F1EF}\u{1F1F5}',
    'Mexico': '\u{1F1F2}\u{1F1FD}',
    'Netherlands': '\u{1F1F3}\u{1F1F1}',
    'Portugal': '\u{1F1F5}\u{1F1F9}',
    'Spain': '\u{1F1EA}\u{1F1F8}',
    'Uruguay': '\u{1F1FA}\u{1F1FE}',
    'United States': '\u{1F1FA}\u{1F1F8}',
    'USA': '\u{1F1FA}\u{1F1F8}',
    'Morocco': '\u{1F1F2}\u{1F1E6}',
    'Saudi Arabia': '\u{1F1F8}\u{1F1E6}',
    'Senegal': '\u{1F1F8}\u{1F1F3}',
    'Poland': '\u{1F1F5}\u{1F1F1}',
    'Costa Rica': '\u{1F1E8}\u{1F1F7}',
    'Belgium': '\u{1F1E7}\u{1F1EA}',
    'Tunisia': '\u{1F1F9}\u{1F1F3}',
    'Ukraine': '\u{1F1FA}\u{1F1E6}',
    'Switzerland': '\u{1F1E8}\u{1F1ED}',
    'Cameroon': '\u{1F1E8}\u{1F1F2}',
    'Serbia': '\u{1F1F7}\u{1F1F8}',
    'Iran': '\u{1F1EE}\u{1F1F7}',
    'Wales': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}',
    'Italy': '\u{1F1EE}\u{1F1F9}',
    'Greece': '\u{1F1EC}\u{1F1F7}',
    'Uzbekistan': '\u{1F1FA}\u{1F1FF}',
    'Albania': '\u{1F1E6}\u{1F1F1}',
    'T\u00FCrkiye': '\u{1F1F9}\u{1F1F7}',
    'Slovenia': '\u{1F1F8}\u{1F1EE}',
    'Denmark': '\u{1F1E9}\u{1F1F0}',
    'Ecuador': '\u{1F1EA}\u{1F1E8}',
    'Peru': '\u{1F1F5}\u{1F1EA}',
    'Bolivia': '\u{1F1E7}\u{1F1F4}',
    'Chile': '\u{1F1E8}\u{1F1F1}',
    'Austria': '\u{1F1E6}\u{1F1F9}',
    'Czechia': '\u{1F1E8}\u{1F1FF}',
    'Norway': '\u{1F1F3}\u{1F1F4}',
    'Paraguay': '\u{1F1F5}\u{1F1FE}',
    'Ghana': '\u{1F1EC}\u{1F1ED}',
    'South Korea': '\u{1F1F0}\u{1F1F7}',
    'Colombia': '\u{1F1E8}\u{1F1F4}',
    'Venezuela': '\u{1F1FB}\u{1F1EA}',
    'Jamaica': '\u{1F1EF}\u{1F1F2}',
    'Panama': '\u{1F1F5}\u{1F1E6}',
  };
  return flagMap[teamName] || '';
};

const MatchSkeleton = () => (
  <div className="bg-white rounded-lg p-3 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-10 bg-gray-200 rounded w-1/3"></div>
      <div className="h-10 bg-gray-200 rounded w-1/3"></div>
      <div className="h-10 bg-gray-200 rounded w-1/3"></div>
    </div>
  </div>
);

const PredictionCard = ({ match, prediction, onPredictionChange, isLocked }) => {
  const handleHomeChange = (value) => {
    onPredictionChange(match.id, {
      ...prediction,
      matchId: match.id,
      homeScore: value === '' ? null : parseInt(value) || 0,
      awayScore: prediction?.awayScore ?? null,
    });
  };

  const handleAwayChange = (value) => {
    onPredictionChange(match.id, {
      ...prediction,
      matchId: match.id,
      homeScore: prediction?.homeScore ?? null,
      awayScore: value === '' ? null : parseInt(value) || 0,
    });
  };

  const isCompleted = match.status === 'completed';
  const canEdit = !isLocked && !isCompleted;

  // Use actual points from the prediction data if match is completed
  let resultIcon = null;
  let resultText = null;
  let resultColor = '';
  let cardBg = 'bg-white';

  if (isCompleted && prediction && prediction.scoringType) {
    if (prediction.scoringType === 'exact') {
      resultIcon = '\u2705';
      resultText = `${prediction.pointsEarned} pts (Exact!)`;
      resultColor = 'text-green-600';
      cardBg = 'bg-green-50';
    } else if (prediction.scoringType === 'correct') {
      resultIcon = '\u2611\uFE0F';
      resultText = `${prediction.pointsEarned} pts (Correct)`;
      resultColor = 'text-blue-600';
      cardBg = 'bg-blue-50';
    } else {
      resultIcon = '\u274C';
      resultText = '0 pts';
      resultColor = 'text-red-600';
      cardBg = 'bg-red-50';
    }
  }

  const homeTeamDisplay = match.homeTeam || 'TBD';
  const awayTeamDisplay = match.awayTeam || 'TBD';
  const homeFlag = getTeamFlag(homeTeamDisplay);
  const awayFlag = getTeamFlag(awayTeamDisplay);

  return (
    <div className={`${cardBg} rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors`}>
      {/* Match header */}
      <div className="text-xs text-gray-400 mb-2 font-medium">
        {match.matchNumber ? `Match #${match.matchNumber}` : match.stage}
        {match.groupLetter ? ` \u00B7 Group ${match.groupLetter}` : ''}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        {/* Home Team */}
        <div className="flex-1 text-right">
          <div className="text-sm font-medium text-gray-700 truncate">
            {homeFlag ? `${homeFlag} ` : ''}{homeTeamDisplay}
          </div>
        </div>

        {/* Score Inputs or Display */}
        <div className="flex items-center justify-center gap-2 flex-shrink-0">
          {canEdit ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="20"
                step="1"
                value={prediction?.homeScore ?? ''}
                onChange={(e) => handleHomeChange(e.target.value)}
                className="w-12 h-10 text-center font-semibold border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                placeholder="-"
              />
              <div className="text-gray-400 font-semibold">-</div>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="20"
                step="1"
                value={prediction?.awayScore ?? ''}
                onChange={(e) => handleAwayChange(e.target.value)}
                className="w-12 h-10 text-center font-semibold border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                placeholder="-"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-12 h-10 bg-gray-100 rounded flex items-center justify-center font-bold text-gray-900">
                {prediction?.homeScore ?? '-'}
              </div>
              <div className="text-gray-400 font-semibold">-</div>
              <div className="w-12 h-10 bg-gray-100 rounded flex items-center justify-center font-bold text-gray-900">
                {prediction?.awayScore ?? '-'}
              </div>
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700 truncate">
            {awayTeamDisplay}{awayFlag ? ` ${awayFlag}` : ''}
          </div>
        </div>

        {/* Result Indicator */}
        {resultIcon && (
          <div className="flex-shrink-0 text-xs font-medium">
            <div className={resultColor}>{resultIcon}</div>
            <div className={`${resultColor} text-xs whitespace-nowrap`}>{resultText}</div>
          </div>
        )}
      </div>

      {/* Actual Score Display for Completed Matches */}
      {isCompleted && (
        <div className="mt-2 text-xs text-gray-500 text-center border-t pt-2">
          Final score: {match.homeScore}-{match.awayScore}
        </div>
      )}
    </div>
  );
};

export default function PredictionsPage() {
  const { user } = useAuth();
  const [stages, setStages] = useState([]);
  const [selectedStage, setSelectedStage] = useState(null);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(null);
  const [deadlines, setDeadlines] = useState({});

  // Fetch deadlines on mount → derive stage tabs dynamically
  useEffect(() => {
    const fetchDeadlines = async () => {
      try {
        const data = await api.getDeadlines();
        const deadlineMap = {};
        const stageList = [];
        data.forEach(d => {
          deadlineMap[d.stage] = {
            deadline: d.deadline_datetime,
            isLocked: d.is_locked === 1,
          };
          stageList.push({ id: d.stage, label: d.stage });
        });
        setDeadlines(deadlineMap);
        setStages(stageList);
        if (stageList.length > 0 && !selectedStage) {
          setSelectedStage(stageList[0].id);
        }
      } catch (error) {
        console.error('Error fetching deadlines:', error);
      }
    };
    fetchDeadlines();
  }, []);

  // Fetch matches and predictions when stage changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [matchesData, predictionsData] = await Promise.all([
          api.getMatches(selectedStage),
          api.getMyPredictions(),
        ]);
        setMatches(matchesData);

        const predictionMap = {};
        predictionsData.forEach((pred) => {
          predictionMap[pred.matchId] = pred;
        });
        setPredictions(predictionMap);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedStage]);

  const handlePredictionChange = (matchId, updatedPrediction) => {
    setPredictions((prev) => ({
      ...prev,
      [matchId]: updatedPrediction,
    }));
  };

  // Check if current stage is locked (by deadline or explicit lock)
  const isCurrentStageLocked = () => {
    const stageDeadline = deadlines[selectedStage];
    if (!stageDeadline) return false;
    if (stageDeadline.isLocked) return true;
    if (stageDeadline.deadline && new Date(stageDeadline.deadline) < new Date()) return true;
    return false;
  };

  const stageLocked = isCurrentStageLocked();

  const handleSavePredictions = async () => {
    setSaving(true);
    setShowError(null);
    try {
      // Only submit predictions for matches in the current stage view
      const currentMatchIds = new Set(matches.map(m => m.id));
      const predictionsToSubmit = Object.entries(predictions)
        .filter(([matchId]) => currentMatchIds.has(parseInt(matchId)) || currentMatchIds.has(matchId))
        .filter(([, pred]) => pred.homeScore !== null && pred.awayScore !== null)
        .map(([matchId, pred]) => ({
          matchId: parseInt(matchId),
          homeScore: pred.homeScore,
          awayScore: pred.awayScore,
        }));

      if (predictionsToSubmit.length === 0) {
        setShowError('Please fill in at least one prediction before saving.');
        setSaving(false);
        return;
      }

      await api.submitPredictions(predictionsToSubmit);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving predictions:', error);
      setShowError(error.message || 'Failed to save predictions. Please try again.');
      setTimeout(() => setShowError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Count filled predictions for current stage's matches
  const currentMatchIds = new Set(matches.map(m => m.id));
  const filledPredictions = Object.entries(predictions).filter(
    ([matchId, pred]) =>
      (currentMatchIds.has(parseInt(matchId)) || currentMatchIds.has(matchId)) &&
      pred.homeScore !== null && pred.homeScore !== undefined &&
      pred.awayScore !== null && pred.awayScore !== undefined
  ).length;

  // Calculate stage stats for completed matches
  const getStageStat = () => {
    const completedMatches = matches.filter((m) => m.status === 'completed');
    if (completedMatches.length === 0) return null;

    let totalPoints = 0;
    completedMatches.forEach((match) => {
      const pred = predictions[match.id];
      if (pred && pred.pointsEarned) {
        totalPoints += pred.pointsEarned;
      }
    });

    return { totalPoints, completedMatches: completedMatches.length, totalMatches: matches.length };
  };

  const stageStat = getStageStat();

  // Check deadline info for display
  const getDeadlineDisplay = () => {
    const stageDeadline = deadlines[selectedStage];
    if (!stageDeadline || !stageDeadline.deadline) return null;
    const deadlineDate = new Date(stageDeadline.deadline);
    const now = new Date();
    const isPast = deadlineDate < now;

    return {
      dateStr: deadlineDate.toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
      }),
      isPast,
      isLocked: stageDeadline.isLocked,
    };
  };

  const deadlineInfo = getDeadlineDisplay();

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Predictions</h1>
        </div>

        {/* Stage Filter */}
        <div className="border-t">
          <div className="flex overflow-x-auto px-4 gap-2 py-3 scrollbar-hide">
            {stages.map((stage) => {
              const stageDeadline = deadlines[stage.id];
              const isLocked = stageDeadline?.isLocked ||
                (stageDeadline?.deadline && new Date(stageDeadline.deadline) < new Date());

              return (
                <button
                  key={stage.id}
                  onClick={() => setSelectedStage(stage.id)}
                  className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all flex items-center gap-1 ${
                    selectedStage === stage.id
                      ? 'bg-blue-500 text-white shadow-md'
                      : isLocked
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isLocked ? '\uD83D\uDD12' : '\u270F\uFE0F'} {stage.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Deadline Info */}
        {deadlineInfo && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
            deadlineInfo.isPast || deadlineInfo.isLocked
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
          }`}>
            {deadlineInfo.isPast || deadlineInfo.isLocked
              ? `\uD83D\uDD12 Deadline passed: ${deadlineInfo.dateStr}`
              : `\u23F0 Deadline: ${deadlineInfo.dateStr}`
            }
          </div>
        )}

        {/* Stage Stats for Locked/Completed Stages */}
        {stageStat && stageLocked && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm font-medium text-green-900">
              Stage total: {stageStat.totalPoints} pts from {stageStat.totalMatches} matches ({stageStat.completedMatches} completed)
            </div>
          </div>
        )}

        {/* Predictions Count */}
        <div className="mb-4 text-sm text-gray-600 font-medium">
          {filledPredictions}/{matches.length} predictions filled
        </div>

        {/* Matches */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <MatchSkeleton key={i} />
            ))}
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-3">
            {matches.map((match) => (
              <PredictionCard
                key={match.id}
                match={match}
                prediction={predictions[match.id] || null}
                onPredictionChange={handlePredictionChange}
                isLocked={stageLocked}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No matches found for this stage.</p>
          </div>
        )}
      </div>

      {/* Sticky Save Button */}
      {!stageLocked && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <button
              onClick={handleSavePredictions}
              disabled={saving || matches.length === 0}
              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                saving || matches.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md'
              }`}
            >
              {saving ? 'Saving...' : 'Save Predictions'}
            </button>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium z-50">
          Predictions saved!
        </div>
      )}

      {/* Error Toast */}
      {showError && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium z-50 max-w-xs text-center">
          {showError}
        </div>
      )}
    </div>
  );
}
