import React from 'react';
import { UserProfile } from './types';
import { PIECES } from '../../pages/game/mechanics/piecemovements';

interface StatsGridProps {
  user: UserProfile | null;
}

const StatsGrid: React.FC<StatsGridProps> = ({ user }) => {
  const ratings = [
    { type: 'Classic', rating: user?.rating_classic || 1200, change: 0, icon: PIECES.piece7_b },
    { type: 'Swift', rating: user?.rating_swift || 1200, change: 0, icon: PIECES.piece3_b },
    { type: 'Turbo', rating: user?.rating_turbo || 1200, change: 0, icon: PIECES.piece5_b },
    { type: 'Rapid', rating: user?.rating_rapid || 1200, change: 0, icon: PIECES.piece1_b },
  ];

  const combatStats = [
    { label: 'Supremo Wins', value: user?.supremo_wins || 0, icon: '👑' },
    { label: 'Solitude Wins', value: user?.solitude_wins || 0, icon: '🗡️' },
    { label: 'Pieces Captured', value: user?.pieces_captured || 0, icon: '🎯' },
    { label: 'Double Kills', value: user?.double_kills || 0, icon: '⚡' },
    { label: 'Triple Kills', value: user?.triple_kills || 0, icon: '🔥' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
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
              <span>-</span>
              <span className="text-slate-500 font-normal text-xs ml-1">Rank pending</span>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-slate-400 font-bold mb-3 uppercase text-xs tracking-widest">Combat Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {combatStats.map((stat) => (
            <div key={stat.label} className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 hover:border-slate-500 transition shadow-md flex flex-col items-center text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsGrid;