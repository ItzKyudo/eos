import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, LogOut } from 'lucide-react';

const SessionTimeout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        // Check if user is trying to access a protected route without a token
        const token = sessionStorage.getItem('token');

        // List of public routes that don't require authentication
        const publicRoutes = ['/', '/login', '/register', '/learn', '/puzzle'];
        const isPublicRoute = publicRoutes.some(route => location.pathname === route);

        // Show modal if:
        // 1. No token exists (session expired or browser was closed)
        // 2. User is trying to access a protected route
        // 3. Not already on login/register page
        if (!token && !isPublicRoute && location.pathname !== '/login' && location.pathname !== '/register') {
            setShowModal(true);
        } else {
            setShowModal(false);
        }
    }, [location.pathname]);

    const handleLoginRedirect = () => {
        setShowModal(false);
        navigate('/login');
    };

    const handleGoHome = () => {
        setShowModal(false);
        navigate('/');
    };

    if (!showModal) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="relative bg-[#262522] w-full max-w-md p-8 rounded-3xl border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-[#e63e3e]/10 flex items-center justify-center">
                        <Clock className="text-[#e63e3e]" size={32} />
                    </div>
                </div>

                {/* Content */}
                <div className="text-center space-y-3 mb-8">
                    <h2 className="text-3xl font-black text-white tracking-tighter">
                        SESSION EXPIRED
                    </h2>
                    <p className="text-gray-400 font-medium">
                        Your session has expired. Please log in again to continue.
                    </p>

                    <p className="text-gray-500 text-sm mt-4">
                        Sessions expire when you close your browser or log out for security purposes.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleLoginRedirect}
                        className="w-full bg-gradient-to-r from-[#2c4dbd] to-[#e63e3e] text-white py-4 rounded-xl font-black flex items-center justify-center gap-3 group hover:brightness-110 transition-all shadow-lg active:scale-[0.98]"
                    >
                        <LogOut size={20} />
                        GO TO LOGIN
                    </button>

                    <button
                        onClick={handleGoHome}
                        className="w-full bg-transparent border-2 border-white/10 text-gray-400 py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-white/5 transition-all"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionTimeout;
