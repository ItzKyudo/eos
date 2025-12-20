import React from "react";
import Sidebar from '../components/sidebar'; 

const SettingsPage: React.FC = () => {
    return (
        <div className="flex min-h-screen bg-[#262522] text-[#bababa] font-sans selection:bg-[#e63e3e]/30 overflow-x-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col items-center justify-center p-8"> 
                <h1 className="text-4xl font-bold text-white mb-6">Settings</h1>
                <p className="text-lg text-gray-400">This is the settings page. Settings options will be available here in the future.</p>
            </main>
        </div>
    );
};

export default SettingsPage;