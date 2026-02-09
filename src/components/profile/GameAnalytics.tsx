import React, { useMemo } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
} from 'recharts';
import { GameHistoryEntry } from './types';
import { Trophy, XCircle, MinusCircle, Target, TrendingUp, Activity } from 'lucide-react';

interface GameAnalyticsProps {
    games: GameHistoryEntry[];
}

const COLORS = {
    win: '#22c55e', // green-500
    loss: '#ef4444', // red-500
    draw: '#94a3b8', // slate-400
    classic: '#3b82f6', // blue-500
    rapid: '#8b5cf6', // violet-500
    swift: '#ec4899', // pink-500
    turbo: '#f59e0b', // amber-500
};

const GameAnalytics: React.FC<GameAnalyticsProps> = ({ games }) => {
    const stats = useMemo(() => {
        const total = games.length;
        const wins = games.filter(g => g.result === 'win').length;
        const losses = games.filter(g => g.result === 'loss').length;
        const draws = games.filter(g => g.result === 'draw').length;
        const winRate = total > 0 ? (wins / total) * 100 : 0;

        // Mode-specific stats
        const modes = ['Classic', 'Rapid', 'Swift', 'Turbo'];
        const modeData = modes.map(mode => {
            const modeGames = games.filter(g => g.gameType === mode);
            return {
                name: mode,
                wins: modeGames.filter(g => g.result === 'win').length,
                losses: modeGames.filter(g => g.result === 'loss').length,
                draws: modeGames.filter(g => g.result === 'draw').length,
                total: modeGames.length
            };
        }).filter(m => m.total > 0);

        const pieData = [
            { name: 'Wins', value: wins, color: COLORS.win },
            { name: 'Losses', value: losses, color: COLORS.loss },
            { name: 'Draws', value: draws, color: COLORS.draw },
        ].filter(d => d.value > 0);

        // Recent trend (last 10 games)
        const recentTrend = games.slice(0, 10).map(g => g.result).reverse();

        return { total, wins, losses, draws, winRate, modeData, pieData, recentTrend };
    }, [games]);

    if (games.length === 0) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-fadeIn">
            {/* Summary Cards */}
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                        <Trophy className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Wins</p>
                        <p className="text-2xl font-black text-white">{stats.wins}</p>
                    </div>
                </div>

                <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-lg">
                        <XCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Losses</p>
                        <p className="text-2xl font-black text-white">{stats.losses}</p>
                    </div>
                </div>

                <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-slate-500/10 rounded-lg">
                        <MinusCircle className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Draws</p>
                        <p className="text-2xl font-black text-white">{stats.draws}</p>
                    </div>
                </div>

                <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                            <Target className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Win Rate</p>
                            <p className="text-2xl font-black text-white">{stats.winRate.toFixed(1)}%</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mb-1">Recent Trend</p>
                        <div className="flex gap-1">
                            {stats.recentTrend.map((res, i) => (
                                <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full ${res === 'win' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' :
                                        res === 'loss' ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' :
                                            'bg-slate-400'
                                        }`}
                                    title={res.toUpperCase()}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid for Charts */}
            <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Win Distribution Pie */}
                <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col items-center">
                    <h3 className="text-slate-200 font-bold uppercase text-xs tracking-widest mb-6 self-start flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                        Win Distribution
                    </h3>
                    <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.pieData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {stats.pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Mode Performance Bar */}
                <div className="lg:col-span-2 bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-lg">
                    <h3 className="text-slate-200 font-bold uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-amber-400" />
                        Performance by Mode
                    </h3>
                    <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.modeData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="wins" fill={COLORS.win} radius={[4, 4, 0, 0]} name="Wins">
                                    <LabelList dataKey="wins" position="top" fill="#22c55e" fontSize={10} offset={10} />
                                </Bar>
                                <Bar dataKey="losses" fill={COLORS.loss} radius={[4, 4, 0, 0]} name="Losses" />
                                <Bar dataKey="draws" fill={COLORS.draw} radius={[4, 4, 0, 0]} name="Draws" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameAnalytics;
