import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, LogOut } from 'lucide-react';

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
const WARNING_TIME = 60 * 1000; // 1 minute warning before logout

const SessionTimeout: React.FC = () => {
    const navigate = useNavigate();
    const [showWarning, setShowWarning] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const logout = useCallback(() => {
        // Clear session storage
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        // Clear all timers
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        // Navigate to login
        navigate('/login');
    }, [navigate]);

    const resetTimer = useCallback(() => {
        // Clear existing timers
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        // Hide warning if showing
        setShowWarning(false);
        setCountdown(60);

        // Only set timers if user is logged in
        const token = sessionStorage.getItem('token');
        if (!token) return;

        // Set warning timer (show warning 1 minute before logout)
        warningTimerRef.current = setTimeout(() => {
            setShowWarning(true);
            setCountdown(60);

            // Start countdown
            countdownIntervalRef.current = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        logout();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }, IDLE_TIMEOUT - WARNING_TIME);

        // Set logout timer (auto logout after full idle time)
        idleTimerRef.current = setTimeout(() => {
            logout();
        }, IDLE_TIMEOUT);
    }, [logout]);

    const handleStayLoggedIn = () => {
        resetTimer();
    };

    useEffect(() => {
        // Check if user is logged in
        const token = sessionStorage.getItem('token');
        if (!token) return;

        // Activity events to track
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

        // Reset timer on any activity
        events.forEach((event) => {
            window.addEventListener(event, resetTimer);
        });

        // Initialize timer
        resetTimer();

        // Cleanup
        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, resetTimer);
            });
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, [resetTimer]);

    if (!showWarning) return null;

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
                        SESSION EXPIRING
                    </h2>
                    <p className="text-gray-400 font-medium">
                        You've been inactive for a while. Your session will expire in:
                    </p>

                    {/* Countdown */}
                    <div className="py-4">
                        <div className="text-6xl font-black text-[#e63e3e] tracking-tighter">
                            {countdown}s
                        </div>
                    </div>

                    <p className="text-gray-500 text-sm">
                        Click below to stay logged in or you'll be automatically logged out.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleStayLoggedIn}
                        className="w-full bg-gradient-to-r from-[#2c4dbd] to-[#e63e3e] text-white py-4 rounded-xl font-black flex items-center justify-center gap-3 group hover:brightness-110 transition-all shadow-lg active:scale-[0.98]"
                    >
                        <Clock size={20} />
                        STAY LOGGED IN
                    </button>

                    <button
                        onClick={logout}
                        className="w-full bg-transparent border-2 border-white/10 text-gray-400 py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-white/5 transition-all"
                    >
                        <LogOut size={20} />
                        Log Out Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionTimeout;
