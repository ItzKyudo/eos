import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../images/logo.png';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://eos-server-jxy0.onrender.com/api/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Account creation failed');
      }

      const data = await response.json();
      console.log('Account created:', data);

      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#262522] flex items-center justify-center p-6 font-sans selection:bg-[#2c4dbd]/30">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#2c4dbd]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#e63e3e]/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-4xl bg-[#21201d] rounded-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/5 flex flex-col md:flex-row-reverse overflow-hidden">
        <div className="md:w-5/12 bg-[#1a1917] p-12 flex flex-col justify-between border-l border-white/5">
          <div>
            <Link to="/">
              <img src={logoImg} alt="EOS Logo" className="w-16 h-16 rounded-2xl mb-8" />
            </Link>
            <h2 className="text-4xl font-black text-white leading-tight tracking-tighter mb-4">
              JOIN THE <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#e63e3e] to-[#2c4dbd]">
                ELITE.
              </span>
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Create your operative profile today. Gain access to competitive ladders, detailed performance tracking, and exclusive community events.
            </p>
          </div>
        </div>

        {/* Left Side: Register Form */}
        <div className="flex-1 p-12 lg:p-16">
          <form className="space-y-5" onSubmit={handleRegister}>
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold text-gray-500 ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#2c4dbd] transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-[#262522] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 outline-hidden focus:border-[#2c4dbd]/50 focus:ring-4 focus:ring-[#2c4dbd]/10 transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold text-gray-500 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#2c4dbd] transition-colors" size={20} />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#262522] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 outline-hidden focus:border-[#2c4dbd]/50 focus:ring-4 focus:ring-[#2c4dbd]/10 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold text-gray-500 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#e63e3e] transition-colors" size={20} />
                <input
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#262522] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 outline-hidden focus:border-[#e63e3e]/50 focus:ring-4 focus:ring-[#e63e3e]/10 transition-all"
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-linear-to-r from-[#e63e3e] to-[#2c4dbd] text-white py-4 rounded-xl font-black flex items-center justify-center gap-3 group hover:brightness-110 transition-all shadow-lg active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-white font-bold hover:text-[#2c4dbd] transition-colors">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;