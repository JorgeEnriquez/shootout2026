const API_BASE = '/api';

// Utility: convert snake_case string to camelCase
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

// Recursively convert all snake_case keys in an object/array to camelCase
function convertKeysToCamel(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(item => convertKeysToCamel(item));
  if (typeof obj !== 'object') return obj;
  const converted = {};
  for (const [key, value] of Object.entries(obj)) {
    converted[snakeToCamel(key)] = convertKeysToCamel(value);
  }
  return converted;
}

// Normalize match object: add friendly aliases for frontend use
function normalizeMatch(m) {
  return {
    ...m,
    id: m.matchId,
    date: m.matchDatetime,
    homeTeam: m.homeTeamName || m.placeholderHome || 'TBD',
    awayTeam: m.awayTeamName || m.placeholderAway || 'TBD',
  };
}

// Normalize prediction object: map predictedHomeScore → homeScore etc.
function normalizePrediction(p) {
  return {
    ...p,
    homeScore: p.predictedHomeScore,
    awayScore: p.predictedAwayScore,
  };
}

// Normalize user object: add backward-compat aliases
function normalizeUser(u) {
  return {
    ...u,
    id: u.userId,
    display_name: u.displayName,
    first_login_complete: u.firstLoginComplete,
    status: u.isActive ? 'active' : 'inactive',
  };
}

function getToken() {
  return localStorage.getItem('token');
}

function headers(extra = {}) {
  const h = { 'Content-Type': 'application/json', ...extra };
  const token = getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function request(method, path, body) {
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return convertKeysToCamel(data);
}

export const api = {
  // Auth - normalize user objects in responses
  register: async (email, password) => {
    const data = await request('POST', '/auth/register', { email, password });
    return { ...data, user: normalizeUser(data.user) };
  },
  login: async (email, password) => {
    const data = await request('POST', '/auth/login', { email, password });
    return { ...data, user: normalizeUser(data.user) };
  },
  setDisplayName: async (display_name) => {
    const data = await request('POST', '/auth/display-name', { display_name });
    return { ...data, user: normalizeUser(data.user) };
  },
  getMe: async () => {
    const data = await request('GET', '/auth/me');
    return { ...data, user: normalizeUser(data.user) };
  },

  // Matches - normalize match objects
  getMatches: async (stage) => {
    const data = await request('GET', `/matches${stage ? `?stage=${encodeURIComponent(stage)}` : ''}`);
    return Array.isArray(data) ? data.map(normalizeMatch) : [];
  },
  getMatch: async (id) => {
    const data = await request('GET', `/matches/${id}`);
    return normalizeMatch(data);
  },

  // Predictions - normalize and convert for POST
  submitPredictions: (predictions) => {
    // Convert frontend camelCase field names to backend snake_case
    const converted = predictions.map(p => ({
      match_id: parseInt(p.matchId),
      predicted_home_score: parseInt(p.homeScore),
      predicted_away_score: parseInt(p.awayScore),
    }));
    return request('POST', '/predictions', { predictions: converted });
  },
  getMyPredictions: async () => {
    const data = await request('GET', '/predictions/mine');
    return Array.isArray(data) ? data.map(normalizePrediction) : [];
  },
  getAllPredictions: async () => {
    const data = await request('GET', '/predictions/all');
    return Array.isArray(data) ? data.map(normalizePrediction) : [];
  },
  getUserPredictions: async (userId) => {
    const data = await request('GET', `/predictions/user/${userId}`);
    return Array.isArray(data) ? data.map(normalizePrediction) : [];
  },

  // Leaderboard - returns array directly, add aliases
  getLeaderboard: async () => {
    const data = await request('GET', '/leaderboard');
    if (!Array.isArray(data)) return [];
    return data.map(entry => ({
      ...entry,
      display_name: entry.displayName,
      total_points: entry.totalPoints,
      exact_scores: entry.exactCount,
      correct_results: entry.correctCount,
      user_id: entry.userId,
    }));
  },

  // Prize Pool - add backward-compat aliases
  getPrizePool: async () => {
    const data = await request('GET', '/prize-pool');
    return {
      ...data,
      total_prize_pool: data.totalJackpot,
      participant_count: data.participantCount,
      prize_per_person: data.prizePerPerson,
    };
  },

  // Deadlines
  getDeadlines: async () => {
    const data = await request('GET', '/deadlines');
    if (!Array.isArray(data)) return [];
    return data.map(d => ({
      ...d,
      stage: d.stage,
      deadline_datetime: d.deadlineDatetime,
      is_locked: d.isLocked,
    }));
  },

  // Admin
  createUser: (email, password) => request('POST', '/admin/users', { email, password }),
  getUsers: async () => {
    const data = await request('GET', '/admin/users');
    return Array.isArray(data) ? data.map(normalizeUser) : [];
  },
  updateUser: (id, data) => request('PUT', `/admin/users/${id}`, data),
  enterResult: (matchId, homeScore, awayScore) =>
    request('POST', `/admin/matches/${matchId}/result`, { home_score: parseInt(homeScore), away_score: parseInt(awayScore) }),
  recalculateScores: () => request('POST', '/admin/scores/recalculate'),
  updateDeadline: (stage, data) => request('PUT', `/admin/deadlines/${encodeURIComponent(stage)}`, data),
};

export function setToken(token) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}
