import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Frown, Home } from 'lucide-react';

interface GameOverModalProps {
    isOpen: boolean;
    winner: 'player1' | 'player2' | 'draw' | null;
    currentUserId: string;
    winnerId: string | null;
    winnerName: string;
    loserName: string;
    winnerRatingChange: number;
    loserRatingChange: number;
    winnerNewRating: number;
    loserNewRating: number;
    reason: string;
    onClose: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({
    isOpen,
    currentUserId,
    winnerId,
    winnerName,
    loserName,
    winnerRatingChange,
    loserRatingChange,
    winnerNewRating,
    loserNewRating,
    reason,
    onClose
}) => {
    const navigate = useNavigate();
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => setShow(true), 100);
        } else {
            setShow(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const isWinner = currentUserId === winnerId;
    const title = isWinner ? 'VICTORY' : 'DEFEAT';
    const titleColor = isWinner ? 'text-yellow-400' : 'text-red-500';
    const Icon = isWinner ? Trophy : Frown;
    const ratingChange = isWinner ? `+${winnerRatingChange}` : `-${Math.abs(loserRatingChange)}`;
    const newRating = isWinner ? winnerNewRating : loserNewRating;
    const reasonText = reason === 'checkmate' ? 'Checkmate' :
        reason === 'timeout' ? 'Time Out' :
            reason === 'resignation' ? 'Resignation' :
                reason === 'opponent_disconnect' ? 'Opponent Disconnected' :
                    'Game Ended';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Modal Content */}
            <div
                className={`relative w-full max-w-lg bg-[#1a1a1a] rounded-3xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] p-8 overflow-hidden transform transition-all duration-500 ${show ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-10 opacity-0'}`}
            >
                {/* Glow Effect */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b ${isWinner ? 'from-yellow-500/20' : 'from-red-600/20'} to-transparent blur-3xl pointer-events-none`} />

                <div className="relative z-10 flex flex-col items-center text-center">

                    {/* Icon */}
                    <div className={`mb-6 p-6 rounded-full ${isWinner ? 'bg-yellow-500/10 text-yellow-500 box-shadow-[0_0_30px_rgba(234,179,8,0.3)]' : 'bg-red-500/10 text-red-500'}`}>
                        <Icon size={64} strokeWidth={1.5} />
                    </div>

                    <h2 className={`text-6xl font-black tracking-tighter mb-2 ${titleColor} drop-shadow-lg`}>
                        {title}
                    </h2>

                    <p className="text-gray-400 text-lg font-medium mb-8 uppercase tracking-widest">
                        {reasonText}
                    </p>

                    {/* Stats Card */}
                    <div className="w-full bg-white/5 rounded-2xl p-6 border border-white/10 mb-8 grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center border-r border-white/10">
                            <span className="text-gray-400 text-xs uppercase tracking-wider mb-1">Rating Change</span>
                            <span className={`text-3xl font-bold ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
                                {ratingChange}
                            </span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-gray-400 text-xs uppercase tracking-wider mb-1">New Rating</span>
                            <span className="text-3xl font-bold text-white">
                                {newRating}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 w-full">
                        <button
                            onClick={() => {
                                onClose();
                                navigate('/game'); // Or wherever the main menu/game selection is
                            }}
                            className="flex items-center justify-center gap-3 w-full bg-white text-black hover:bg-gray-200 py-4 rounded-xl font-bold text-lg transition-all active:scale-95"
                        >
                            <Home size={20} />
                            Return to Menu
                        </button>
                    </div>

                    <p className="mt-6 text-gray-600 text-xs">
                        {winnerName} vs {loserName}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GameOverModal;
