import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../images/logo.png';
import { Mail, Lock, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inside login.tsx

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://eos-server.onrender.com/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      console.log('Login successful:', data.user)
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/game');
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#262522] flex items-center justify-center p-6 font-sans selection:bg-[#e63e3e]/30">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#2c4dbd]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#e63e3e]/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-4xl bg-[#21201d] rounded-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/5 flex flex-col md:flex-row overflow-hidden">

        {/* Left Side: Branding/Welcome */}
        <div className="md:w-5/12 bg-[#1a1917] p-12 flex flex-col justify-between border-r border-white/5">
          <div>
            <Link to="/">
              <img src={logoImg} alt="EOS Logo" className="w-16 h-16 rounded-2xl mb-8" />
            </Link>
            <h2 className="text-4xl font-black text-white leading-tight tracking-tighter mb-4">
              WELCOME <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#2c4dbd] to-[#e63e3e]">
                BACK.
              </span>
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your next tactical victory is waiting. Log in to access your matches, stats, and rewards.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex-1 p-12 lg:p-16">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold text-gray-500 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#2c4dbd] transition-colors" size={20} />
                <input
                  type="email"
                  placeholder="Enter Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#262522] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 outline-hidden focus:border-[#2c4dbd]/50 focus:ring-4 focus:ring-[#2c4dbd]/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs uppercase tracking-widest font-bold text-gray-500 ml-1">Password</label>
                <a href="#" className="text-[10px] text-[#e63e3e] font-bold hover:underline">FORGOT?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#e63e3e] transition-colors" size={20} />
                <input
                  type="password"
                  placeholder="Enter Your Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#262522] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 outline-hidden focus:border-[#e63e3e]/50 focus:ring-4 focus:ring-[#e63e3e]/10 transition-all"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm font-bold">{error}</p>}

            <button
              disabled={loading}
              className="w-full bg-linear-to-r from-[#2c4dbd] to-[#e63e3e] text-white py-4 rounded-xl font-black flex items-center justify-center gap-3 group hover:brightness-110 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          <p className="mt-10 text-center text-sm text-gray-500">
            New to EOS? <Link to="/register" className="text-white font-bold hover:text-[#e63e3e] transition-colors">Create an Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;