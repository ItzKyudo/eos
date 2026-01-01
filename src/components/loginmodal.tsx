import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { X, User, LogIn } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate(); // Initialize the navigate function

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-[#262522] w-full max-w-md p-10 rounded-[2rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] transform transition-all duration-300 scale-100">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors p-1"
        >
          <X size={24} />
        </button>

        <div className="text-center space-y-3 mb-10">
          <h2 className="text-4xl font-black text-white tracking-tighter">
            THE ARENA AWAITS
          </h2>
          <p className="text-gray-400 font-medium">
            How would you like to enter?
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center justify-between group bg-[#2c4dbd] hover:bg-[#3659d4] text-white p-6 rounded-2xl font-bold text-xl transition-all border-b-4 border-blue-900 active:border-b-0 active:translate-y-1"
          >
            <div className="flex items-center gap-4">
              <LogIn size={24} />
              <span>Login / Sign Up</span>
            </div>
            <div className="text-[10px] bg-white/20 px-2 py-1 rounded uppercase tracking-widest">Ranked</div>
          </button>

          {/* Guest Option - Redirects to guest matchmaking */}
          <button 
            onClick={() => navigate('/guest-matchmaking')}
            className="flex items-center justify-between group bg-[#312e2b] hover:bg-[#3d3935] text-white p-6 rounded-2xl font-bold text-xl transition-all border-b-4 border-black/60 active:border-b-0 active:translate-y-1"
          >
            <div className="flex items-center gap-4">
              <User size={24} className="text-[#e63e3e]" />
              <span>Play as Guest</span>
            </div>
            <div className="text-[10px] bg-black/40 px-2 py-1 rounded uppercase tracking-widest text-gray-400">Casual</div>
          </button>
        </div>
        
        <p className="mt-8 text-center text-xs text-gray-500 italic leading-relaxed">
          *Guest accounts do not save ERS or match history.
        </p>
      </div>
    </div>
  );
};

export default LoginModal;