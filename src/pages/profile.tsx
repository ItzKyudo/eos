import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import { UserProfile, GameHistoryEntry } from '../components/profile/types';

import ProfileHeader from '../components/profile/ProfileHeader';
import StatsGrid from '../components/profile/StatsGrid';
import GamesTable from '../components/profile/GamesTable';
import EditProfileModal from '../components/profile/EditProfileModal';
import FriendsList from '../components/profile/FriendsList';

const Profile: React.FC = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAds, setShowAds] = useState(true);

  // --- ACTIONS ---
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  }, [navigate]);


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        const response = await fetch('https://eos-server-jxy0.onrender.com/api/profile', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          if (response.status === 401) handleLogout();
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setUser(data);
        if (data.show_ads !== undefined) setShowAds(data.show_ads);

      } catch (err: any) {
        console.error(err);
        setError('Could not load profile data');
      } finally {
        setLoading(false);
      }
    };

    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('https://eos-server-jxy0.onrender.com/api/profile/history?limit=20', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Format relative time if needed, or do it in component
          // The component expects 'date' string. Let's process it a bit if needed.
          // Assuming db returns ISO string.
          const processed = data.map((g: any) => ({
            ...g,
            date: new Date(g.date).toLocaleDateString() // Simple format
          }));
          setGameHistory(processed);
        }
      } catch (e) {
        console.error("History fetch error", e);
      }
    };

    fetchProfile();
    fetchHistory();
  }, [navigate, handleLogout]);

  const handleUpdateStatus = async (newStatus: string) => {
    // Optimistic Update
    setUser(prev => prev ? { ...prev, status_message: newStatus } : null);

    try {
      const token = localStorage.getItem('token');
      await fetch('https://eos-server-jxy0.onrender.com/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status_message: newStatus })
      });
    } catch (err) {
      console.error("Status update failed");
    }
  };

  const handleSaveProfile = async (username: string, email: string, avatar_url?: string) => {
    try {
      const token = localStorage.getItem('token');
      const body: { username: string; email: string; avatar_url?: string } = { username, email };
      if (avatar_url) body.avatar_url = avatar_url;

      const response = await fetch('https://eos-server-jxy0.onrender.com/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      // Update local state
      setUser(prev => prev ? {
        ...prev,
        username: data.user.username,
        email: data.user.email,
        avatar_url: data.user.avatar_url
      } : null);
    } catch (err: any) {
      console.error("Profile update error:", err);
      throw new Error(err.message || "Failed to update profile");
    }
  };

  // const gameHistory: GameHistoryEntry[] = []; // Removed mock
  // Friends list fetched via FriendsList component now

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">LOADING...</div>;
  if (error) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-red-400">{error}</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] font-sans text-gray-100 overflow-hidden relative">
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10 pointer-events-none z-0" />
      <div className="relative z-10"><Sidebar /></div>

      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveProfile}
        initialData={{
          username: user?.username || '',
          email: user?.email || '',
          avatar_url: user?.avatar_url
        }}
      />

      <main className="flex-1 h-screen overflow-y-auto relative z-10 p-6 lg:p-10 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">

        <ProfileHeader
          user={user}
          status={user?.status_message || ''}
          onUpdateStatus={handleUpdateStatus}
          onEditClick={() => setShowEditModal(true)}
          onLogout={handleLogout}
        />

        <nav className="flex gap-2 border-b border-slate-700 mb-8 px-2 overflow-x-auto">
          {['overview', 'games', 'friends'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-6 font-bold text-sm uppercase transition-all ${activeTab === tab ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400'}`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {activeTab === 'overview' && (
          <div className="flex flex-col xl:flex-row gap-8 animate-fadeIn">
            <div className="flex-1 space-y-6">
              <StatsGrid user={user} />

              {showAds && (
                <div className="bg-gradient-to-r from-blue-900 to-[#09357A] p-6 rounded-xl flex items-center justify-between shadow-lg">
                  <div>
                    <h3 className="font-bold text-white text-lg">Support the Game</h3>
                    <p className="text-blue-200 text-sm">Remove ads and get a cool badge.</p>
                  </div>
                  <button onClick={() => setShowAds(false)} className="bg-white/10 text-white border border-white/20 px-4 py-2 rounded-lg text-sm font-bold">Hide Ads</button>
                </div>
              )}

              <GamesTable games={gameHistory} />
            </div>

            <aside className="w-full xl:w-80 flex-shrink-0 space-y-6">
              <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-md">
                <h3 className="font-bold text-gray-200 mb-4">Friends Online</h3>

                <FriendsList className="flex flex-col gap-1" limit={10} showInvite={false} />
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;