import React from 'react';
import { Gamepad2, X, Check } from 'lucide-react';

interface InviteReceivedModalProps {
    isOpen: boolean;
    challengerName: string;
    timeControl: number;
    onAccept: () => void;
    onDecline: () => void;
}

const InviteReceivedModal: React.FC<InviteReceivedModalProps> = ({
    isOpen,
    challengerName,
    timeControl,
    onAccept,
    onDecline
}) => {
    if (!isOpen) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        return `${mins} min`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-[#1e293b] w-full max-w-sm p-6 rounded-xl border border-blue-500/50 shadow-[0_0_50px_rgba(37,99,235,0.3)] relative">

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                        <Gamepad2 size={32} className="text-blue-400 animate-pulse" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Game Invite</h2>
                    <p className="text-gray-300">
                        <span className="font-bold text-white">{challengerName}</span> invited you to play!
                    </p>
                    <div className="mt-2 inline-block px-3 py-1 bg-slate-700/50 rounded-lg border border-slate-600 text-sm font-mono text-blue-200">
                        {formatTime(timeControl)} Match
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onDecline}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-gray-300 hover:bg-slate-700 transition-colors border border-slate-600"
                    >
                        <X size={18} />
                        Decline
                    </button>
                    <button
                        onClick={onAccept}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
                    >
                        <Check size={18} />
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InviteReceivedModal;
