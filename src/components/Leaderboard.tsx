import React, { useState, useEffect } from 'react';
import { Trophy, Medal, TrendingUp, User, ChevronLeft, ChevronRight } from 'lucide-react';
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

    // Search and Pagination states
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage] = useState(20);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1); // Reset to first page on mode or search change
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

    if (error) {
        return (
            <div className="text-center py-20 bg-[#302e2b] rounded-xl border border-red-500/20">
                <p className="text-red-400">{error}</p>
                <button
                    onClick={fetchLeaderboard}
                    className="mt-4 px-4 py-2 bg-[#81b64c] text-white rounded-lg hover:bg-[#71a342] transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
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

                {/* Search Bar */}
                <div className="relative w-full md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="text-gray-500" size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search players..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 bg-[#302e2b] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#81b64c] transition-colors"
                    />
                </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-[#302e2b] rounded-xl border border-white/5 overflow-hidden shadow-xl">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#1a1917] border-b border-white/5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-4">Player</div>
                    <div className="col-span-2 text-center">Rating</div>
                    <div className="col-span-2 text-center">Games</div>
                    <div className="col-span-2 text-center">Win Rate</div>
                    <div className="col-span-1 text-center">W/L/D</div>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block w-8 h-8 border-4 border-[#81b64c] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 mt-4 font-medium tracking-wide">Fetching warriors...</p>
                    </div>
                ) : (
                    <>
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
                                        <div className="flex items-center gap-2 w-full max-w-[120px]">
                                            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#81b64c]"
                                                    style={{ width: `${entry.win_rate}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-gray-300 font-semibold">
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
                                No players found matching "{debouncedSearch}"
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg bg-[#302e2b] text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Previous Page"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                                if (totalPages <= 7) return true;
                                if (page === 1 || page === totalPages) return true;
                                return Math.abs(page - currentPage) <= 1;
                            })
                            .map((page, index, array) => {
                                const showEllipsis = index > 0 && page - array[index - 1] > 1;
                                return (
                                    <React.Fragment key={page}>
                                        {showEllipsis && <span className="px-2 text-gray-500 flex items-center">...</span>}
                                        <button
                                            onClick={() => setCurrentPage(page)}
                                            className={`min-w-[40px] h-10 rounded-lg font-bold transition-all ${currentPage === page
                                                ? 'bg-[#81b64c] text-white shadow-lg shadow-[#81b64c]/20'
                                                : 'bg-[#302e2b] text-gray-400 hover:bg-[#3a3835] hover:text-white'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    </React.Fragment>
                                );
                            })}
                    </div>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg bg-[#302e2b] text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Next Page"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
