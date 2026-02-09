import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Play, Settings,
  Handshake, ArrowRight, Check, Target,
  History, Users
} from 'lucide-react';
import LoginModal from './loginmodal';
import FriendsList from './profile/FriendsList';
import { GameMode } from '../pages/game/gameSetup';

// --- TYPES ---
type TimeControl = number;
type TabType = 'new' | 'history' | 'friends';

// --- PROPS INTERFACE ---
interface RightPanelProps {
  gameModes?: GameMode[];
  isLoading?: boolean;
  onlineCount?: number; // <--- Added prop
}

// --- MOCK DATA ---
// REMOVED MOCK DATA
// const MOCK_HISTORY = [...]

const RightPanel: React.FC<RightPanelProps> = ({ gameModes = [], isLoading = false, onlineCount = 0 }) => {
  const navigate = useNavigate();
  const [selectedTime, setSelectedTime] = useState<TimeControl>(600);
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'history') {
      const fetchHistory = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
          const res = await fetch('https://eos-server-jxy0.onrender.com/api/profile/history?limit=5', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            // Simple efficient formatter
            const now = new Date();
            const processed = data.map((g: any) => {
              const d = new Date(g.date);
              const diffHrs = Math.floor((now.getTime() - d.getTime()) / 3600000);
              const dateStr = diffHrs < 24 ? `${diffHrs}h ago` : diffHrs < 48 ? '1d ago' : d.toLocaleDateString();
              return { ...g, date: dateStr, type: g.gameType };
            });
            setHistory(processed);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchHistory();
    }
  }, [activeTab]);
  useEffect(() => {
    if (!isLoading && gameModes.length > 0) {
      const modeExists = gameModes.some(m => m.duration_minutes * 60 === selectedTime);
      if (!modeExists) {
        setSelectedTime(gameModes[0].duration_minutes * 60);
      }
    }
  }, [gameModes, isLoading, selectedTime]);

  const startGame = (mode: string = 'multiplayer') => {
    const token = localStorage.getItem('token');

    if (mode === 'multiplayer') {
      if (token) {
        navigate(`/matchmaking?time=${selectedTime}`);
      } else {
        setShowLoginModal(true);
      }
    }
    else if (mode === 'practice') navigate(`/board?time=${selectedTime}`);
    else if (mode === 'friend') navigate(`/board?mode=friend&time=${selectedTime}`);
    else navigate(`/board?mode=${mode}&time=${selectedTime}`);
  };

  // --- RENDER HELPERS ---

  const renderNewGame = () => (
    <>
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Time Control</h2>
          <span className="text-white font-bold text-sm bg-white/5 px-2 py-0.5 rounded">
            {selectedTime / 60} min
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {isLoading ? (
            // Skeleton loader
            <>
              <div className="h-24 bg-white/5 rounded-xl animate-pulse"></div>
              <div className="h-24 bg-white/5 rounded-xl animate-pulse"></div>
              <div className="h-24 bg-white/5 rounded-xl animate-pulse"></div>
            </>
          ) : (
            gameModes.map((mode) => (
              <TimeCard
                key={mode.game_mode_id}
                minutes={String(mode.duration_minutes)}
                type={mode.title}
                active={selectedTime === mode.duration_minutes * 60}
                onClick={() => setSelectedTime((mode.duration_minutes * 60) as TimeControl)}
                icon={<Clock size={18} />}
              />
            ))
          )}

          {/* Fallback if no modes found */}
          {!isLoading && gameModes.length === 0 && (
            <div className="col-span-3 text-center text-xs text-gray-500 py-4 border border-dashed border-white/10 rounded-xl">
              No game modes available
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-white/5 w-full my-2" />

      <button
        onClick={() => startGame()}
        className="
          group w-full relative overflow-hidden rounded-xl
          bg-gradient-to-r from-[#D63031] to-[#b02526]
          hover:from-[#e84546] hover:to-[#c92d2e]
          text-white 
          shadow-[0_6px_0_#7f1d1d]
          active:shadow-none active:translate-y-[6px]
          transition-all duration-150 ease-out
          flex items-center justify-center py-6
        "
      >
        <div className="relative z-10 flex items-center gap-3 pointer-events-none">
          <Play size={32} fill="currentColor" className="drop-shadow-md shrink-0" />
          <span className="text-2xl font-black uppercase tracking-tight drop-shadow-md leading-none pb-1">
            Play
          </span>
        </div>
        <div className="absolute inset-0 -translate-x-full group-hover:animate-shine bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 transition-all" />
      </button>

      <div className="text-center">
        <p className="text-xs text-gray-500 font-medium">Auto-matching based on rating</p>
      </div>

      <div className="h-px bg-white/5 w-full my-2" />

      <div className="space-y-3">
        <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Other Modes</h2>
        <div className="flex flex-col gap-3">
          <MenuButton
            icon={<Target size={20} />}
            title="Practice Mode"
            subtitle="Solo or local multiplayer"
            onClick={() => startGame('practice')}
          />
          <MenuButton
            icon={<Settings size={20} />}
            title="Custom Challenge"
            subtitle="Create custom rules"
            onClick={() => startGame('custom')}
          />
          <MenuButton
            icon={<Handshake size={20} />}
            title="Play a Friend"
            subtitle="Invite via link"
            onClick={() => navigate('/board?mode=friend')}
          />
        </div>
      </div>
    </>
  );

  const renderHistory = () => (
    <div className="space-y-4">
      <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Recent Matches</h2>
      <div className="flex flex-col gap-2">
        {history.length === 0 ? <div className="text-center text-gray-600 text-xs py-4">No recent games</div> : history.map((game) => (
          <div key={game.id} className="bg-[#0f172a] p-3 rounded-xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white
                ${game.result === 'win' ? 'bg-green-500/20 text-green-500' :
                  game.result === 'loss' ? 'bg-red-500/20 text-red-500' : 'bg-gray-500/20 text-gray-400'}
              `}>
                {game.result === 'win' ? 'W' : game.result === 'loss' ? 'L' : 'D'}
              </div>
              <div
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/profile/${game.opponentId}`)}
              >
                <div className="text-sm font-bold text-gray-200 flex items-center gap-2">
                  {game.opponent}
                  {(game.userScore !== undefined && game.opponentScore !== undefined) && (
                    <span className="text-xs text-gray-400 bg-white/5 px-1.5 rounded">{game.userScore}-{game.opponentScore}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">{game.type} • {game.date}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate('/profile?tab=games')}
        className="w-full py-3 text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-white hover:bg-white/5 rounded-xl transition-colors"
      >
        View Full History
      </button>
    </div>
  );

  const renderFriends = () => (
    <div className="space-y-4">
      <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Friends Online</h2>
      <FriendsList limit={10} showInvite={true} selectedTime={selectedTime} />

      <div className="pt-4 border-t border-white/5">
        <button
          onClick={() => navigate('/social')}
          className="w-full py-3 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-sm rounded-xl transition-colors">
          <Users size={16} />
          <span>Find Friends</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full lg:w-[420px] bg-[#1e293b] flex flex-col border-l border-white/5 z-20 shadow-2xl relative">

      {/* TABS */}
      <div className="p-4 border-b border-white/5 bg-[#0f172a]/50 backdrop-blur-sm">
        <div className="flex bg-[#0f172a] p-1 rounded-xl border border-white/5">
          {[
            { id: 'new', label: 'New Game', icon: <Play size={14} /> },
            { id: 'history', label: 'History', icon: <History size={14} /> },
            { id: 'friends', label: 'Friends', icon: <Users size={14} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`
                        flex-1 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2
                        ${activeTab === tab.id
                  ? 'bg-[#09357A] text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-[#1e293b]'}
                    `}
            >
              <span className="hidden sm:inline">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* PANEL CONTENT - DYNAMIC */}
      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        {activeTab === 'new' && renderNewGame()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'friends' && renderFriends()}
      </div>

      {/* FOOTER STATS */}
      <div className="bg-[#0f172a] p-4 border-t border-white/5 flex justify-between items-center text-[10px] md:text-xs text-white/30 font-bold tracking-wider">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#D63031] shadow-[0_0_8px_rgba(214,48,49,0.5)]"></span>
          <span>{onlineCount.toLocaleString()} ONLINE</span>
        </div>
        <div className="flex items-center gap-1 opacity-50">
          <span>EOS CLUB</span>
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        selectedTime={selectedTime}
      />
    </div>
  );
};

// --- SUB-COMPONENTS ---
const TimeCard: React.FC<{
  minutes: string;
  type: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}> = ({ minutes, type, active, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`
            relative p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all duration-200
            ${active
        ? 'bg-[#1e293b] border-[#D63031] text-white shadow-lg -translate-y-1'
        : 'bg-[#0f172a] border-transparent text-gray-500 hover:border-white/10 hover:text-gray-300 hover:bg-[#1e293b]'}
        `}
  >
    {active && (
      <div className="absolute -top-2 -right-2 bg-[#D63031] text-white p-0.5 rounded-full shadow-sm">
        <Check size={10} strokeWidth={4} />
      </div>
    )}
    <div className={active ? 'text-[#D63031]' : 'opacity-50'}>{icon}</div>
    <span className="text-xl font-black leading-none">{minutes}</span>
    <span className="text-[10px] uppercase font-bold opacity-60">{type}</span>
  </button>
);

const MenuButton: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}> = ({ icon, title, subtitle, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
            w-full text-left bg-[#0f172a] hover:bg-[#162032] p-4 rounded-xl flex items-center justify-between 
            transition-all group border border-transparent hover:border-white/5 active:scale-[0.98]
        `}
    >
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-black/20 rounded-lg text-gray-400 group-hover:text-[#D63031] transition-colors">
          {icon}
        </div>
        <div>
          <h3 className="text-gray-200 font-bold text-sm group-hover:text-white transition-colors">{title}</h3>
          <p className="text-gray-600 text-xs font-medium">{subtitle}</p>
        </div>
      </div>
      <ArrowRight size={16} className="text-white/10 group-hover:text-white/50 transition-colors -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0" />
    </button>
  );
};

export default RightPanel;