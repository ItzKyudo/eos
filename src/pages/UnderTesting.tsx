import React, { useState } from 'react';

const UnderTesting = () => {
  const [clickCount, setClickCount] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleIconClick = () => {
    if (clickCount + 1 >= 3) {
      setShowLogin(true);
    } else {
      setClickCount(prev => prev + 1);
    }
  };

  // 2. Verify Password and Save to LocalStorage
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'hapee') {
      localStorage.setItem('site_bypass', 'true');
      window.location.reload(); 
    } else {
      setError('Invalid access code');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center border border-gray-200">
        
        {/* CLICK THIS ICON 3 TIMES */}
        <div 
          onClick={handleIconClick}
          className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6 cursor-pointer hover:bg-yellow-200 transition-colors select-none"
        >
          <svg className="h-10 w-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Under Testing
        </h1>
        
        <p className="text-gray-600 mb-6">
          We are currently performing scheduled maintenance and testing to improve your experience. We'll be back shortly!
        </p>

        {/* Normal User Button */}
        {!showLogin && (
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition duration-300"
          >
            Check for Updates
          </button>
        )}

        {/* Hidden Admin Login (Revealed after 3 clicks) */}
        {showLogin && (
          <form onSubmit={handleLogin} className="mt-4 animate-fade-in">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Admin Code"
              className="w-full px-4 py-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <button 
              type="submit"
              className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded transition duration-300"
            >
              Unlock Site
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UnderTesting;