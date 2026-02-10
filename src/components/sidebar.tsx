import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoImg from '../images/logo.png';
import { Play, ShoppingCart, Users, BookOpen, Settings, Search, User2 } from 'lucide-react';


const Sidebar: React.FC = () => {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Global Invite Listener moved to GlobalInviteHandler
  // const { incomingChallenge, acceptChallenge, declineChallenge } = useFriendsStatus({ enableInvites: true });

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, [location.pathname]); // Re-check on route change

  // Match Found Listener moved to GlobalInviteHandler

  return (
    <>
      {/* InviteReceivedModal moved to GlobalInviteHandler */}

      {/* Spacer for fixed sidebar */}
      <div className="hidden md:block w-20 flex-shrink-0" />

      <aside className="fixed left-0 top-0 h-screen w-20 bg-[#262421] flex flex-col items-center py-6 border-r border-white/5 hidden md:flex z-50 shadow-xl">

        {/* Brand Logo */}
        <Link to="/" className="mb-8 p-2 hover:bg-white/5 rounded-xl transition-colors">
          <img
            src={logoImg}
            alt="EOS Logo"
            className="w-10 h-10 rounded-lg shadow-lg"
          />
        </Link>

        {/* Navigation */}
        <nav className="flex flex-col gap-4 w-full px-2">
          {isLoggedIn && (
            <SidebarItem
              to="/game"
              icon={<Play size={24} className="ml-0.5" />}
              label="Play"
              active={location.pathname === '/game'}
            />
          )}
          {isLoggedIn && (
            <SidebarItem
              to="/profile"
              icon={<User2 size={24} />}
              label="Profile"
              active={location.pathname === '/profile'}
            />
          )}
          <SidebarItem
            to="/puzzle"
            icon={<Search size={24} />}
            label="Puzzles"
            active={location.pathname === '/puzzle'}
          />
          <SidebarItem
            to="/learn"
            icon={<BookOpen size={24} />}
            label="Learn"
            active={location.pathname === '/learn'}
          />
          {isLoggedIn && (
            <SidebarItem
              to="/social"
              icon={<Users size={24} />}
              label="Social"
              active={location.pathname === '/social'}
            />
          )}
          <SidebarItem
            to="/market"
            icon={<ShoppingCart size={24} />}
            label="Store"
            active={location.pathname === '/market'}
          />
        </nav>

        {/* Footer */}
        {/* <div className="mt-auto w-full px-2 mb-2">
          {isLoggedIn && (
            <SidebarItem
              to="/settings"
              icon={<Settings size={24} />}
              label="Settings"
              active={location.pathname === '/settings'}
            />
          )}
        </div> */}
      </aside>
    </>
  );
};

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, active = false }) => (
  <Link to={to} className="group relative flex justify-center w-full">
    <div className={`
      relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300
      ${active
        ? 'bg-linear-to-br from-[#2c4dbd] to-[#e63e3e] text-white shadow-lg scale-105'
        : 'text-gray-400 hover:text-gray-100 hover:bg-white/10'}
    `}>
      {icon}
    </div>

    {/* Minimalist Tooltip */}
    <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-black/90 text-white text-[11px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 uppercase tracking-wider shadow-xl border border-white/10 translate-x-2 group-hover:translate-x-0 duration-200">
      {label}
    </span>
  </Link>
);

export default Sidebar;