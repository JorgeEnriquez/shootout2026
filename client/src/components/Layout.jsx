import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ShootOutLogo from '../assets/shootout-logo.png';

const NAVIGATION_ITEMS = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/matches', label: 'Matches', icon: '⚽' },
  { path: '/predictions', label: 'Predictions', icon: '📝' },
  { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { path: '/prize-pool', label: 'Prizes', icon: '💰' },
];

const ADMIN_NAV_ITEM = { path: '/admin', label: 'Admin', icon: '⚙️' };

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = user?.role === 'admin' ? [...NAVIGATION_ITEMS, ADMIN_NAV_ITEM] : NAVIGATION_ITEMS;

  const isActive = (path) => location.pathname === path;

  const handleNavClick = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f7fa] to-[#e8ecf1] flex flex-col md:flex-row">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Branding */}
            <div className="flex items-center gap-3">
              <img src={ShootOutLogo} alt="shoot-out" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 lowercase tracking-tight">
                shoot-out
              </h1>
            </div>

            {/* Right: User info and Logout */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-sm font-medium text-gray-800">{user?.display_name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile: Show display name */}
          <div className="sm:hidden mt-2">
            <p className="text-xs text-gray-600">{user?.display_name}</p>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar (md and up) */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200 shadow-sm">
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Desktop Profile Section */}
        <div className="border-t border-gray-200 p-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-800">{user?.display_name}</p>
            <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pb-20 md:pb-0">
        <div className="flex-1 p-4 sm:p-6">
          {children}
        </div>
      </main>

      {/* Bottom Navigation (Mobile only) */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 shadow-lg">
        <div className="flex">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 transition-colors duration-200 ${
                isActive(item.path)
                  ? 'text-blue-500 border-t-2 border-blue-500 pt-2 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
