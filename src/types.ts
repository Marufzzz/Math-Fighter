export interface UserProfile {
  uid: string;
  displayName: string;
  avatarId: string;
  totalWins: number;
  totalMatches: number;
  lastSeen?: string;
  storyProgress?: number; // Index of current level/mathematician
}

export type MatchStatus = 'waiting' | 'active' | 'finished';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface PlayerState {
  uid: string;
  displayName: string;
  avatarId: string;
  hp: number;
  maxHp: number;
  lastAction?: 'punch' | 'kick' | 'special' | null;
  lastActionTime?: number;
}

export interface Match {
  id: string;
  status: MatchStatus;
  players: Record<string, PlayerState>;
  winner?: string | null;
  createdAt: any;
  updatedAt: any;
  isAi?: boolean;
  difficulty?: Difficulty;
  bossId?: string;
}

export interface MathProblem {
  question: string;
  answer: number;
  difficulty: number;
}

export const AVATARS = [
  { id: 'blaze', name: 'Blaze', color: '#ff4e00', icon: '🔥' },
  { id: 'frost', name: 'Frost', color: '#00ccff', icon: '❄️' },
  { id: 'spark', name: 'Spark', color: '#ffcc00', icon: '⚡' },
  { id: 'geco', name: 'Geco', color: '#33cc33', icon: '🦎' },
];
