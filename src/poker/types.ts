export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // 2-14
}

export type HandRank = 
  | 'royal-flush'
  | 'straight-flush'
  | 'four-of-a-kind'
  | 'full-house'
  | 'flush'
  | 'straight'
  | 'three-of-a-kind'
  | 'two-pair'
  | 'pair'
  | 'high-card';

export interface HandResult {
  rank: HandRank;
  name: string;
  cards: Card[];
  value: number; // numeric comparison value
  kickers: number[];
}

export type BotPersonality = 'conservative' | 'aggressive' | 'caller' | 'trickster' | 'balanced';
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface Player {
  id: string;
  name: string;
  chips: number;
  holeCards: Card[];
  currentBet: number;
  totalBet: number;
  folded: boolean;
  allIn: boolean;
  isHuman: boolean;
  personality?: BotPersonality;
  difficulty?: Difficulty;
  lastAction?: string;
  isThinking?: boolean;
  reaction?: string;
  seatIndex: number;
}

export type GamePhase = 
  | 'idle'
  | 'dealing'
  | 'preflop'
  | 'flop'
  | 'turn'
  | 'river'
  | 'showdown'
  | 'winner';

export interface GameState {
  players: Player[];
  communityCards: Card[];
  deck: Card[];
  pot: number;
  currentBet: number;
  dealerIndex: number;
  smallBlindIndex: number;
  bigBlindIndex: number;
  smallBlind: number;
  bigBlind: number;
  phase: GamePhase;
  activePlayerIndex: number;
  minRaise: number;
  handNumber: number;
  winners: { player: Player; hand: HandResult | null; amount: number }[];
  sidePots: { amount: number; eligible: string[] }[];
  handResults?: { playerId: string; hand: HandResult }[];
}

export interface ChipAnimation {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  amount: number;
  duration: number;
}
