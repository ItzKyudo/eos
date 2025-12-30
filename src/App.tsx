import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landingpage';
import SocialPage from './pages/social';
import LearnPage from './pages/learn';
import MarketPage from './pages/market/market';
import PuzzlePage from './pages/puzzle';
import SettingsPage from './pages/settings';
import Profile from './pages/profile';
    {/* Auth*/}
import Login from './auth/login';
import Register from './auth/signup';


  {/* Game */}
import Board from './pages/game/gametypes/practice';
import GameSetup from './pages/game/gameSetup';
import Multiplayer from './pages/game/gametypes/multiplayer';
import Lobby from './pages/game/lobby';

function App() {
 return (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/social" element={<SocialPage />} />
    <Route path="/learn" element={<LearnPage />} />
    <Route path="/market" element={<MarketPage />} />
    <Route path="/puzzle" element={<PuzzlePage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="/profile" element={<Profile />} />

    {/* Auth*/}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    {/* Game */}
    <Route path="/board" element={<Board />} />
    <Route path="/game" element={<GameSetup />} />
    <Route path="/lobby" element={<Lobby />} />
    <Route path="/multiplayer" element={<Multiplayer />} />
  </Routes>
 );
}
export default App
