import React, { useState, useEffect } from 'react';
import { X, Gamepad2, Zap, Target, Clock, Hourglass } from 'lucide-react';
import { useGameModes } from '../../hooks/useGameModes';

interface SentInviteModalProps {
    isOpen: boolean;
    friendName: string;
    timeControl: number;
    onCancel: () => void;
    onTimeout: () => void;
}

// Helper to get icons for modes
const getIconForMode = (title: string, size = 18) => {
    const t = title.toLowerCase();
    if (t.includes('bullet')) return <Zap size={size} className="text-yellow-400" />;
    if (t.includes('blitz')) return <Target size={size} className="text-red-400" />;
    if (t.includes('rapid')) return <Clock size={size} className="text-blue-400" />;
    if (t.includes('classic')) return <Hourglass size={size} className="text-green-400" />;
    return <Gamepad2 size={size} className="text-gray-400" />;
};

const SentInviteModal: React.FC<SentInviteModalProps> = ({
    isOpen,
    friendName,
    timeControl,
    onCancel,
    onTimeout
}) => {
    const [secondsLeft, setSecondsLeft] = useState(30); // 30 second timeout for invite
    const { getModeByDuration } = useGameModes();

    useEffect(() => {
        if (!isOpen) {
            setSecondsLeft(30);
            return;
        }

        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, onTimeout]);

    if (!isOpen) return null;

    const matchedMode = getModeByDuration(timeControl);
    const mode = matchedMode
        ? { label: matchedMode.title, icon: getIconForMode(matchedMode.title) }
        : { label: 'Custom', icon: <Gamepad2 size={18} className="text-blue-400" /> };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-[#1e293b] w-full max-w-sm p-6 rounded-xl border border-white/10 shadow-2xl relative overflow-hidden">

                {/* Progress Bar Background */}
                <div className="absolute bottom-0 left-0 h-1 bg-blue-600/20 w-full" />
                <div
                    className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${(secondsLeft / 30) * 100}%` }}
                />

                <div className="text-center mb-6">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                        <div
                            className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"
                            style={{ animationDuration: '3s' }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Gamepad2 size={32} className="text-blue-400" />
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2">Invite Sent!</h2>
                    <p className="text-gray-400 text-sm">
                        Waiting for <span className="text-blue-400 font-bold">{friendName}</span> to accept...
                    </p>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Match Mode</span>
                        <div className="flex items-center gap-2 px-2 py-1 bg-blue-900/30 rounded text-blue-300 text-xs font-bold border border-blue-500/20">
                            {mode.icon}
                            {mode.label}
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Expires in</span>
                        <span className="text-white font-mono font-bold">{secondsLeft}s</span>
                    </div>
                </div>

                <button
                    onClick={onCancel}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-gray-300 hover:bg-red-900/20 hover:text-red-400 hover:border-red-500/50 transition-all border border-slate-700 bg-slate-800/30"
                >
                    <X size={18} />
                    Cancel Invitation
                </button>
            </div>
        </div>
    );
};

export default SentInviteModal;
