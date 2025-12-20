import React, { useState } from 'react';
import Sidebar from '../components/sidebar'; 
import LoginModal from '../components/loginmodal';
import boardImg from '../images/image.png';
import { Play, Users, Zap, Globe, Trophy } from 'lucide-react';

const LandingPage: React.FC = () => {
  // State to manage the visibility of the Login/Guest modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="flex min-h-screen bg-[#262522] text-[#bababa] font-sans selection:bg-[#e63e3e]/30 overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col items-center">
        <section className="w-full max-w-7xl flex flex-col lg:flex-row items-center lg:items-start justify-center p-8 lg:p-24 lg:pt-16 gap-16">
          <div className="flex-1 w-full max-w-150 lg:-mt-4 transition-all duration-500">
            <div className="relative group">
              <div className="absolute -inset-4 bg-linear-to-tr from-[#2c4dbd]/20 to-[#e63e3e]/20 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
              
              <div className="relative">
                <img 
                  src={boardImg} 
                  alt="EOS Philippine Chess Board" 
                  className="w-full h-auto rounded-lg shadow-[0_30px_60px_rgba(0,0,0,0.6)] border-[12px] border-[#312e2b] transform transition-all duration-700 group-hover:scale-[1.02] group-hover:-rotate-1"
                />
                
                <div className="absolute -bottom-2 -right-2 bg-[#312e2b] px-5 py-2.5 rounded-md text-[10px] tracking-[0.2em] font-bold text-white border border-white/10 shadow-2xl backdrop-blur-md">
                  BOARD: 17x13 CIRCULAR GRID
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-10 text-center lg:text-left">
            <header className="space-y-6">
              <h1 className="text-6xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter">
                EOS <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-[#2c4dbd] via-[#8c457d] to-[#e63e3e]">
                  Juego de Tactica
                </span>
              </h1>
              
              <div className="space-y-4">
                <p className="text-2xl text-white/90 font-medium italic tracking-tight">
                  "It's not just chess, <span className="text-[#e63e3e]">it's more than chess.</span>"
                </p>
                <p className="text-lg text-gray-400 max-w-md mx-auto lg:mx-0 leading-relaxed">
                  Invented by Rodney I. Ebrole from Mindanao. Join the revolution of strategic board gaming.
                </p>
              </div>
            </header>
            <div className="flex justify-center lg:justify-start gap-8 py-4 border-y border-white/5">
              <div className="text-center lg:text-left">
                <div className="text-white font-bold text-xl">17x13</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500">Grid Size</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-white font-bold text-xl">7</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500">Unique Pieces</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-white font-bold text-xl">2-4</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500">Players</div>
              </div>
            </div>
            <div className="flex flex-col gap-5">
              <button 
                onClick={openModal}
                className="relative overflow-hidden group flex items-center justify-center gap-6 bg-linear-to-r from-[#2c4dbd] to-[#e63e3e] text-white py-7 rounded-2xl text-3xl font-black transition-all shadow-[0_8px_0_rgb(15,25,60)] active:shadow-none active:translate-y-2 hover:brightness-110"
              >
                <Play size={36} fill="white" />
                <span className="tracking-tighter">PLAY ONLINE</span>
              </button>

              <button 
                onClick={openModal}
                className="flex items-center justify-center gap-4 bg-[#312e2b] hover:bg-[#3d3935] text-white py-5 rounded-2xl text-xl font-bold transition-all border-b-4 border-black/60 active:border-b-0 active:translate-y-1"
              >
                <Users size={24} className="text-[#2c4dbd]" />
                Play a Friend
              </button>
            </div>
          </div>
        </section>
        <section className="w-full bg-[#21201d] py-20 px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Zap className="text-[#e63e3e]" size={32} />}
              title="Dynamic Tactics"
              description="A unique circular grid creates new movement patterns that traditional chess players have never encountered."
            />
            <FeatureCard 
              icon={<Globe className="text-[#2c4dbd]" size={32} />}
              title="Global Community"
              description="Connect with players from WMSU to the rest of the world in real-time matches."
            />
            <FeatureCard 
              icon={<Trophy className="text-[#8c457d]" size={32} />}
              title="Competitive Play"
              description="Join tournaments, climb the leaderboards, and master the art of EOS Juego de Tactica."
            />
          </div>
        </section>
        <footer className="w-full p-12 text-center text-sm text-gray-600 border-t border-white/5">
          © 2026 EOS Juego de Tactica. All Rights Reserved. WMSU, Philippines.
        </footer>
      </main>
      <LoginModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
      />
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-4 p-6 rounded-2xl bg-[#262522] border border-white/5 hover:border-[#e63e3e]/30 transition-colors">
    <div className="p-3 bg-black/20 rounded-xl">{icon}</div>
    <h3 className="text-xl font-bold text-white">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;