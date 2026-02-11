import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DisplayNameSetup from './pages/DisplayNameSetup';
import Dashboard from './pages/Dashboard';
import MatchesPage from './pages/MatchesPage';
import PredictionsPage from './pages/PredictionsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import PrizePoolPage from './pages/PrizePoolPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import UserProfilePage from './pages/UserProfilePage';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#f5f7fa] to-[#e8ecf1]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Not logged in
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Logged in but needs display name setup
  if (user.first_login_complete === 0) {
    return (
      <Routes>
        <Route path="/setup" element={<DisplayNameSetup />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    );
  }

  const isAdmin = user.role === 'admin';

  // Fully logged in
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/setup" element={<Navigate to="/" replace />} />

      <Route path="/" element={<Layout><Dashboard /></Layout>} />
      <Route path="/matches" element={<Layout><MatchesPage /></Layout>} />
      <Route path="/predictions" element={<Layout><PredictionsPage /></Layout>} />
      <Route path="/leaderboard" element={<Layout><LeaderboardPage /></Layout>} />
      <Route path="/prize-pool" element={<Layout><PrizePoolPage /></Layout>} />
      <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
      <Route path="/user/:userId" element={<Layout><UserProfilePage /></Layout>} />

      {isAdmin && (
        <Route path="/admin" element={<Layout><AdminPage /></Layout>} />
      )}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
