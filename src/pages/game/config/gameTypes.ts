export type GameMode = 'practice' | 'multiplayer' | 'friend' | 'guest' | 'local';

export interface GameConfig {
  mode: GameMode;
  isOnline: boolean;
  requiresAuth: boolean;
  allowsGuest: boolean;
  isSingleDevice: boolean;
  usesSocket: boolean;
  savesHistory: boolean;
  description: string;
}

export const GAME_CONFIGS: Record<GameMode, GameConfig> = {
  practice: {
    mode: 'practice',
    isOnline: false,
    requiresAuth: false,
    allowsGuest: true,
    isSingleDevice: true,
    usesSocket: false,
    savesHistory: false,
    description: 'Solo or local multiplayer practice'
  },
  multiplayer: {
    mode: 'multiplayer',
    isOnline: true,
    requiresAuth: true,
    allowsGuest: false,
    isSingleDevice: false,
    usesSocket: true,
    savesHistory: true,
    description: 'Ranked online matchmaking'
  },
  friend: {
    mode: 'friend',
    isOnline: true,
    requiresAuth: true,
    allowsGuest: false,
    isSingleDevice: false,
    usesSocket: true,
    savesHistory: true,
    description: 'Play with friend via invite'
  },
  guest: {
    mode: 'guest',
    isOnline: true,
    requiresAuth: false,
    allowsGuest: true,
    isSingleDevice: false,
    usesSocket: true,
    savesHistory: false,
    description: 'Casual online match as guest'
  },
  local: {
    mode: 'local',
    isOnline: false,
    requiresAuth: false,
    allowsGuest: true,
    isSingleDevice: true,
    usesSocket: false,
    savesHistory: false,
    description: 'Same device multiplayer'
  }
};

export const getGameConfig = (mode: GameMode): GameConfig => {
  return GAME_CONFIGS[mode] || GAME_CONFIGS.practice;
};