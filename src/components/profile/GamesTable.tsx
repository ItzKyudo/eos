import React from 'react';
import { GameHistoryEntry } from './types';

interface GamesTableProps {
  games: GameHistoryEntry[];
}

const GamesTable: React.FC<GamesTableProps> = ({ games }) => {
  return (
    <div className="bg-[#1e293b] rounded-xl shadow-lg border border-slate-700 overflow-hidden min-h-[200px] flex flex-col">
      <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
        <h2 className="text-lg font-bold text-white">Recent Games</h2>
        <span className="bg-slate-700 text-xs px-2 py-1 rounded text-slate-300">
          {games.length} played
        </span>
      </div>

      {games.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-slate-500 opacity-60">
           <div className="text-4xl mb-2">♟️</div> 
           <p className="text-sm font-semibold uppercase tracking-wider">No match history yet</p>
           <button className="mt-4 text-blue-400 text-xs hover:underline">Play your first game</button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800/80 text-xs uppercase text-slate-400 font-semibold tracking-wider">
              <tr>
                <th className="p-4">Mode</th>
                <th className="p-4">Opponent</th>
                <th className="p-4 text-center">Result</th>
                <th className="p-4 text-center">Moves</th>
                <th className="p-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {games.map((game) => (
                <tr key={game.id} className="hover:bg-slate-700/40 transition cursor-pointer group">
                  <td className="p-4">
                    <div className="text-xl opacity-70 group-hover:opacity-100 group-hover:scale-110 transition">
                      {game.gameType === 'bullet' ? '🚀' : '⚡'}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-200 group-hover:text-blue-400 transition">{game.opponent}</span>
                      <span className="text-slate-500 text-xs">({game.opponentRating})</span>
                      <span className="text-lg">{game.opponentFlag}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                        ${game.result === 'win' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          game.result === 'loss' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-gray-500/10 text-gray-400'}`}>
                      {game.result}
                    </span>
                  </td>
                  <td className="p-4 text-center text-slate-400">{game.moves}</td>
                  <td className="p-4 text-right text-sm text-slate-500 font-mono">{game.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GamesTable;