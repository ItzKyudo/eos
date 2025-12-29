import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, Play, Settings, 
  Handshake, ArrowRight, Zap, Check
} from 'lucide-react';

// --- IMPORTS ---
import Sidebar from '../../components/sidebar';
import { PIECES } from './mechanics/piecemovements'; 
import { INITIAL_POSITIONS } from './mechanics/positions';
import { BOARD_COLUMNS } from './utils/gameUtils'; 

// --- TYPES ---
type TimeControl = 600 | 300 | 60;

const GameSetup: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTime, setSelectedTime] = useState<TimeControl>(600);
  const [activeTab, setActiveTab] = useState<'new' | 'games' | 'players'>('new');

  const startGame = (mode: string = 'multiplayer') => {
    navigate(`/board?mode=${mode}&time=${selectedTime}`);
  };

  return (
    // THEME: Changed main background from Brown to Dark Slate/Navy (#0f172a)
    <div className="flex min-h-screen bg-[#0f172a] font-sans text-gray-100">
      <Sidebar />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col lg:flex-row h-screen overflow-hidden relative">
        
        {/* CENTER: BOARD PREVIEW */}
        <div className="flex-1 flex items-center justify-center bg-[#0f172a] p-4 lg:p-0 overflow-hidden relative z-10">
           {/* Background Decoration - Updated pattern opacity */}
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10 pointer-events-none" />
           
           <div className="transform scale-[0.35] sm:scale-[0.45] md:scale-[0.55] lg:scale-[0.60] xl:scale-[0.70] origin-center shadow-2xl transition-transform duration-500">
              <BoardPreview />
           </div>
        </div>

        {/* RIGHT: SETUP PANEL */}
        {/* THEME: Changed panel background to Lighter Slate (#1e293b) */}
        <div className="w-full lg:w-[420px] bg-[#1e293b] flex flex-col border-l border-white/5 z-20 shadow-2xl relative">
          
          {/* TABS */}
          <div className="p-4 border-b border-white/5 bg-[#0f172a]/50 backdrop-blur-sm">
            <div className="flex bg-[#0f172a] p-1 rounded-xl border border-white/5">
                {['new', 'games', 'players'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`
                            flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all
                            ${activeTab === tab 
                                // THEME: Active tab uses Logo Blue 
                                ? 'bg-[#09357A] text-white shadow-md' 
                                : 'text-gray-500 hover:text-gray-300 hover:bg-[#1e293b]'}
                        `}
                    >
                        {tab === 'new' ? 'New Game' : tab}
                    </button>
                ))}
            </div>
          </div>

          {/* PANEL CONTENT */}
          <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            
            {/* 1. Time Selection Section */}
            <div className="space-y-3">
                <div className="flex justify-between items-end">
                    <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Time Control</h2>
                    <span className="text-white font-bold text-sm bg-white/5 px-2 py-0.5 rounded">
                        {selectedTime / 60} min
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <TimeCard 
                        minutes="10" 
                        type="Rapid" 
                        active={selectedTime === 600} 
                        onClick={() => setSelectedTime(600)} 
                        icon={<Clock size={18} />}
                    />
                    <TimeCard 
                        minutes="5" 
                        type="Blitz" 
                        active={selectedTime === 300} 
                        onClick={() => setSelectedTime(300)} 
                        icon={<Zap size={18} />}
                    />
                    <TimeCard 
                        minutes="1" 
                        type="Bullet" 
                        active={selectedTime === 60} 
                        onClick={() => setSelectedTime(60)} 
                        icon={<Zap size={18} />}
                    />
                </div>
            </div>

            <div className="h-px bg-white/5 w-full" />
            <button 
              onClick={() => startGame()}
              className="
                group w-full relative overflow-hidden rounded-xl
                bg-gradient-to-r from-[#D63031] to-[#b02526]
                hover:from-[#e84546] hover:to-[#c92d2e]
                text-white 
                shadow-[0_6px_0_#7f1d1d]
                active:shadow-none active:translate-y-[6px]
                transition-all duration-150 ease-out
                /* Layout Fixes: */
                flex items-center justify-center py-6
              "
            >
              <div className="relative z-10 flex items-center gap-3 pointer-events-none">
                 <Play size={32} fill="currentColor" className="drop-shadow-md shrink-0" />
                 <span className="text-2xl font-black uppercase tracking-tight drop-shadow-md leading-none pb-1">
                    Play
                 </span>
              </div>
              
              {/* Shine Effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-shine bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 transition-all" />
            </button>

            <div className="text-center">
                <p className="text-xs text-gray-500 font-medium">Auto-matching based on rating</p>
            </div>

            <div className="h-px bg-white/5 w-full" />

            {/* 3. Secondary Actions */}
            <div className="space-y-3">
                <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Other Modes</h2>
               <MenuButton 
                  icon={<Settings size={20} />} 
                  title="Custom Challenge" 
                  subtitle="Create custom rules"
                  onClick={() => startGame('custom')}
               />
               <MenuButton 
                  icon={<Handshake size={20} />} 
                  title="Play a Friend" 
                  subtitle="Invite via link"
                  onClick={() => navigate('/board?mode=friend')}
               />
            </div>
          </div>

          {/* FOOTER STATS */}
          <div className="bg-[#0f172a] p-4 border-t border-white/5 flex justify-between items-center text-[10px] md:text-xs text-white/30 font-bold tracking-wider">
             <div className="flex items-center gap-2">
                {/* THEME: Changed online indicator to Red to match theme, or keep green for 'status' */}
                <span className="w-2 h-2 rounded-full bg-[#D63031] shadow-[0_0_8px_rgba(214,48,49,0.5)]"></span>
                <span>12,402 ONLINE</span>
             </div>
             <div className="flex items-center gap-1 opacity-50">
                <span>EOS CLUB</span>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const TimeCard: React.FC<{ 
    minutes: string; 
    type: string; 
    active: boolean; 
    onClick: () => void;
    icon: React.ReactNode;
}> = ({ minutes, type, active, onClick, icon }) => (
    <button 
        onClick={onClick}
        className={`
            relative p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all duration-200
            ${active 
                // THEME: Active Border is now Red (#D63031), BG is darker slate
                ? 'bg-[#1e293b] border-[#D63031] text-white shadow-lg -translate-y-1' 
                : 'bg-[#0f172a] border-transparent text-gray-500 hover:border-white/10 hover:text-gray-300 hover:bg-[#1e293b]'}
        `}
    >
        {active && (
            // THEME: Checkmark badge is now Red
            <div className="absolute -top-2 -right-2 bg-[#D63031] text-white p-0.5 rounded-full shadow-sm">
                <Check size={10} strokeWidth={4} />
            </div>
        )}
        <div className={active ? 'text-[#D63031]' : 'opacity-50'}>{icon}</div>
        <span className="text-xl font-black leading-none">{minutes}</span>
        <span className="text-[10px] uppercase font-bold opacity-60">{type}</span>
    </button>
);

const MenuButton: React.FC<{ 
    icon: React.ReactNode; 
    title: string; 
    subtitle: string; 
    onClick: () => void;
}> = ({ icon, title, subtitle, onClick }) => {
    return (
      <button 
        onClick={onClick}
        className={`
            w-full text-left bg-[#0f172a] hover:bg-[#162032] p-4 rounded-xl flex items-center justify-between 
            transition-all group border border-transparent hover:border-white/5 active:scale-[0.98]
        `}
      >
        <div className="flex items-center gap-4">
            {/* THEME: Icon hover color changed to Red */}
            <div className="p-2.5 bg-black/20 rounded-lg text-gray-400 group-hover:text-[#D63031] transition-colors">
                {icon}
            </div>
            <div>
                <h3 className="text-gray-200 font-bold text-sm group-hover:text-white transition-colors">{title}</h3>
                <p className="text-gray-600 text-xs font-medium">{subtitle}</p>
            </div>
        </div>
        <ArrowRight size={16} className="text-white/10 group-hover:text-white/50 transition-colors -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0" />
      </button>
    );
};

// --- BOARD PREVIEW ---
const BoardPreview: React.FC = () => {
    const circleSize = "w-17 h-17"; 
    const rowHeight = "h-12";       
    const gridWidth = 'w-[900px]';  
    const sideWidth = 'w-16';       

    const renderRows = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    
    // ... (getRowTiles and getPieceAtTile functions remain unchanged) ...
    // Note: I'm omitting the helper functions for brevity as they didn't change, 
    // but the logic inside the return statement below is updated with colors.
    
    const getRowTiles = (rowNum: number) => {
        let tiles: string[] = [];
        switch (rowNum) {
            case 13: tiles = ['A13', 'C13', 'E13', 'G13', 'I13', 'K13', 'M13', 'O13', 'Q13']; break;
            case 12: tiles = ['B12', 'D12', 'F12', 'H12', 'J12', 'L12', 'N12', 'P12']; break;
            case 11: tiles = ['A11', 'C11', 'E11', 'G11', 'I11', 'K11', 'M11', 'O11', 'Q11']; break;
            case 10: tiles = ['B10', 'D10', 'F10', 'H10', 'J10', 'L10', 'N10', 'P10']; break;
            case 9:  tiles = ['A9', 'C9', 'E9', 'G9', 'I9', 'K9', 'M9', 'O9', 'Q9']; break;
            case 8:  tiles = ['B8', 'D8', 'F8', 'H8', 'J8', 'L8', 'N8', 'P8']; break;
            case 7:  tiles = ['A7', 'C7', 'E7', 'G7', 'I7', 'K7', 'M7', 'O7', 'Q7']; break;
            case 6:  tiles = ['B6', 'D6', 'F6', 'H6', 'J6', 'L6', 'N6', 'P6']; break;
            case 5:  tiles = ['A5', 'C5', 'E5', 'G5', 'I5', 'K5', 'M5', 'O5', 'Q5']; break;
            case 4:  tiles = ['B4', 'D4', 'F4', 'H4', 'J4', 'L4', 'N4', 'P4']; break;
            case 3:  tiles = ['A3', 'C3', 'E3', 'G3', 'I3', 'K3', 'M3', 'O3', 'Q3']; break;
            case 2:  tiles = ['B2', 'D2', 'F2', 'H2', 'J2', 'L2', 'N2', 'P2']; break;
            case 1:  tiles = ['A1', 'C1', 'E1', 'G1', 'I1', 'K1', 'M1', 'O1', 'Q1']; break;
            default: tiles = [];
        }
        return tiles;
    };

    const getPieceAtTile = (coordinate: string) => {
        return (Object.keys(INITIAL_POSITIONS) as Array<keyof typeof INITIAL_POSITIONS>).find(key => INITIAL_POSITIONS[key] === coordinate);
    };

    return (
        // THEME: Board Background updated. 
        // bg-[#1e293b] (Dark Slate) instead of Green.
        // border-[#09357A] (Logo Blue) instead of dark green.
        <div className="relative bg-[#1e293b] p-8 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-[16px] border-[#09357A] flex flex-col items-center select-none pointer-events-none">
            <div className="flex items-center mb-4 w-full justify-center">
              <div className={`${sideWidth}`}></div>
              <div className={`flex justify-between ${gridWidth} px-10`}> 
                {/* THEME: Text color updated to soft blue-white */}
                {BOARD_COLUMNS.map((col) => <div key={col} className="text-slate-400 text-center font-bold text-xl w-12">{col}</div>)}
              </div>
              <div className={`${sideWidth}`}></div>
            </div>
            
            <div className="flex flex-col space-y-1"> 
              {renderRows.map((row) => {
                const currentTiles = getRowTiles(row); 
                const is9TileRow = currentTiles.length === 9;

                return (
                  <div key={row} className="flex items-center">
                    <div className={`${sideWidth} text-slate-400 font-bold text-xl ${rowHeight} flex items-center justify-end pr-6`}>{row}</div>
                    
                    <div className={`flex ${gridWidth} ${rowHeight} items-center justify-around ${!is9TileRow ? 'px-16' : 'px-4'}`}>
                      {currentTiles.map((coordinate, i) => {
                        const pieceId = getPieceAtTile(coordinate);
                        return (
                          <div
                            key={`${row}-${i}`}
                            className={`
                              relative ${circleSize} 
                              /* THEME: Tile gradient changed to Silver/Grey to match center of logo */
                              bg-linear-to-br from-gray-100 to-gray-300
                              rounded-full 
                              shadow-[inset_0_-4px_4px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.3)]
                              border border-gray-400 
                              shrink-0 flex items-center justify-center
                            `}
                          >
                            {pieceId && (
                              <img src={PIECES[pieceId]} alt="piece" className="w-full h-full rounded-full object-cover" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className={`${sideWidth} text-slate-400 font-bold text-xl ${rowHeight} flex items-center justify-start pl-6`}>{row}</div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center mt-4 w-full justify-center">
              <div className={`${sideWidth}`}></div>
              <div className={`flex justify-between ${gridWidth} px-10`}>
                {BOARD_COLUMNS.map((col) => <div key={col} className="text-slate-400 text-center font-bold text-xl w-12">{col}</div>)}
              </div>
              <div className={`${sideWidth}`}></div>
            </div>
          </div>
    );
}

export default GameSetup;