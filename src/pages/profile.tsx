import React, { useState } from 'react';
import Sidebar from '../components/sidebar';
import { PIECES } from './game/mechanics/piecemovements'; 

interface GameHistoryEntry {
  id: string;
  opponent: string;
  opponentRating: number;
  opponentFlag: string;
  result: 'win' | 'loss' | 'draw';
  accuracy?: string;
  moves: number;
  date: string;
  gameType: 'bullet' | 'blitz' | 'rapid';
  reviewAvailable: boolean;
}

interface Friend {
  id: number;
  name: string;
  isOnline: boolean;
}

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [status, setStatus] = useState<string>('');
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [showAds, setShowAds] = useState(true);
  const [tempStatus, setTempStatus] = useState('');

  const friends: Friend[] = [
    { id: 1, name: 'Friend 1', isOnline: true },
    { id: 2, name: 'Friend 2', isOnline: false },
    { id: 3, name: 'Friend 3', isOnline: false },
  ];

  const gameHistory: GameHistoryEntry[] = [
    {
      id: 'g1',
      opponent: '1o1o3',
      opponentRating: 262,
      opponentFlag: '🇬🇷',
      result: 'win',
      moves: 35,
      date: 'Dec 29, 2025',
      gameType: 'bullet',
      reviewAvailable: true,
    },
    {
      id: 'g2',
      opponent: 'JOHNY0987',
      opponentRating: 549,
      opponentFlag: '🇨🇳',
      result: 'loss',
      moves: 16,
      date: 'Dec 29, 2025',
      gameType: 'bullet',
      reviewAvailable: true,
    },
    {
      id: 'g3',
      opponent: 'Madisoncags',
      opponentRating: 584,
      opponentFlag: '🇺🇸',
      result: 'win',
      accuracy: '75',
      moves: 30,
      date: 'Dec 29, 2025',
      gameType: 'blitz',
      reviewAvailable: true,
    },
  ];

  const ratings = [
    { type: 'Bullet', rating: 280, change: -267, icon: PIECES.piece11 }, 
    { type: 'Blitz', rating: 500, change: 5, icon: PIECES.piece3 },
    { type: 'Rapid', rating: 814, change: 74, icon: PIECES.piece9 },
  ];

  const handleSaveStatus = () => {
    setStatus(tempStatus);
    setIsEditingStatus(false);
  };

  const handleEditStatus = () => {
    setTempStatus(status);
    setIsEditingStatus(true);
  };

  const renderTabButton = (tabName: string) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`py-3 px-6 font-bold text-sm tracking-wider uppercase transition-all duration-300 relative
        ${activeTab === tabName ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'}
      `}
    >
      {tabName}
      {activeTab === tabName && (
        <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] rounded-t-full"></span>
      )}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-[#0f172a] font-sans text-gray-100 overflow-hidden relative">
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10 pointer-events-none z-0" />
      
      <div className="relative z-10">
        <Sidebar />
      </div>
      <main className="flex-1 h-screen overflow-y-auto relative z-10 p-6 lg:p-10 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="bg-[#1e293b] p-8 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.3)] border-t-4 border-[#09357A] mb-8 flex flex-col md:flex-row justify-between items-start gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start w-full">
            {/* Avatar */}
            <div className="relative group">
                <div className="w-40 h-40 rounded-xl overflow-hidden border-4 border-[#1e293b] shadow-lg ring-2 ring-[#09357A]">
                    <img 
                        src="/api/placeholder/200/200" 
                        alt="Profile" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-[#1e293b]" title="Online"></div>
            </div>
            <div className="flex flex-col gap-3 items-center md:items-start flex-1">
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">Chex</h1>
                <span className="text-3xl filter drop-shadow-lg">🇵🇭</span>
              </div>
              
              <div className="flex items-center gap-3 w-full max-w-md">
                 {isEditingStatus ? (
                     <div className="flex w-full gap-2 animate-fadeIn">
                        <input 
                            autoFocus
                            type="text" 
                            className="bg-slate-900 border border-slate-600 rounded px-3 py-1 text-sm text-gray-200 w-full focus:outline-none focus:border-blue-500"
                            value={tempStatus}
                            onChange={(e) => setTempStatus(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveStatus()}
                            placeholder="What's on your mind?"
                        />
                        <button onClick={handleSaveStatus} className="text-green-400 hover:text-green-300 text-sm font-bold">SAVE</button>
                     </div>
                 ) : (
                    <div 
                        onClick={handleEditStatus}
                        className="flex items-center gap-2 text-slate-400 hover:text-blue-300 cursor-pointer transition group px-3 py-1 rounded hover:bg-slate-800/50 -ml-3"
                    >
                        <span className="text-lg">📝</span>
                        <span className="italic truncate max-w-[300px]">
                            {status || "Set your status..."}
                        </span>
                    </div>
                 )}
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-semibold text-slate-400 mt-2">
                <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">Joined Feb 2023</span>
                <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
                </span>
                <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700 hover:text-white cursor-pointer transition">3 Friends</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4 md:mt-0">
                 <button className="bg-[#09357A] hover:bg-blue-800 text-white shadow-lg shadow-blue-900/20 px-6 py-2 rounded-lg font-bold transition transform active:scale-95">
                  Edit Profile
                </button>
                 <button className="bg-slate-700 hover:bg-slate-600 text-gray-200 px-4 py-2 rounded-lg font-bold transition">
                  ...
                </button>
            </div>
          </div>
        </div>
        <nav className="flex gap-2 border-b border-slate-700 mb-8 px-2 overflow-x-auto">
          {['overview', 'games', 'stats', 'friends', 'awards'].map((tab) => (
             <React.Fragment key={tab}>
                 {renderTabButton(tab)}
             </React.Fragment>
          ))}
        </nav>
        {activeTab === 'overview' && (
          <div className="flex flex-col xl:flex-row gap-8 animate-fadeIn">
            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {ratings.map((rating) => (
                  <div key={rating.type} className="bg-[#1e293b] p-5 rounded-xl border border-slate-700 shadow-md hover:shadow-lg hover:border-slate-600 transition group relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 scale-150 grayscale">
                        <img src={rating.icon} alt="" className="w-24 h-24" />
                    </div>
                    <div className="flex items-center gap-3 mb-2 relative z-10">
                      <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center p-1 border border-slate-700">
                         <img src={rating.icon} alt={rating.type} className="w-full h-full object-contain" />
                      </div>
                      <h3 className="text-slate-400 text-xs uppercase font-bold tracking-widest">{rating.type}</h3>
                    </div>

                    <div className="text-4xl font-black text-white mb-2 tracking-tight relative z-10">
                        {rating.rating}
                    </div>
                    
                    <div className={`text-sm font-bold flex items-center gap-1 ${rating.change < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      <span>{rating.change < 0 ? '▼' : '▲'}</span>
                      <span>{Math.abs(rating.change)}</span>
                      <span className="text-slate-500 font-normal text-xs ml-1">this week</span>
                    </div>
                  </div>
                ))}
              </div>
              {showAds && (
                <div className="bg-gradient-to-r from-blue-900 to-[#09357A] p-6 rounded-xl flex items-center justify-between shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20" />
                    <div className="relative z-10">
                        <h3 className="font-bold text-white text-lg">Support the Game</h3>
                        <p className="text-blue-200 text-sm">Remove ads and get a cool badge.</p>
                    </div>
                    <button 
                        onClick={() => setShowAds(false)}
                        className="relative z-10 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg text-sm font-bold backdrop-blur-sm transition"
                    >
                        Hide Ads
                    </button>
                </div>
              )}
              <div className="bg-[#1e293b] rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                  <h2 className="text-lg font-bold text-white">Recent Games</h2>
                  <span className="bg-slate-700 text-xs px-2 py-1 rounded text-slate-300">{gameHistory.length} played</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-800/80 text-xs uppercase text-slate-400 font-semibold tracking-wider">
                      <tr>
                        <th className="p-4">Mode</th>
                        <th className="p-4">Opponent</th>
                        <th className="p-4 text-center">Result</th>
                        <th className="p-4 text-center">Acc</th>
                        <th className="p-4 text-center">Moves</th>
                        <th className="p-4 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {gameHistory.map((game) => (
                        <tr key={game.id} className="hover:bg-slate-700/40 transition cursor-pointer group">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                                <div className="text-xl opacity-70 group-hover:opacity-100 group-hover:scale-110 transition">
                                    {game.gameType === 'bullet' ? '🚀' : '⚡'}
                                </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-200 group-hover:text-blue-400 transition">{game.opponent}</span>
                                <span className="text-slate-500 text-xs">({game.opponentRating})</span>
                                <span className="text-lg" title="Nationality">{game.opponentFlag}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                                ${game.result === 'win' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                                  game.result === 'loss' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                                  'bg-gray-500/10 text-gray-400'}
                              `}
                            >
                              {game.result === 'win' ? '+' : '-'} {game.result}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {game.accuracy ? (
                              <span className="font-mono text-yellow-500 font-bold">{game.accuracy}%</span>
                            ) : (
                              <button className="text-xs bg-slate-700 hover:bg-blue-600 hover:text-white px-3 py-1 rounded transition text-slate-300">
                                Analyze
                              </button>
                            )}
                          </td>
                          <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1 text-slate-400">
                                <img src={PIECES.piece1} className="w-4 h-4 opacity-50 grayscale" alt="" />
                                <span>{game.moves}</span>
                              </div>
                          </td>

                          <td className="p-4 text-right text-sm text-slate-500 font-mono">
                            {game.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 bg-slate-800/30 text-center border-t border-slate-700">
                    <button className="text-sm text-blue-400 hover:text-blue-300 font-semibold transition">View All Games</button>
                </div>
              </div>
            </div>
            <aside className="w-full xl:w-80 flex-shrink-0 space-y-6">
              <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-md">
                <h3 className="font-bold text-gray-200 mb-4 flex items-center justify-between">
                    <span>Active Theme</span>
                    <span className="text-xs bg-[#09357A] px-2 py-1 rounded text-blue-100">EOS Standard</span>
                </h3>
                
                <div className="flex gap-4 items-center bg-[#0f172a] p-4 rounded-lg border border-slate-800">
                   {/* Mini Board */}
                   <div className="grid grid-cols-2 gap-0.5 bg-[#09357A] p-1 rounded border border-slate-600">
                       <div className="w-8 h-8 bg-gray-300 flex items-center justify-center"></div>
                       <div className="w-8 h-8 bg-gray-500 flex items-center justify-center"></div>
                       <div className="w-8 h-8 bg-gray-500 flex items-center justify-center"></div>
                       <div className="w-8 h-8 bg-gray-300 flex items-center justify-center"></div>
                   </div>
                   <div className="flex flex-col gap-2">
                       <div className="flex gap-2">
                           <div className="w-8 h-8 bg-slate-700/50 rounded flex items-center justify-center border border-slate-600">
                               <img src={PIECES.piece1} alt="Supremo" className="w-6 h-6 object-contain" />
                           </div>
                           <div className="w-8 h-8 bg-slate-700/50 rounded flex items-center justify-center border border-slate-600">
                               <img src={PIECES.piece3} alt="Archer" className="w-6 h-6 object-contain" />
                           </div>
                       </div>
                       <div className="flex gap-2">
                           <div className="w-8 h-8 bg-slate-700/50 rounded flex items-center justify-center border border-slate-600">
                               <img src={PIECES.piece9} alt="Chancellor" className="w-6 h-6 object-contain" />
                           </div>
                           <div className="w-8 h-8 bg-slate-700/50 rounded flex items-center justify-center border border-slate-600">
                               <img src={PIECES.piece13} alt="Minister" className="w-6 h-6 object-contain" />
                           </div>
                       </div>
                   </div>
                </div>
                <button className="w-full mt-4 border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white py-2 rounded text-sm font-semibold transition">
                    Customize Theme
                </button>
              </div>
              <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-200">Friends</h3>
                  <span className="bg-slate-800 border border-slate-600 px-2 py-0.5 rounded text-xs text-slate-400 font-mono">
                      {friends.length}
                  </span>
                </div>
                
                <div className="flex flex-col gap-3">
                  {friends.map((friend) => (
                    <div 
                        key={friend.id} 
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg border border-slate-600 group-hover:border-blue-500 transition relative">
                         👤
                         {friend.isOnline && (
                             <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1e293b] rounded-full"></div>
                         )}
                      </div>
                      <div className="flex flex-col">
                          <span className="font-semibold text-sm text-gray-200 group-hover:text-blue-400">{friend.name}</span>
                          <span className="text-xs text-slate-500">
                              {friend.isOnline ? 'Playing Bullet...' : 'Offline'}
                          </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700">
                     <input 
                        type="text" 
                        placeholder="Find friends..." 
                        className="w-full bg-[#0f172a] border border-slate-600 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500 transition"
                     />
                </div>
              </div>

            </aside>
          </div>
        )}
        
        {activeTab !== 'overview' && (
            <div className="flex flex-col items-center justify-center h-96 text-slate-500 animate-fadeIn">
                <div className="text-6xl mb-4 grayscale opacity-20">
                    <img src={PIECES.piece3} alt="Archer" className="w-24 h-24 inline-block" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Under Construction</h2>
                <p>The {activeTab} section is currently being updated for the new engine.</p>
                <button 
                    onClick={() => setActiveTab('overview')}
                    className="mt-6 bg-[#09357A] hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition"
                >
                    Return to Overview
                </button>
            </div>
        )}

      </main>
    </div>
  );
};

export default Profile;