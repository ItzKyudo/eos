import React, { useState } from 'react';
import { X, Clock, Zap, Target } from 'lucide-react';

interface ChallengeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSendChallenge: (timeControl: number) => void;
    friendName: string;
}

const ChallengeModal: React.FC<ChallengeModalProps> = ({ isOpen, onClose, onSendChallenge, friendName }) => {
    if (!isOpen) return null;

    const [selectedTime, setSelectedTime] = useState<number>(600); // Default Rapid 10m

    const handleSend = () => {
        onSendChallenge(selectedTime);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#1e293b] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden transform transition-all scale-100 p-6">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white">Challenge {friendName}</h2>
                        <p className="text-gray-400 text-sm">Select a time control</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <TimeOption
                        label="Rapid"
                        sub="10 min"
                        active={selectedTime === 600}
                        onClick={() => setSelectedTime(600)}
                        icon={<Clock size={20} />}
                    />
                    <TimeOption
                        label="Blitz"
                        sub="5 min"
                        active={selectedTime === 300}
                        onClick={() => setSelectedTime(300)}
                        icon={<Zap size={20} />}
                    />
                    <TimeOption
                        label="Bullet"
                        sub="1 min"
                        active={selectedTime === 60}
                        onClick={() => setSelectedTime(60)}
                        icon={<Target size={20} />}
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSend} className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 transition-all">
                        Send Challenge
                    </button>
                </div>

            </div>
        </div>
    );
};

const TimeOption = ({ label, sub, active, onClick, icon }: any) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2
            ${active
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                : 'bg-[#0f172a] border-transparent text-gray-500 hover:border-white/10 hover:text-gray-300'
            }
        `}
    >
        <div className={active ? 'text-blue-400' : 'opacity-70'}>{icon}</div>
        <div className="font-bold text-sm">{label}</div>
        <div className="text-xs opacity-60">{sub}</div>
    </button>
);

export default ChallengeModal;
