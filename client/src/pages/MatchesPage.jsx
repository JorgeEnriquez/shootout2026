import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

// Stages are loaded dynamically from the deadlines API (see useEffect below)

const STATUS_CONFIG = {
  upcoming: { badge: 'Upcoming', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
  in_progress: { badge: 'In Progress', bgColor: 'bg-green-100', textColor: 'text-green-700', pulse: true },
  completed: { badge: 'Completed', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
};

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

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }) + ' EST';
};

const formatDateHeader = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
};

const groupMatchesByDate = (matches) => {
  const grouped = {};
  matches.forEach((match) => {
    const dateKey = new Date(match.date).toISOString().split('T')[0];
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(match);
  });
  return grouped;
};

const MatchSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-4 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="flex justify-between items-center mb-4">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
    </div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
  </div>
);

const MatchCard = ({ match, prediction }) => {
  const status = match.status || 'upcoming';
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.upcoming;

  const homeTeamDisplay = match.homeTeam || 'TBD';
  const awayTeamDisplay = match.awayTeam || 'TBD';
  const homeFlag = getTeamFlag(homeTeamDisplay);
  const awayFlag = getTeamFlag(awayTeamDisplay);
  const isPlaceholder = !match.homeTeamName && !match.awayTeamName && (match.placeholderHome || match.placeholderAway);

  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-sm font-semibold text-gray-600">
            {match.matchNumber ? `Match ${match.matchNumber}` : match.stage}
          </div>
          <div className="text-xs text-gray-500">
            {match.stage}{match.groupLetter ? ` \u00B7 Group ${match.groupLetter}` : ''}
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.pulse ? 'animate-pulse' : ''}`}>
          {statusConfig.badge}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-right">
            <div className={`text-lg font-semibold ${isPlaceholder ? 'text-gray-400 text-sm' : 'text-gray-800'}`}>
              {homeFlag ? `${homeFlag} ` : ''}{homeTeamDisplay}
            </div>
          </div>
          {status === 'completed' ? (
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-gray-900">{match.homeScore}</span>
              <span className="text-gray-400">-</span>
              <span className="text-2xl font-bold text-gray-900">{match.awayScore}</span>
            </div>
          ) : (
            <div className="text-lg font-semibold text-gray-400">vs</div>
          )}
          <div className="flex-1">
            <div className={`text-lg font-semibold ${isPlaceholder ? 'text-gray-400 text-sm' : 'text-gray-800'}`}>
              {awayTeamDisplay}{awayFlag ? ` ${awayFlag}` : ''}
            </div>
          </div>
        </div>
      </div>

      {prediction && status === 'completed' && (
        <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
          Your prediction: {prediction.homeScore}-{prediction.awayScore}
        </div>
      )}

      <div className="border-t pt-3 space-y-1 text-sm text-gray-600">
        <div>{formatDateTime(match.date)}</div>
        {match.venue && <div className="text-xs text-gray-500">{match.venue}</div>}
      </div>
    </div>
  );
};

export default function MatchesPage() {
  const { user } = useAuth();
  const [stages, setStages] = useState([]);
  const [selectedStage, setSelectedStage] = useState('all');
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = React.useRef(null);

  // Fetch stages from deadlines API on mount
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const data = await api.getDeadlines();
        const stageList = [{ id: 'all', label: 'All' }];
        data.forEach(d => {
          stageList.push({ id: d.stage, label: d.stage });
        });
        setStages(stageList);
      } catch (error) {
        console.error('Error fetching stages:', error);
      }
    };
    fetchStages();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const stageParam = selectedStage === 'all' ? undefined : selectedStage;
        const [matchesData, predictionsData] = await Promise.all([
          api.getMatches(stageParam),
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

  const renderMatches = () => {
    if (selectedStage === 'all') {
      const grouped = groupMatchesByDate(matches);
      return Object.keys(grouped)
        .sort()
        .map((dateKey) => (
          <div key={dateKey}>
            <div className="sticky top-0 bg-gray-50 px-4 py-3 border-t border-gray-200">
              <h3 className="font-semibold text-gray-700">{formatDateHeader(grouped[dateKey][0].date)}</h3>
            </div>
            <div className="space-y-3 p-4">
              {grouped[dateKey].map((match) => (
                <MatchCard key={match.id} match={match} prediction={predictions[match.id]} />
              ))}
            </div>
          </div>
        ));
    }

    return (
      <div className="space-y-3 p-4">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} prediction={predictions[match.id]} />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-8">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Match Schedule</h1>
        </div>

        {/* Stage Filter */}
        <div className="border-t">
          <div ref={scrollContainerRef} className="flex overflow-x-auto px-4 gap-2 py-3 scrollbar-hide">
            {stages.map((stage) => (
              <button
                key={stage.id}
                onClick={() => setSelectedStage(stage.id)}
                className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                  selectedStage === stage.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {stage.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="space-y-3 p-4">
            {[...Array(6)].map((_, i) => (
              <MatchSkeleton key={i} />
            ))}
          </div>
        ) : matches.length > 0 ? (
          renderMatches()
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No matches found for this stage.</p>
          </div>
        )}
      </div>
    </div>
  );
}
