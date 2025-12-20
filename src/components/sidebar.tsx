import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoImg from '../images/logo.png';
import { Play, ShoppingCart, Users, BookOpen, Settings, Search } from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <> 
      <div className="hidden md:block w-24 lg:w-32 flex-shrink-0" />

      <aside className="fixed left-0 top-0 h-screen w-24 lg:w-32 bg-[#21201d] flex flex-col items-center py-8 border-r border-white/5 hidden md:flex z-50">
        
        {/* Brand Logo - Links to Landing Page */}
        <Link to="/" className="relative group mb-12">
          <div className="absolute -inset-2 bg-linear-to-tr from-[#2c4dbd]/20 to-[#e63e3e]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <img 
            src={logoImg} 
            alt="EOS Logo" 
            className="relative w-12 h-12 lg:w-16 lg:h-16 rounded-xl shadow-2xl transition-transform duration-500 group-hover:scale-110" 
          />
        </Link>
        
        {/* Navigation */}
        <nav className="flex flex-col gap-3 w-full px-3">
          <SidebarItem 
            to="/" 
            icon={<Play size={22} />} 
            label="Play" 
            active={location.pathname === '/'} 
          />
          <SidebarItem 
            to="/puzzle" 
            icon={<Search size={22} />} 
            label="Puzzles" 
            active={location.pathname === '/puzzle'} 
          />
          <SidebarItem 
            to="/learn" 
            icon={<BookOpen size={22} />} 
            label="Learn" 
            active={location.pathname === '/learn'} 
          />
          <SidebarItem 
            to="/social" 
            icon={<Users size={22} />} 
            label="Social" 
            active={location.pathname === '/social'} 
          />
          <SidebarItem 
            to="/market" 
            icon={<ShoppingCart size={22} />} 
            label="Store" 
            active={location.pathname === '/market'} 
          />
        </nav>

        {/* Footer */}
        <div className="mt-auto w-full px-3">
          <SidebarItem 
            to="/settings" 
            icon={<Settings size={22} />} 
            label="Settings" 
            active={location.pathname === '/settings'} 
          />
        </div>
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
  <Link to={to} className={`
    relative group flex flex-col items-center justify-center w-full py-4 rounded-xl transition-all duration-300
    ${active 
      ? 'bg-[#312e2b] text-white shadow-inner shadow-black/20' 
      : 'text-gray-500 hover:text-white hover:bg-white/5'}
  `}>
    {active && (
      <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-linear-to-b from-[#2c4dbd] to-[#e63e3e] rounded-r-full" />
    )}
    
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
      {icon}
    </div>
    
    <span className="text-[10px] mt-2 font-black uppercase tracking-widest leading-none text-center">
      {label}
    </span>
  </Link>
);

export default Sidebar;