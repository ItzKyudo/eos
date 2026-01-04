import React from "react";
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import { LogOut, Bell, Shield, Palette, Volume2, Globe } from 'lucide-react';

const SettingsPage: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="flex min-h-screen bg-[#262522] text-[#bababa] font-sans selection:bg-[#e63e3e]/30 overflow-x-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col p-8 max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-white mb-8">Settings</h1>

                <div className="space-y-6">
                    {/* Account Section */}
                    <div className="bg-[#312e2b] rounded-xl p-6 border border-white/5">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Shield size={20} className="text-blue-400" />
                            Account
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-white/5">
                                <div>
                                    <p className="text-white font-medium">Email</p>
                                    <p className="text-sm text-gray-500">Manage your email address</p>
                                </div>
                                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">Change</button>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-white/5">
                                <div>
                                    <p className="text-white font-medium">Password</p>
                                    <p className="text-sm text-gray-500">Update your password</p>
                                </div>
                                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">Change</button>
                            </div>
                        </div>
                    </div>

                    {/* Preferences Section */}
                    <div className="bg-[#312e2b] rounded-xl p-6 border border-white/5">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Palette size={20} className="text-purple-400" />
                            Preferences
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <Globe size={18} className="text-gray-400" />
                                    <div>
                                        <p className="text-white font-medium">Language</p>
                                        <p className="text-sm text-gray-500">Choose your preferred language</p>
                                    </div>
                                </div>
                                <select className="bg-[#262522] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                                    <option>English</option>
                                    <option>Filipino</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <Volume2 size={18} className="text-gray-400" />
                                    <div>
                                        <p className="text-white font-medium">Sound Effects</p>
                                        <p className="text-sm text-gray-500">Enable game sounds</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Notifications Section */}
                    <div className="bg-[#312e2b] rounded-xl p-6 border border-white/5">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Bell size={20} className="text-yellow-400" />
                            Notifications
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-white/5">
                                <div>
                                    <p className="text-white font-medium">Game Invites</p>
                                    <p className="text-sm text-gray-500">Get notified when friends invite you</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Logout Section */}
                    <div className="bg-[#312e2b] rounded-xl p-6 border border-red-500/20">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <LogOut size={20} className="text-red-400" />
                            Session
                        </h2>
                        <p className="text-gray-400 text-sm mb-4">
                            Logging out will clear your session. You'll need to log in again to access your account.
                        </p>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30 px-6 py-3 rounded-xl font-bold transition-all"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SettingsPage;