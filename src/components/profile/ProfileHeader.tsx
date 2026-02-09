import React, { useState } from 'react';
import { UserProfile } from './types';

interface ProfileHeaderProps {
  user: UserProfile | null;
  status: string;
  onUpdateStatus: (newStatus: string) => Promise<void>;
  onEditClick: () => void;
  onLogout: () => void;
  isOwnProfile?: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, status, onUpdateStatus, onEditClick, onLogout, isOwnProfile = true }) => {
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [tempStatus, setTempStatus] = useState('');

  const handleStartEdit = () => {
    setTempStatus(status);
    setIsEditingStatus(true);
  };

  const handleSave = async () => {
    await onUpdateStatus(tempStatus);
    setIsEditingStatus(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '...';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-[#1e293b] p-8 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.3)] border-t-4 border-[#09357A] mb-8 flex flex-col md:flex-row justify-between items-start gap-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start w-full">
        {/* Avatar */}
        <div className="relative group">
          <div className="w-40 h-40 rounded-xl overflow-hidden border-4 border-[#1e293b] shadow-lg ring-2 ring-[#09357A]">
            <img
              src={user?.avatar_url || "/api/placeholder/200/200"}
              alt="Profile"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-[#1e293b]"></div>
        </div>

        <div className="flex flex-col gap-3 items-center md:items-start flex-1">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">{user?.username || 'Player'}</h1>
            <span className="text-3xl filter drop-shadow-lg">{user?.country_flag || '🇵🇭'}</span>
          </div>

          {/* Status Section - Only show for own profile */}
          {isOwnProfile && (
            <div className="flex items-center gap-3 w-full max-w-md">
              {isEditingStatus ? (
                <div className="flex w-full gap-2 animate-fadeIn">
                  <input
                    autoFocus
                    type="text"
                    className="bg-slate-900 border border-slate-600 rounded px-3 py-1 text-sm text-gray-200 w-full focus:outline-none focus:border-blue-500"
                    value={tempStatus}
                    onChange={(e) => setTempStatus(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    placeholder="What's on your mind?"
                  />
                  <button onClick={handleSave} className="text-green-400 hover:text-green-300 text-sm font-bold">SAVE</button>
                </div>
              ) : (
                <div
                  onClick={handleStartEdit}
                  className="flex items-center gap-2 text-slate-400 hover:text-blue-300 cursor-pointer transition group px-3 py-1 rounded hover:bg-slate-800/50 -ml-3"
                >
                  <span className="text-lg">📝</span>
                  <span className="italic truncate max-w-[300px]">{status || "Set your status..."}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-semibold text-slate-400 mt-2">
            <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">Joined {formatDate(user?.created_at)}</span>
            <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
            </span>
          </div>
        </div>

        {/* Buttons - Only show for own profile */}
        {isOwnProfile && (
          <div className="flex gap-3 mt-4 md:mt-0">
            <button onClick={onEditClick} className="bg-[#09357A] hover:bg-blue-800 text-white shadow-lg px-6 py-2 rounded-lg font-bold transition transform active:scale-95">Edit Profile</button>
            <button onClick={onLogout} className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30 px-4 py-2 rounded-lg font-bold transition">Logout</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;