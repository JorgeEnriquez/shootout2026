import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

// Loading skeleton component
function SkeletonLoader({ className = 'h-12 w-full' }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;
}

// Tab Navigation
function TabNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'results', label: 'Results', icon: '⚽' },
    { id: 'deadlines', label: 'Deadlines', icon: '⏰' },
  ];

  return (
    <div className="border-b border-gray-200 bg-white rounded-t-xl">
      <div className="flex gap-8 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 px-2 font-medium transition relative ${
              activeTab === tab.id
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              {tab.icon} {tab.label}
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Users Tab Component
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [togglingUser, setTogglingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getUsers();
      setUsers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setCreatingUser(true);
      setError(null);
      await api.createUser(formData.email, formData.password);
      setSuccess('User created successfully!');
      setFormData({ email: '', password: '' });
      setShowCreateForm(false);
      setTimeout(() => setSuccess(null), 3000);
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      setTogglingUser(userId);
      setError(null);
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await api.updateUser(userId, { status: newStatus });
      setSuccess(`User ${newStatus} successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user status');
    } finally {
      setTogglingUser(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-900">
          <span className="font-semibold">Total Users:</span> {users.length}
        </p>
      </div>

      {/* Create User Button */}
      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
        >
          + Create User
        </button>
      )}

      {/* Create User Form */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Create New User</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Generated or enter manually"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, password: generatePassword() })
                  }
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium rounded-lg transition"
                >
                  Generate
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Click Generate to create a random password
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ email: '', password: '' });
                  setError(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingUser}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition"
              >
                {creatingUser ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <SkeletonLoader key={i} className="h-12" />
            ))}
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Display Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-b border-gray-100 transition ${
                      index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.display_name || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.status)}
                        disabled={togglingUser === user.id}
                        className={`px-3 py-1 rounded font-medium text-xs transition ${
                          user.status === 'active'
                            ? 'bg-red-100 hover:bg-red-200 text-red-700'
                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                        } disabled:opacity-50`}
                      >
                        {togglingUser === user.id
                          ? 'Updating...'
                          : user.status === 'active'
                            ? 'Deactivate'
                            : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">No users found</div>
        )}
      </div>
    </div>
  );
}

// Results Tab Component
function ResultsTab() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingMatch, setEditingMatch] = useState(null);
  const [savingMatch, setSavingMatch] = useState(null);
  const [scores, setScores] = useState({});
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMatches();
      setMatches(data || []);
      // Initialize scores
      const initialScores = {};
      data.forEach((m) => {
        initialScores[m.id] = {
          home_score: m.homeScore !== null ? m.homeScore : '',
          away_score: m.awayScore !== null ? m.awayScore : '',
        };
      });
      setScores(initialScores);
    } catch (err) {
      setError(err.message || 'Failed to load matches');
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResult = async (matchId) => {
    const matchScores = scores[matchId];
    if (matchScores.home_score === '' || matchScores.away_score === '') {
      setError('Please enter both scores');
      return;
    }

    try {
      setSavingMatch(matchId);
      setError(null);
      await api.enterResult(matchId, matchScores.home_score, matchScores.away_score);
      setSuccess('Result saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setEditingMatch(null);
      await fetchMatches();
    } catch (err) {
      setError(err.message || 'Failed to save result');
    } finally {
      setSavingMatch(null);
    }
  };

  const handleRecalculateScores = async () => {
    if (
      !window.confirm(
        'Are you sure you want to recalculate all scores? This may take a moment.'
      )
    ) {
      return;
    }

    try {
      setRecalculating(true);
      setError(null);
      await api.recalculateScores();
      setSuccess('All scores recalculated successfully!');
      setTimeout(() => setSuccess(null), 3000);
      await fetchMatches();
    } catch (err) {
      setError(err.message || 'Failed to recalculate scores');
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Recalculate Button */}
      <button
        onClick={handleRecalculateScores}
        disabled={recalculating}
        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-medium rounded-lg transition"
      >
        {recalculating ? 'Recalculating...' : '🔄 Recalculate All Scores'}
      </button>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Matches List */}
      <div className="space-y-4">
        {loading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <SkeletonLoader key={i} className="h-20" />
            ))}
          </>
        ) : matches.length > 0 ? (
          matches.map((match) => (
            <div
              key={match.id}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                    {match.stage}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    {match.homeTeam} vs {match.awayTeam}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(match.date).toLocaleString()}
                  </p>
                </div>

                {editingMatch === match.id ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={scores[match.id]?.home_score || ''}
                      onChange={(e) =>
                        setScores({
                          ...scores,
                          [match.id]: {
                            ...scores[match.id],
                            home_score: e.target.value,
                          },
                        })
                      }
                      className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <span className="py-2 font-bold text-gray-900">-</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={scores[match.id]?.away_score || ''}
                      onChange={(e) =>
                        setScores({
                          ...scores,
                          [match.id]: {
                            ...scores[match.id],
                            away_score: e.target.value,
                          },
                        })
                      }
                      className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingMatch(null)}
                        className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium rounded-lg transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveResult(match.id)}
                        disabled={savingMatch === match.id}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition"
                      >
                        {savingMatch === match.id ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    {match.homeScore !== null && match.awayScore !== null ? (
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">
                          {match.homeScore}-{match.awayScore}
                        </p>
                        <p className="text-xs text-green-600 font-semibold mt-1">
                          ✓ Result set
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-2xl text-gray-400">—</p>
                        <p className="text-xs text-gray-500 mt-1">No result</p>
                      </div>
                    )}
                    <button
                      onClick={() => setEditingMatch(match.id)}
                      className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">No matches found</div>
        )}
      </div>
    </div>
  );
}

// Deadlines Tab Component
function DeadlinesTab() {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingStage, setEditingStage] = useState(null);
  const [savingStage, setSavingStage] = useState(null);
  const [deadlineData, setDeadlineData] = useState({});

  useEffect(() => {
    fetchDeadlines();
  }, []);

  const fetchDeadlines = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDeadlines();
      setDeadlines(data);
      const initialData = {};
      data.forEach((d) => {
        initialData[d.stage] = {
          deadline: d.deadline_datetime,
          is_locked: d.is_locked === 1,
        };
      });
      setDeadlineData(initialData);
    } catch (err) {
      setError(err.message || 'Failed to load deadlines');
      console.error('Error fetching deadlines:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDeadline = async (stage) => {
    try {
      setSavingStage(stage);
      setError(null);
      await api.updateDeadline(stage, deadlineData[stage]);
      setSuccess(`${stage} deadline updated successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      setEditingStage(null);
      await fetchDeadlines();
    } catch (err) {
      setError(err.message || 'Failed to update deadline');
    } finally {
      setSavingStage(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Deadlines List */}
      <div className="space-y-4">
        {loading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <SkeletonLoader key={i} className="h-20" />
            ))}
          </>
        ) : deadlines.length > 0 ? (
          deadlines.map((item) => (
            <div
              key={item.stage}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    {item.stage}
                  </p>
                  {!editingStage || editingStage !== item.stage ? (
                    <>
                      <p className="text-sm text-gray-600 mb-2">
                        {new Date(deadlineData[item.stage]?.deadline).toLocaleString()}
                      </p>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          deadlineData[item.stage]?.is_locked
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {deadlineData[item.stage]?.is_locked ? 'Locked' : 'Unlocked'}
                      </span>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Deadline
                        </label>
                        <input
                          type="datetime-local"
                          value={
                            deadlineData[item.stage]?.deadline?.substring(0, 16) || ''
                          }
                          onChange={(e) =>
                            setDeadlineData({
                              ...deadlineData,
                              [item.stage]: {
                                ...deadlineData[item.stage],
                                deadline: e.target.value,
                              },
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={deadlineData[item.stage]?.is_locked || false}
                          onChange={(e) =>
                            setDeadlineData({
                              ...deadlineData,
                              [item.stage]: {
                                ...deadlineData[item.stage],
                                is_locked: e.target.checked,
                              },
                            })
                          }
                          className="rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Lock this stage
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {editingStage === item.stage ? (
                    <>
                      <button
                        onClick={() => setEditingStage(null)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium rounded-lg transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveDeadline(item.stage)}
                        disabled={savingStage === item.stage}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition"
                      >
                        {savingStage === item.stage ? 'Saving...' : 'Save'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditingStage(item.stage)}
                      className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">No deadlines found</div>
        )}
      </div>
    </div>
  );
}

// Main AdminPage Component
export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Access Denied</h2>
            <p className="text-red-700">You must be an admin to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage users, match results, and deadlines</p>
        </div>

        {/* Tabbed Interface */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />

          <div className="p-6">
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'results' && <ResultsTab />}
            {activeTab === 'deadlines' && <DeadlinesTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
