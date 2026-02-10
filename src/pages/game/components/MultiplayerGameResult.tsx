import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, RefreshCw, Trophy } from 'lucide-react';
import supabase from '../../../config/supabase';

interface MultiplayerGameResultProps {
    isOpen: boolean;
    winner: 'player1' | 'player2' | 'draw' | null;
    winnerId: string | null;
    loserId: string | null;
    winnerName: string;
    loserName: string;
    ratingChange: number;
    reason: string;
    currentUserId: string;
    onRestart: () => void;
    onHome?: () => void;
    captureScore?: number;
    captureRatio?: number;
    winBonus?: number;
}

interface UserProfile {
    avatar_url: string | null;
    country_flag: string | null;
    username?: string;
}

const MultiplayerGameResult: React.FC<MultiplayerGameResultProps> = ({
    isOpen,
    winner,
    winnerId,
    loserId,
    winnerName,
    loserName,
    ratingChange,
    reason,
    currentUserId,
    onRestart,
    onHome,
    captureScore,
    captureRatio,
    winBonus
}) => {
    const navigate = useNavigate();
    const [winnerProfile, setWinnerProfile] = useState<UserProfile | null>(null);
    const [loserProfile, setLoserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        if (isOpen && winnerId && loserId) {
            const fetchProfiles = async () => {
                try {
                    const { data: profiles, error: profilesError } = await supabase
                        .from('profiles')
                        .select('user_id, avatar_url, country_flag')
                        .in('user_id', [winnerId, loserId]);

                    if (profilesError) throw profilesError;

                    if (profiles) {
                        const winnerData = profiles.find(p => p.user_id === winnerId);
                        const loserData = profiles.find(p => p.user_id === loserId);

                        if (winnerData) setWinnerProfile(winnerData);
                        if (loserData) setLoserProfile(loserData);
                    }

                } catch (err) {
                    console.error("Error fetching result profiles:", err);
                }
            };

            fetchProfiles();
        }
    }, [isOpen, winnerId, loserId]);

    if (!isOpen) return null;

    const handleHome = () => {
        if (onHome) onHome();
        else navigate('/game');
    };

    const isDraw = winner === 'draw' || reason === 'draw' || reason === 'Mutual Agreement';
    const isWinner = currentUserId === winnerId;

    let titleText = isWinner ? "YOU WIN" : "YOU LOST";
    let titleColor = isWinner ? "text-yellow-500" : "text-red-500";
    let headerGradient = isWinner ? "from-yellow-900/20" : "from-red-900/20";
    let borderColor = isWinner ? "border-yellow-500/20" : "border-red-500/20";

    if (isDraw) {
        titleText = "DRAW";
        titleColor = "text-gray-400";
        headerGradient = "from-gray-800/20";
        borderColor = "border-gray-500/20";
    }

    const reasonText = reason === 'checkmate' ? 'Checkmate' :
        reason === 'timeout' ? 'Time Out' :
            reason === 'resignation' ? 'Resignation' :
                reason === 'opponent_quit' ? 'Opponent Resigned' :
                    reason === 'opponent_disconnect' ? 'Opponent Disconnected' :
                        reason === 'solitude' ? 'Solitude' :
                            reason === 'supremo_capture' ? 'Supremo Captured' :
                                reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/90 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className={`relative w-full max-w-lg md:max-w-2xl bg-[#0f0f0f] rounded-3xl border ${borderColor} shadow-2xl overflow-hidden`}
                >
                    {/* Header Background */}
                    <div className={`absolute top-0 w-full h-64 bg-linear-to-b ${headerGradient} to-transparent pointer-events-none`} />

                    <div className="relative z-10 flex flex-col items-center p-6 md:p-10">

                        {/* Title Section */}
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mb-8 text-center"
                        >
                            <h2 className={`text-5xl md:text-7xl font-black tracking-tighter ${titleColor} mb-2 uppercase drop-shadow-2xl`}>
                                {titleText}
                            </h2>
                            <p className="text-white/50 font-mono uppercase tracking-widest text-sm">
                                {reasonText}
                            </p>
                        </motion.div>

                        {/* Players Comparison - Responsive Layout */}
                        <div className="flex flex-col md:flex-row items-center justify-center w-full mb-8 md:mb-12 gap-8 md:gap-0 relative">

                            {/* Player 1 (Winner or Left) */}
                            <div className={`flex flex-col items-center flex-1 z-10 order-1 md:order-1 ${isDraw ? 'opacity-90' : ''}`}>
                                <div className="relative mb-3 md:mb-4">
                                    <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full border-4 ${isDraw ? 'border-gray-500' : 'border-yellow-500'} shadow-[0_0_30px_rgba(234,179,8,0.3)] overflow-hidden bg-neutral-800`}>
                                        {winnerProfile?.avatar_url ? (
                                            <img src={winnerProfile.avatar_url} alt="P1" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 bg-neutral-900 rounded-full flex items-center justify-center border border-white/10 shadow-lg text-lg md:text-xl">
                                        {winnerProfile?.country_flag || '🏳️'}
                                    </div>
                                    {!isDraw && (
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-500 animate-bounce">
                                            <Trophy size={28} className="md:w-8 md:h-8" fill="currentColor" />
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-white mb-1 truncate max-w-[120px] md:max-w-[150px]">{winnerName}</h3>
                                {!isDraw ? (
                                    <>
                                        <span className="text-green-400 font-mono font-bold text-sm md:text-base">+{ratingChange} ERS</span>
                                        <span className="text-yellow-500 text-[10px] font-bold uppercase tracking-widest mt-1 border border-yellow-500/30 px-2 py-0.5 rounded-full bg-yellow-500/10">Winner</span>
                                    </>
                                ) : (
                                    <span className="text-gray-400 font-mono font-bold text-sm md:text-base">+0 ERS</span>
                                )}
                            </div>

                            {/* VS Divider - Responsive */}
                            <div className="flex flex-col items-center justify-center px-2 md:px-4 relative z-0 order-2 md:order-2 my-2 md:my-0">
                                <div className="hidden md:block absolute w-px h-32 bg-linear-to-b from-transparent via-white/10 to-transparent transform rotate-12" />
                                <div className="md:hidden absolute w-32 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
                                <span className="text-2xl md:text-4xl font-black text-white/10 italic pr-0 md:pr-2">VS</span>
                            </div>

                            {/* Player 2 (Loser or Right) */}
                            <div className={`flex flex-col items-center flex-1 z-10 order-3 md:order-3 ${isDraw ? 'opacity-90' : 'opacity-70 scale-95'}`}>
                                <div className="relative mb-3 md:mb-4">
                                    <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full border-4 ${isDraw ? 'border-gray-500' : 'border-red-500/30'} shadow-none overflow-hidden bg-neutral-800 ${isDraw ? '' : 'grayscale-[0.5]'}`}>
                                        {loserProfile?.avatar_url ? (
                                            <img src={loserProfile.avatar_url} alt="P2" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 bg-neutral-900 rounded-full flex items-center justify-center border border-white/10 shadow-lg text-lg md:text-xl">
                                        {loserProfile?.country_flag || '🏳️'}
                                    </div>
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-white/70 mb-1 truncate max-w-[120px] md:max-w-[150px]">{loserName}</h3>
                                {!isDraw ? (
                                    <>
                                        <span className="text-red-400 font-mono font-bold text-sm md:text-base">-{Math.abs(ratingChange)} ERS</span>
                                        <span className="text-red-500/50 text-[10px] font-bold uppercase tracking-widest mt-1 border border-red-500/10 px-2 py-0.5 rounded-full bg-red-500/5">Defeat</span>
                                    </>
                                ) : (
                                    <span className="text-gray-400 font-mono font-bold text-sm md:text-base">+0 ERS</span>
                                )}
                            </div>

                        </div>

                        {/* Score Breakdown */}
                        {!isDraw && captureScore !== undefined && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="w-full max-w-sm md:max-w-md mb-6 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm"
                            >
                                <h3 className="text-white/70 text-xs uppercase tracking-widest font-bold mb-3">Score Breakdown</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/50 text-sm">Capture Score</span>
                                        <span className="text-white font-mono font-bold">{captureScore}</span>
                                    </div>
                                    {winBonus !== undefined && winBonus > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-white/50 text-sm">Win Bonus</span>
                                            <span className="text-green-400 font-mono font-bold">+{winBonus}</span>
                                        </div>
                                    )}
                                    {captureRatio !== undefined && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-white/50 text-sm">Capture Ratio</span>
                                            <span className="text-blue-400 font-mono font-bold">+{captureRatio.toFixed(1)}</span>
                                        </div>
                                    )}
                                    <div className="h-px bg-white/10 my-2"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-bold text-sm">Total Score</span>
                                        <span className="text-yellow-400 font-mono font-bold text-lg">{ratingChange}</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-3 w-full max-w-sm md:max-w-md">
                            <button
                                onClick={onRestart}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white text-black rounded-xl font-bold transition-all hover:bg-gray-200 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.15)] text-sm md:text-base"
                            >
                                <RefreshCw size={18} />
                                Play Again
                            </button>
                            <button
                                onClick={handleHome}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all active:scale-95 group text-sm md:text-base"
                            >
                                <Home size={18} className="text-white/50 group-hover:text-white transition-colors" />
                                Return to Menu
                            </button>
                        </div>

                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MultiplayerGameResult;
