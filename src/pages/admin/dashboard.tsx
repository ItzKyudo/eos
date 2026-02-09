import { useEffect, useState } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import {
  Users,
  Swords,
  Activity,
  Trophy,
  Box,
  Wifi,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

import { RevenueChart, UserGrowthChart, GameModeChart } from '../../components/admin/AnalyticsCharts';

interface DashboardData {
  metrics: {
    total_users: number;
    total_games_played: number;
    active_players: number;
    total_revenue: number;
  };
  recentGames: Array<{
    id: number;
    player1: string;
    player2: string;
    mode: string;
    winner: string;
    played_at: string;
  }>;
  topItems: Array<{
    item_name: string;
    sold_count: number;
  }>;
  analytics?: {
    revenue_trend: Array<{ name: string; value: number }>;
    user_growth: Array<{ name: string; value: number }>;
    game_modes: Array<{ name: string; value: number }>;
    top_players: Array<{ username: string; wins: number; country_flag: string; rating: number }>;
  };
}

const Dashboard = () => {
  const [data, setData] = useState<DashboardData>({
    metrics: { total_users: 0, total_games_played: 0, active_players: 0, total_revenue: 0 },
    recentGames: [],
    topItems: [],
    analytics: { revenue_trend: [], user_growth: [], game_modes: [], top_players: [] }
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const API_URL = 'https://eos-server-jxy0.onrender.com';

  useEffect(() => {
    fetchDashboardData(page);
  }, [page]);

  const fetchDashboardData = async (pageNum: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const res = await fetch(`${API_URL}/api/admin/dashboard?page=${pageNum}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const jsonData = await res.json();
        setData(jsonData);
      } else {
        console.error("Failed to fetch dashboard data. Status:", res.status);
      }
    } catch (error) {
      console.error("Error loading dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(p => p - 1);
  };

  const handleNextPage = () => {
    if (data.recentGames.length === 5) {
      setPage(p => p + 1);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Overview of EOS performance</p>
          </div>
          <button onClick={() => fetchDashboardData(page)} className="p-2 bg-white border rounded-lg hover:bg-gray-50 text-gray-600 transition-all shadow-sm"><RefreshCw size={20} /></button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Players"
            value={data.metrics.total_users}
            icon={<Users size={24} className="text-blue-600" />}
            bgColor="bg-blue-50"
          />
          <KPICard
            title="Games Played"
            value={data.metrics.total_games_played}
            icon={<Swords size={24} className="text-indigo-600" />}
            bgColor="bg-indigo-50"
          />
          <KPICard
            title="Active Players"
            value={data.metrics.active_players}
            icon={<Wifi size={24} className="text-green-600" />}
            bgColor="bg-green-50"
          />
          <KPICard
            title="Total Revenue"
            value={`₱${Number(data.metrics.total_revenue).toLocaleString()}`}
            icon={<DollarSign size={24} className="text-orange-600" />}
            bgColor="bg-orange-50"
          />
        </div>

        {/* Analytics Charts Section */}
        {data.analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <RevenueChart data={data.analytics.revenue_trend} />
            </div>
            <div>
              <GameModeChart data={data.analytics.game_modes} />
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Recent Games Table (With Pagination) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-fit">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                <h2 className="font-bold text-lg flex items-center gap-2 text-gray-800">
                  <Activity size={20} className="text-gray-400" />
                  Recent Matches
                </h2>
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-md">Page {page}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-4">Match ID</th>
                      <th className="px-6 py-4">Players</th>
                      <th className="px-6 py-4">Winner</th>
                      <th className="px-6 py-4 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading...</td></tr>
                    ) : data.recentGames.map((game) => (
                      <tr key={game.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-500 text-sm font-mono">#{game.id}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium">
                            <span className="text-blue-600">{game.player1}</span>
                            <span className="text-gray-400 mx-1">vs</span>
                            <span className="text-red-600">{game.player2}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                            {game.mode}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {game.winner !== 'Draw' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Trophy size={12} /> {game.winner}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Draw
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-500">
                          {new Date(game.played_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                    {!loading && data.recentGames.length === 0 && (
                      <tr><td colSpan={4} className="p-8 text-center text-gray-400">No matches found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                <button
                  onClick={handlePrevPage}
                  disabled={page === 1 || loading}
                  className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg hover:bg-white transition-all shadow-sm border border-transparent hover:border-gray-200"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={data.recentGames.length < 5 || loading}
                  className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg hover:bg-white transition-all shadow-sm border border-transparent hover:border-gray-200"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <UserGrowthChart data={data.analytics?.user_growth || []} />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            {/* Top Selling Items (Limited to 5) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
              <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-gray-800">
                <Box size={20} className="text-gray-400" />
                Top Selling Items
              </h2>
              <div className="space-y-4">
                {data.topItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                        ${idx === 0 ? 'bg-yellow-100 text-yellow-700 shadow-sm' : 'bg-white border border-gray-200 text-gray-600'}
                      `}>
                        {idx + 1}
                      </div>
                      <span className="font-medium text-gray-700">{item.item_name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{item.sold_count} sold</span>
                  </div>
                ))}
                {data.topItems.length === 0 && (
                  <div className="text-center text-gray-400 py-4">No sales data found</div>
                )}
              </div>
            </div>

            {/* Top Players Leaderboard */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
              <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-gray-800">
                <Trophy size={20} className="text-yellow-500" />
                Top Players
              </h2>
              <div className="space-y-4">
                {data.analytics?.top_players?.map((player, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-indigo-50/30 rounded-lg hover:bg-indigo-50 transition-colors border border-indigo-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-lg shadow-sm">
                        {player.country_flag}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 text-sm">{player.username}</div>
                        <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Rating: {player.rating}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-indigo-600">{player.wins}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Wins</div>
                    </div>
                  </div>
                ))}
                {(!data.analytics?.top_players || data.analytics.top_players.length === 0) && (
                  <div className="text-center text-gray-400 py-4 italic text-sm">No player data available</div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

// Helper Component for the Top Cards
interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor: string;
}

const KPICard = ({ title, value, icon, bgColor }: KPICardProps) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow group">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
    <div className={`p-3 rounded-xl ${bgColor} group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
  </div>
);


export default Dashboard;