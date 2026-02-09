import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landingpage';
import SocialPage from './pages/social';
import LearnPage from './pages/learn';
import MarketPage from './pages/market/market';
import PuzzlePage from './pages/puzzle';
import SettingsPage from './pages/settings';
import Profile from './pages/profile';
{/* Auth*/ }
import Login from './auth/login';
import Register from './auth/signup';


{/* Game */ }
import Board from './pages/game/gametypes/practice';
import GameSetup from './pages/game/gameSetup';
import Multiplayer from './pages/game/gametypes/multiplayer';
import GuestMatchmaking from './pages/game/guestMatchmaking';
import Matchmaking from './pages/game/matchmaking';

{/* Admin Dashboard */ }
import Dashboard from './pages/admin/dashboard';
import UserManagement from './pages/admin/manage-user';
import ItemManagement from './pages/admin/manage-market';
import OrderManagement from './pages/admin/manage-orders';
import ProtectedRoute from './components/ProtectedRoute';

{/* Under Testing */ }
import UnderTesting from './UnderTesting';

import GlobalInviteHandler from './components/GlobalInviteHandler';
import SessionTimeout from './components/SessionTimeout';

const IS_MAINTENANCE_MODE = true;

function App() {
  const isAdmin = localStorage.getItem('site_bypass') === 'true';
  if (IS_MAINTENANCE_MODE && !isAdmin) {
    return <UnderTesting />;
  }
  return (
    <>
      <GlobalInviteHandler />
      <SessionTimeout />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/social" element={<SocialPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/puzzle" element={<PuzzlePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<Profile />} />

        {/* Auth*/}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Game */}
        <Route path="/board" element={<Board />} />
        <Route path="/game" element={<GameSetup />} />
        <Route path="/multiplayer/:matchId" element={<Multiplayer />} />
        <Route path="/guest-matchmaking" element={<GuestMatchmaking />} />
        <Route path="/matchmaking" element={<Matchmaking />} />

        {/* Admin Dashboard */}
        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/items" element={<ItemManagement />} />
          <Route path="/admin/orders" element={<OrderManagement />} />
        </Route>

        <Route path="*" element={
          <div className="flex flex-col items-center justify-center min-h-screen bg-[#262522] text-white">
            <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
            <p className="text-gray-400 mb-8">The page you are looking for does not exist.</p>
            <a href="/" className="px-6 py-3 bg-[#e63e3e] rounded-lg font-bold hover:bg-[#ff4f4f] transition-colors">
              Go Home
            </a>
          </div>
        } />
      </Routes>
    </>
  );
}
export default App