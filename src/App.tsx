import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landingpage';
import SocialPage from './pages/social';
import LearnPage from './pages/learn';
import MarketPage from './pages/market';
import PuzzlePage from './pages/puzzle';
import SettingsPage from './pages/settings';

function App() {
 return (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/social" element={<SocialPage />} />
    <Route path="/learn" element={<LearnPage />} />
    <Route path="/market" element={<MarketPage />} />
    <Route path="/puzzle" element={<PuzzlePage />} />
    <Route path="/settings" element={<SettingsPage />} />
  </Routes>
 );
}
export default App
