import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/sidebar';

const Lobby = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-neutral-900 text-white">
      <Sidebar />

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold">Multiplayer Lobby</h1>
            <p className="text-neutral-400 mt-2">Choose a side to simulate a match or return to practice.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div
              onClick={() => navigate('/multiplayer?role=player1')}
              className="cursor-pointer bg-neutral-800 border border-neutral-700 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="w-16 h-16 bg-green-900/40 rounded-full flex items-center justify-center mb-4 text-3xl">♟️</div>
              <h2 className="text-2xl font-bold text-green-300 mb-2">Play as Player 1</h2>
              <p className="text-sm text-neutral-400">You control the GREEN pieces and start at the bottom.</p>
            </div>

            <div
              onClick={() => navigate('/multiplayer?role=player2')}
              className="cursor-pointer bg-neutral-800 border border-neutral-700 rounded-2xl p-8 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="w-16 h-16 bg-blue-900/40 rounded-full flex items-center justify-center mb-4 text-3xl">♟️</div>
              <h2 className="text-2xl font-bold text-blue-300 mb-2">Play as Player 2</h2>
              <p className="text-sm text-neutral-400">You control the BLUE pieces and start at the top (board flipped).</p>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <button onClick={() => navigate('/practice')} className="text-neutral-400 hover:text-white underline text-sm">
              Back to Local Practice
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Lobby;