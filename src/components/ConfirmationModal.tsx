import React from 'react';
import { AlertTriangle, Check, X, Info } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info' | 'success';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = 'danger' // Default to danger for destructive actions like delete
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertTriangle size={32} className="text-red-400 animate-pulse" />;
            case 'success': return <Check size={32} className="text-green-400 animate-bounce" />;
            case 'info':
            default: return <Info size={32} className="text-blue-400 animate-pulse" />;
        }
    };

    const getConfirmButtonClass = () => {
        switch (type) {
            case 'danger': return "bg-red-600 hover:bg-red-500 shadow-red-900/20";
            case 'success': return "bg-green-600 hover:bg-green-500 shadow-green-900/20";
            case 'info':
            default: return "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20";
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
            {/* Modal Container - Responsive width */}
            <div className="bg-[#1e293b] w-full max-w-sm md:max-w-md p-6 rounded-xl border border-slate-600 shadow-2xl relative transform transition-all scale-100">

                <div className="text-center mb-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border bg-opacity-20 ${type === 'danger' ? 'bg-red-600 border-red-500/30' :
                            type === 'success' ? 'bg-green-600 border-green-500/30' :
                                'bg-blue-600 border-blue-500/30'
                        }`}>
                        {getIcon()}
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
                    <p className="text-gray-300 text-sm md:text-base">
                        {message}
                    </p>
                </div>

                <div className="flex gap-3 flex-col sm:flex-row">
                    <button
                        onClick={onClose}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-gray-300 hover:bg-slate-700 transition-colors border border-slate-600"
                    >
                        <X size={18} />
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-white transition-colors shadow-lg ${getConfirmButtonClass()}`}
                    >
                        <Check size={18} />
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
