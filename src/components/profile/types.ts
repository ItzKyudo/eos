export interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  status_message?: string;
  country_flag?: string;
  avatar_url?: string;
  rating_bullet?: number;
  rating_blitz?: number;
  rating_rapid?: number;
  rating_classic?: number;
  rating_swift?: number;
  rating_turbo?: number;
  theme_preference?: string;
  show_ads?: boolean;

  // New Detailed Stats
  wins_supremo_captured?: number;
  wins_solitude?: number;
  pieces_captured?: number;
  double_captured?: number;
  triple_captured?: number;
}

export interface GameHistoryEntry {
  id: string;
  opponent: string;
  opponentRating: number;
  opponentFlag: string;
  result: 'win' | 'loss' | 'draw';
  accuracy?: string;
  moves: number;
  date: string;
  gameType: 'bullet' | 'blitz' | 'rapid';
  reviewAvailable: boolean;
}

export interface Friend {
  id: number;
  name: string;
  isOnline: boolean;
}