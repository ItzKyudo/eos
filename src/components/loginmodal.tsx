import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { X, User, LogIn, Play } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTime?: number;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, selectedTime = 600 }) => {
  const navigate = useNavigate(); // Initialize the navigate function
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check auth status whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-[#262522] w-full max-w-[90%] sm:max-w-md p-6 sm:p-10 rounded-2xl sm:rounded-[2rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] transform transition-all duration-300 scale-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-500 hover:text-white transition-colors p-1"
        >
          <X size={24} />
        </button>

        <div className="text-center space-y-2 sm:space-y-3 mb-6 sm:mb-10">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tighter">
            THE ARENA AWAITS
          </h2>
          <p className="text-sm sm:text-base text-gray-400 font-medium">
            How would you like to enter?
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4">
          {!isLoggedIn ? (
            <>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center justify-between group bg-[#2c4dbd] hover:bg-[#3659d4] text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl font-bold text-lg sm:text-xl transition-all border-b-4 border-blue-900 active:border-b-0 active:translate-y-1"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <LogIn size={20} className="sm:w-6 sm:h-6" />
                  <span>Login / Sign Up</span>
                </div>
                <div className="text-[10px] bg-white/20 px-2 py-1 rounded uppercase tracking-widest hidden sm:block">Ranked</div>
              </button>

              <button
                onClick={() => navigate(`/guest-matchmaking?time=${selectedTime}`)}
                className="flex items-center justify-between group bg-[#312e2b] hover:bg-[#3d3935] text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl font-bold text-lg sm:text-xl transition-all border-b-4 border-black/60 active:border-b-0 active:translate-y-1"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <User size={20} className="text-[#e63e3e] sm:w-6 sm:h-6" />
                  <span>Play as Guest</span>
                </div>
                <div className="text-[10px] bg-black/40 px-2 py-1 rounded uppercase tracking-widest text-gray-400 hidden sm:block">Casual</div>
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate(`/matchmaking?time=${selectedTime}`)}
              className="flex items-center justify-between group bg-[#2c4dbd] hover:bg-[#3659d4] text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl font-bold text-lg sm:text-xl transition-all border-b-4 border-blue-900 active:border-b-0 active:translate-y-1"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <Play size={20} fill="white" className="sm:w-6 sm:h-6" />
                <span>Play Ranked Match</span>
              </div>
              <div className="text-[10px] bg-white/20 px-2 py-1 rounded uppercase tracking-widest hidden sm:block">Online</div>
            </button>
          )}
        </div>

        <p className="mt-6 sm:mt-8 text-center text-[10px] sm:text-xs text-gray-500 italic leading-relaxed">
          *Guest accounts do not save ERS or match history.
        </p>
      </div>
    </div>
  );
};

export default LoginModal;