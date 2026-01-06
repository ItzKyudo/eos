import React from 'react';
import { UserProfile } from './types';
import { PIECES } from '../../pages/game/mechanics/piecemovements';

interface StatsGridProps {
  user: UserProfile | null;
}

const StatsGrid: React.FC<StatsGridProps> = ({ user }) => {
  const ratings = [
    { type: 'Classic', rating: user?.rating_classic || 200, change: 0, icon: PIECES.piece11 },
    { type: 'Swift', rating: user?.rating_swift || 200, change: 0, icon: PIECES.piece3 },
    { type: 'Turbo', rating: user?.rating_turbo || 200, change: 0, icon: PIECES.piece5 },
    { type: 'Rapid', rating: user?.rating_rapid || 200, change: 0, icon: PIECES.piece9 },
  ];

  return (
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
  );
};

export default StatsGrid;