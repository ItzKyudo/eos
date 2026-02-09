import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GameHistoryEntry } from './types';

interface GamesTableProps {
  games: GameHistoryEntry[];
}

const GamesTable: React.FC<GamesTableProps> = ({ games }) => {
  const navigate = useNavigate();

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
        <div className="overflow-auto max-h-[500px] custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-800 text-xs uppercase text-slate-400 font-semibold tracking-wider shadow-md">
              <tr>
                <th className="p-4">Mode</th>
                <th className="p-4">Opponent</th>
                <th className="p-4 text-center">Score</th>
                <th className="p-4 text-center">Result</th>
                <th className="p-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {games.map((game) => (
                <tr key={game.id} className="hover:bg-slate-700/40 transition cursor-pointer group">
                  <td className="p-4 font-medium text-slate-300">
                    {game.gameType}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{game.opponentFlag}</span>
                      <div
                        className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation(); // Avoid triggering row click if any
                          navigate(`/profile/${game.opponentId}`);
                        }}
                      >
                        <span className="font-bold text-gray-200 group-hover:text-blue-400 transition">{game.opponent}</span>
                        <span className="text-slate-500 text-xs">({game.opponentRating})</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center font-mono text-slate-300">
                    {game.userScore !== undefined && game.opponentScore !== undefined
                      ? `${game.userScore} - ${game.opponentScore}`
                      : '-'}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border
                        ${game.result === 'win' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        game.result === 'loss' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                      {game.result}
                    </span>
                  </td>
                  <td className="p-4 text-right text-sm text-slate-500 font-mono whitespace-nowrap">{game.date}</td>
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