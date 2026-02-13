import React, { useState, useEffect } from 'react';
import { Trophy, Medal, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useDebounce from '../hooks/useDebounce';

interface LeaderboardEntry {
    rank: number;
    user_id: string;
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

    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage] = useState(20);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedMode, debouncedSearch]);

    useEffect(() => {
        fetchLeaderboard();
    }, [selectedMode, debouncedSearch, currentPage]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://eos-server-jxy0.onrender.com';
            const params = new URLSearchParams({
                mode: selectedMode,
                limit: itemsPerPage.toString(),
                page: currentPage.toString(),
                search: debouncedSearch
            });
            const response = await fetch(`${serverUrl}/api/leaderboard?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch leaderboard');
            const result = await response.json();
            setLeaderboard(result.data);
            setTotalItems(result.total);
        } catch (err: any) {
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

    if (error) {
        return (
            <div className="text-center py-20 bg-[#1e293b] rounded-xl border border-red-500/20">
                <p className="text-red-400">{error}</p>
                <button onClick={fetchLeaderboard} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Retry</button>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            {/* 1. FIXED MODES SELECTOR */}
            <div className="w-full overflow-hidden">
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide touch-pan-x">
                    {/* The min-w-max here is CRITICAL to keep buttons from shrinking */}
                    <div className="flex gap-2 min-w-max">
                        {['classic', 'rapid', 'swift', 'turbo'].map((m) => (
                            <button
                                key={m}
                                onClick={() => setSelectedMode(m as any)}
                                className={`px-6 py-2 rounded-lg font-semibold transition-all flex-shrink-0 ${selectedMode === m
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-[#1e293b] text-slate-400 border border-slate-700'
                                    }`}
                            >
                                {m.charAt(0).toUpperCase() + m.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. SEARCH BAR */}
            <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="text-slate-500" size={18} />
                </div>
                <input
                    type="text"
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-[#1e293b] border border-slate-700 rounded-lg text-white"
                />
            </div>

            {/* 3. FIXED TABLE RESPONSIVENESS */}
            <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-xl overflow-hidden">
                {/* overflow-x-auto enables the swipe motion */}
                <div className="overflow-x-auto w-full">
                    {/* min-w-[700px] or [800px] forces the table to stay wide enough to read on mobile */}
                    <div className="min-w-[750px] w-full">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#0f172a] border-b border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <div className="col-span-1">Rank</div>
                            <div className="col-span-4">Player</div>
                            <div className="col-span-2 text-center">Rating</div>
                            <div className="col-span-2 text-center">Games</div>
                            <div className="col-span-2 text-center">Win Rate</div>
                            <div className="col-span-1 text-center">W/L/D</div>
                        </div>

                        {loading ? (
                            <div className="text-center py-20">
                                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-700">
                                {leaderboard.map((entry) => (
                                    <div
                                        key={entry.user_id}
                                        onClick={() => navigate(`/profile/${entry.user_id}`)}
                                        className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-700/30 cursor-pointer"
                                    >
                                        <div className="col-span-1 flex items-center">{getRankIcon(entry.rank)}</div>
                                        <div className="col-span-4 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                                                {entry.avatar_url ? <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" /> : <User className="p-2 text-slate-400" />}
                                            </div>
                                            <p className="text-white font-semibold truncate">{entry.username}</p>
                                        </div>
                                        <div className="col-span-2 flex items-center justify-center">
                                            <span className={`text-lg font-bold ${getModeColor()}`}>{getRatingForMode(entry)}</span>
                                        </div>
                                        <div className="col-span-2 flex items-center justify-center text-slate-300 font-semibold">{entry.total_games}</div>
                                        <div className="col-span-2 flex items-center justify-center">
                                            <span className="text-sm text-slate-300 font-semibold">{entry.win_rate}%</span>
                                        </div>
                                        <div className="col-span-1 flex items-center justify-center text-xs text-slate-400">{entry.wins}/{entry.losses}/{entry.draws}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. PAGINATION */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-[#1e293b] rounded-lg disabled:opacity-20"><ChevronLeft size={20} /></button>
                    <span className="text-slate-400 text-sm">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 bg-[#1e293b] rounded-lg disabled:opacity-20"><ChevronRight size={20} /></button>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;