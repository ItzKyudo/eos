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
  theme_preference?: string;
  show_ads?: boolean;
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