import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import shootOutLogo from '../assets/shootout-logo.png';

const SUGGESTIONS = [
  'MapleMessiXX',
  'PoutinePredictor',
  '6ixKicker',
  'EhTeamCapitan',
  'BeaverBelieving'
];

export default function DisplayNameSetup() {
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateDisplayName } = useAuth();
  const navigate = useNavigate();

  const handleSuggestionClick = (suggestion) => {
    setDisplayName(suggestion);
    setError('');
  };

  const validateDisplayName = (name) => {
    if (name.length < 3) {
      return 'Display name must be at least 3 characters';
    }
    if (name.length > 20) {
      return 'Display name must be no more than 20 characters';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateDisplayName(displayName);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);

    try {
      await updateDisplayName(displayName);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to set display name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const charCount = displayName.length;
  const isValidLength = charCount >= 3 && charCount <= 20;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Beaver Logo */}
          <div className="flex justify-center mb-6">
            <img
              src={shootOutLogo}
              alt="shoot-out beaver"
              className="h-28 w-auto"
            />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Welcome to shoot-out!
          </h1>

          {/* Subtext */}
          <p className="text-center text-gray-600 text-sm mb-8 leading-relaxed">
            Before you start predicting, pick a fun display name. This is what everyone will see on the leaderboard.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display Name Input */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setError('');
                }}
                placeholder="e.g. GoalDigger_TO, VARYouSerious..."
                maxLength="20"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs font-medium ${charCount > 0 ? (isValidLength ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                  {charCount}/20 characters
                </span>
                {error && (
                  <span className="text-xs text-red-600">
                    {error}
                  </span>
                )}
              </div>
            </div>

            {/* Suggestion Chips */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-3 block">
                Or pick a suggestion:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition duration-200 border ${
                      displayName === suggestion
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isValidLength}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:cursor-not-allowed mt-8"
            >
              {loading ? 'Setting up...' : "Let's Go!"}
            </button>
          </form>

          {/* General Error Message */}
          {error && charCount === 0 && (
            <p className="mt-4 text-sm text-red-600 text-center font-medium">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
