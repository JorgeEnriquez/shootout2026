import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

// Loading skeleton component
function SkeletonLoader({ className = 'h-12 w-full' }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;
}

export default function ProfilePage() {
  const { user, updateDisplayName, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user?.display_name || '');
  const [savingName, setSavingName] = useState(false);
  const [stats, setStats] = useState({
    totalPoints: 0,
    currentRank: null,
    exactScorePredictions: 0,
    correctResultPredictions: 0,
    totalPredictions: 0,
    predictionAccuracy: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        const [predictions, leaderboard] = await Promise.all([
          api.getMyPredictions(),
          api.getLeaderboard(),
        ]);

        // Find user in leaderboard
        const userInLeaderboard = leaderboard?.find(
          (entry) => entry.user_id === user?.id
        );

        // Calculate prediction stats
        const exactScores = predictions.filter(
          (p) => p.pointsEarned && p.scoringType === 'exact'
        ).length;
        const correctResults = predictions.filter(
          (p) => p.pointsEarned && p.scoringType === 'correct'
        ).length;
        const totalWithPoints = predictions.filter((p) => p.pointsEarned).length;
        const accuracy =
          predictions.length > 0
            ? Math.round((totalWithPoints / predictions.length) * 100)
            : 0;

        setStats({
          totalPoints: userInLeaderboard?.total_points || 0,
          currentRank: userInLeaderboard?.rank || null,
          exactScorePredictions: exactScores,
          correctResultPredictions: correctResults,
          totalPredictions: predictions.length,
          predictionAccuracy: accuracy,
        });
      } catch (err) {
        setError(err.message || 'Failed to load profile stats');
        console.error('Profile error:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      fetchStats();
    }
  }, [user?.id]);

  const handleSaveDisplayName = async () => {
    if (!newDisplayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    try {
      setSavingName(true);
      setError(null);
      await updateDisplayName(newDisplayName.trim());
      setSuccess('Display name updated successfully!');
      setEditingName(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update display name');
    } finally {
      setSavingName(false);
    }
  };

  const handleCancel = () => {
    setNewDisplayName(user?.display_name || '');
    setEditingName(false);
    setError(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">Not Logged In</h2>
            <p className="text-yellow-700">Please log in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user?.display_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {user?.display_name || 'Player'}
              </h1>
              <p className="text-gray-600 mb-2">{user?.email}</p>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user?.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {user?.role === 'admin' ? '👑 Admin' : 'Participant'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Display Name Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Display Name</h2>

          {!editingName ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-2">Current Display Name</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user?.display_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingName(true);
                  setNewDisplayName(user?.display_name || '');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
              >
                Edit
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Display Name
                </label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your display name"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDisplayName}
                  disabled={savingName}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition"
                >
                  {savingName ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* My Stats Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Stats</h2>

          {loading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <SkeletonLoader key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Total Points Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-600 text-sm font-medium mb-2">Total Points</p>
                <p className="text-4xl font-bold text-blue-600 mb-1">
                  {stats.totalPoints}
                </p>
                <p className="text-xs text-gray-500">
                  Points earned from predictions
                </p>
              </div>

              {/* Current Rank Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-600 text-sm font-medium mb-2">Current Rank</p>
                {stats.currentRank ? (
                  <>
                    <p className="text-4xl font-bold text-amber-600 mb-1">
                      #{stats.currentRank}
                    </p>
                    <p className="text-xs text-gray-500">
                      Out of all participants
                    </p>
                  </>
                ) : (
                  <p className="text-2xl text-gray-400">—</p>
                )}
              </div>

              {/* Exact Score Predictions Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-600 text-sm font-medium mb-2">
                  Exact Score Predictions
                </p>
                <p className="text-4xl font-bold text-emerald-600 mb-1">
                  {stats.exactScorePredictions}
                </p>
                <p className="text-xs text-gray-500">
                  Correct exact score predictions
                </p>
              </div>

              {/* Correct Result Predictions Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-600 text-sm font-medium mb-2">
                  Correct Results
                </p>
                <p className="text-4xl font-bold text-cyan-600 mb-1">
                  {stats.correctResultPredictions}
                </p>
                <p className="text-xs text-gray-500">
                  Correct result predictions
                </p>
              </div>

              {/* Total Predictions Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-600 text-sm font-medium mb-2">
                  Total Predictions
                </p>
                <p className="text-4xl font-bold text-indigo-600 mb-1">
                  {stats.totalPredictions}
                </p>
                <p className="text-xs text-gray-500">
                  Predictions made so far
                </p>
              </div>

              {/* Prediction Accuracy Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-600 text-sm font-medium mb-2">
                  Prediction Accuracy
                </p>
                <p className="text-4xl font-bold text-orange-600 mb-1">
                  {stats.predictionAccuracy}%
                </p>
                <p className="text-xs text-gray-500">
                  Percentage of predictions earning points
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Password</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 text-sm">
              To reset your password, please contact the administrator. They can help you set a new password for your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
