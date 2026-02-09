import React, { useState, useEffect } from 'react';
import { Trophy, Medal, TrendingUp, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LeaderboardEntry {
    rank: number;
    user_id: number;
    username: string;
    avatar_url?: string;
    rating_classic: number;
    rating_rapid: number;
    rating_swift: number;
    rating_turbo: number;
    wins: number;
    losses: number;
    draws: number;
    total_games: number;
    win_rate: number;
}

interface LeaderboardProps {
    mode?: 'classic' | 'rapid' | 'swift' | 'turbo';
}

const Leaderboard: React.FC<LeaderboardProps> = ({ mode = 'classic' }) => {
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMode, setSelectedMode] = useState(mode);

    useEffect(() => {
        fetchLeaderboard();
    }, [selectedMode]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://eos-server-jxy0.onrender.com';
            const response = await fetch(`${serverUrl}/api/leaderboard?mode=${selectedMode}&limit=100`);

            if (!response.ok) throw new Error('Failed to fetch leaderboard');

            const data = await response.json();
            setLeaderboard(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="text-yellow-400" size={24} />;
        if (rank === 2) return <Medal className="text-gray-400" size={24} />;
        if (rank === 3) return <Medal className="text-amber-600" size={24} />;
        return <span className="text-gray-500 font-bold text-lg">#{rank}</span>;
    };

    const getRatingForMode = (entry: LeaderboardEntry) => {
        switch (selectedMode) {
            case 'rapid': return entry.rating_rapid;
            case 'swift': return entry.rating_swift;
            case 'turbo': return entry.rating_turbo;
            default: return entry.rating_classic;
        }
    };

    const getModeColor = () => {
        switch (selectedMode) {
            case 'rapid': return 'text-blue-400';
            case 'swift': return 'text-purple-400';
            case 'turbo': return 'text-red-400';
            default: return 'text-green-400';
        }
    };

    if (loading) {
        return (
            <div className="text-center py-20">
                <div className="inline-block w-8 h-8 border-4 border-[#81b64c] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 mt-4">Loading leaderboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20 bg-[#302e2b] rounded-xl border border-red-500/20">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Mode Selector */}
            <div className="flex gap-2 flex-wrap">
                {['classic', 'rapid', 'swift', 'turbo'].map((m) => (
                    <button
                        key={m}
                        onClick={() => setSelectedMode(m as any)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedMode === m
                                ? 'bg-[#81b64c] text-white'
                                : 'bg-[#302e2b] text-gray-400 hover:bg-[#3a3835] hover:text-white'
                            }`}
                    >
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                ))}
            </div>

            {/* Leaderboard Table */}
            <div className="bg-[#302e2b] rounded-xl border border-white/5 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#1a1917] border-b border-white/5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-4">Player</div>
                    <div className="col-span-2 text-center">Rating</div>
                    <div className="col-span-2 text-center">Games</div>
                    <div className="col-span-2 text-center">Win Rate</div>
                    <div className="col-span-1 text-center">W/L/D</div>
                </div>

                {/* Entries */}
                <div className="divide-y divide-white/5">
                    {leaderboard.map((entry) => (
                        <div
                            key={entry.user_id}
                            onClick={() => navigate(`/profile/${entry.user_id}`)}
                            className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[#3a3835] transition-colors cursor-pointer ${entry.rank <= 3 ? 'bg-[#2a2825]' : ''
                                }`}
                        >
                            {/* Rank */}
                            <div className="col-span-1 flex items-center">
                                {getRankIcon(entry.rank)}
                            </div>

                            {/* Player */}
                            <div className="col-span-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                                    {entry.avatar_url ? (
                                        <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="text-gray-400" size={20} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-white font-semibold">{entry.username}</p>
                                    <p className="text-xs text-gray-500">ID: {entry.user_id}</p>
                                </div>
                            </div>

                            {/* Rating */}
                            <div className="col-span-2 flex items-center justify-center">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className={getModeColor()} size={16} />
                                    <span className={`text-xl font-bold ${getModeColor()}`}>
                                        {getRatingForMode(entry)}
                                    </span>
                                </div>
                            </div>

                            {/* Total Games */}
                            <div className="col-span-2 flex items-center justify-center">
                                <span className="text-gray-300 font-semibold">{entry.total_games}</span>
                            </div>

                            {/* Win Rate */}
                            <div className="col-span-2 flex items-center justify-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#81b64c]"
                                            style={{ width: `${entry.win_rate}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-gray-300 font-semibold min-w-[3rem]">
                                        {entry.win_rate}%
                                    </span>
                                </div>
                            </div>

                            {/* W/L/D */}
                            <div className="col-span-1 flex items-center justify-center">
                                <span className="text-xs text-gray-400">
                                    {entry.wins}/{entry.losses}/{entry.draws}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {leaderboard.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No players found
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
