import { LayoutDashboard, Users, ShoppingBag, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const path = location.pathname;

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/admin/dashboard' },
    { name: 'Manage Users', icon: <Users size={20} />, href: '/admin/users' },
    { name: 'Manage Items', icon: <ShoppingBag size={20} />, href: '/admin/items' },
    { name: 'Manage Orders', icon: <ShoppingBag size={20} />, href: '/admin/orders' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo Area */}
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <img src="../../src/images/logo.png" alt="EOS Logo" className="w-8 h-8" />
        <span className="font-bold text-gray-800 text-lg">EOS Admin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = path === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;