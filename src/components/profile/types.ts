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

  // New Detailed Stats (Aligned with DB)
  supremo_wins?: number;
  solitude_wins?: number;
  pieces_captured?: number;
  double_kills?: number;
  triple_kills?: number;
}

export interface GameHistoryEntry {
  id: number | string;
  opponent: string;
  opponentId: string;
  opponentRating: number;
  opponentFlag: string;
  result: 'win' | 'loss' | 'draw';
  accuracy?: string;
  moves: number;
  date: string;
  gameType: string;
  reviewAvailable?: boolean;
  userScore?: number;
  opponentScore?: number;
}

export interface Friend {
  id: number;
  name: string;
  isOnline: boolean;
}