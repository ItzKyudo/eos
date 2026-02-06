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
    onRestart: () => void;
    onHome?: () => void;
}

interface UserProfile {
    avatar_url: string | null;
    country_flag: string | null;
    username?: string;
}

const MultiplayerGameResult: React.FC<MultiplayerGameResultProps> = ({
    isOpen,
    winnerId,
    loserId,
    winnerName,
    loserName,
    ratingChange,
    reason,
    onRestart,
    onHome
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
                    className="relative w-full max-w-2xl bg-[#0f0f0f] rounded-3xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
                >
                    {/* Header Background */}
                    <div className="absolute top-0 w-full h-48 bg-linear-to-b from-[#1a1a1a] to-transparent pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center p-8 md:p-12">

                        {/* Title Section */}
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mb-10 text-center"
                        >
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-2 uppercase drop-shadow-2xl">
                                Game Over
                            </h2>
                            <p className="text-white/50 font-mono uppercase tracking-widest text-sm">
                                {reasonText}
                            </p>
                        </motion.div>

                        {/* Players Comparison */}
                        <div className="flex items-center justify-between w-full mb-12 relative">

                            {/* Winner */}
                            <div className="flex flex-col items-center flex-1 z-10">
                                <div className="relative mb-4">
                                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.3)] overflow-hidden bg-neutral-800">
                                        {winnerProfile?.avatar_url ? (
                                            <img src={winnerProfile.avatar_url} alt="Winner" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-neutral-900 rounded-full flex items-center justify-center border border-white/10 shadow-lg text-xl">
                                        {winnerProfile?.country_flag || '🏳️'}
                                    </div>
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-500 animate-bounce">
                                        <Trophy size={32} fill="currentColor" />
                                    </div>
                                </div>
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{winnerName}</h3>
                                <span className="text-green-400 font-mono font-bold">+{ratingChange} ERS</span>
                                <span className="text-yellow-500 text-xs font-bold uppercase tracking-widest mt-2 border border-yellow-500/30 px-2 py-0.5 rounded-full bg-yellow-500/10">Winner</span>
                            </div>

                            {/* VS Divider */}
                            <div className="flex flex-col items-center justify-center px-4 relative z-0">
                                <div className="absolute w-px h-32 bg-linear-to-b from-transparent via-white/10 to-transparent transform rotate-12" />
                                <span className="text-4xl font-black text-white/10 italic pr-2">VS</span>
                            </div>

                            {/* Loser */}
                            <div className="flex flex-col items-center flex-1 z-10 opacity-80 scale-95">
                                <div className="relative mb-4">
                                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-red-500/30 shadow-none overflow-hidden bg-neutral-800 grayscale-[0.5]">
                                        {loserProfile?.avatar_url ? (
                                            <img src={loserProfile.avatar_url} alt="Loser" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-neutral-900 rounded-full flex items-center justify-center border border-white/10 shadow-lg text-xl">
                                        {loserProfile?.country_flag || '🏳️'}
                                    </div>
                                </div>
                                <h3 className="text-xl md:text-2xl font-bold text-white/70 mb-1">{loserName}</h3>
                                <span className="text-red-400 font-mono font-bold">-{Math.abs(ratingChange)} ERS</span>
                                <span className="text-red-500/50 text-xs font-bold uppercase tracking-widest mt-2 border border-red-500/10 px-2 py-0.5 rounded-full bg-red-500/5">Defeat</span>
                            </div>

                        </div>

                        {/* Actions */}
                        <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
                            <button
                                onClick={handleHome}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all active:scale-95 group"
                            >
                                <Home size={18} className="text-white/50 group-hover:text-white transition-colors" />
                                Return to Menu
                            </button>
                            <button
                                onClick={onRestart}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white text-black rounded-xl font-bold transition-all hover:bg-gray-200 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                            >
                                <RefreshCw size={18} />
                                Play Again
                            </button>
                        </div>

                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MultiplayerGameResult;
