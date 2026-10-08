import { BotPersonality, Card, Difficulty, Player } from './types';
import { evaluateHand, getHandStrength } from './evaluator';

export type BotAction = 
  | { type: 'fold' }
  | { type: 'check' }
  | { type: 'call'; amount: number }
  | { type: 'raise'; amount: number }
  | { type: 'allin'; amount: number };

interface BotContext {
  player: Player;
  communityCards: Card[];
  pot: number;
  currentBet: number;
  minRaise: number;
  bigBlind: number;
  opponentsRemaining: number;
  phase: string;
  difficulty: Difficulty;
}

const PERSONALITY_CONFIGS: Record<BotPersonality, {
  foldThreshold: number;
  raiseThreshold: number;
  bluffChance: number;
  aggressionFactor: number;
  callThreshold: number;
}> = {
  conservative: {
    foldThreshold: 0.35,
    raiseThreshold: 0.65,
    bluffChance: 0.05,
    aggressionFactor: 0.3,
    callThreshold: 0.3,
  },
  aggressive: {
    foldThreshold: 0.2,
    raiseThreshold: 0.4,
    bluffChance: 0.25,
    aggressionFactor: 0.8,
    callThreshold: 0.2,
  },
  caller: {
    foldThreshold: 0.15,
    raiseThreshold: 0.75,
    bluffChance: 0.08,
    aggressionFactor: 0.2,
    callThreshold: 0.15,
  },
  trickster: {
    foldThreshold: 0.25,
    raiseThreshold: 0.5,
    bluffChance: 0.35,
    aggressionFactor: 0.6,
    callThreshold: 0.25,
  },
  balanced: {
    foldThreshold: 0.3,
    raiseThreshold: 0.55,
    bluffChance: 0.15,
    aggressionFactor: 0.5,
    callThreshold: 0.25,
  },
};

const DIFFICULTY_MODIFIERS: Record<Difficulty, {
  decisionNoise: number;
  bluffMultiplier: number;
  mistakeChance: number;
  potOddsAccuracy: number;
}> = {
  easy: {
    decisionNoise: 0.3,
    bluffMultiplier: 0.5,
    mistakeChance: 0.25,
    potOddsAccuracy: 0.5,
  },
  normal: {
    decisionNoise: 0.15,
    bluffMultiplier: 1.0,
    mistakeChance: 0.1,
    potOddsAccuracy: 0.75,
  },
  hard: {
    decisionNoise: 0.05,
    bluffMultiplier: 1.2,
    mistakeChance: 0.03,
    potOddsAccuracy: 0.95,
  },
};

function getPotOdds(currentBet: number, pot: number, callAmount: number): number {
  if (pot + callAmount === 0) return 0;
  return callAmount / (pot + callAmount);
}

function getEffectiveStrength(
  handStrength: number,
  personality: BotPersonality,
  difficulty: Difficulty,
  bluffing: boolean
): number {
  const config = PERSONALITY_CONFIGS[personality];
  const diffMod = DIFFICULTY_MODIFIERS[difficulty];
  
  let effective = handStrength;
  
  if (bluffing) {
    effective = Math.min(effective + 0.3 * config.bluffChance * diffMod.bluffMultiplier, 0.9);
  }
  
  // Add noise based on difficulty
  const noise = (Math.random() - 0.5) * 2 * diffMod.decisionNoise;
  effective = Math.max(0, Math.min(1, effective + noise));
  
  return effective;
}

function shouldBluff(personality: BotPersonality, difficulty: Difficulty, phase: string): boolean {
  const config = PERSONALITY_CONFIGS[personality];
  const diffMod = DIFFICULTY_MODIFIERS[difficulty];
  
  let bluffChance = config.bluffChance * diffMod.bluffMultiplier;
  
  // More bluffs in late position
  if (phase === 'river') bluffChance *= 1.3;
  if (phase === 'turn') bluffChance *= 1.1;
  
  return Math.random() < bluffChance;
}

function makeMistake(difficulty: Difficulty): boolean {
  const diffMod = DIFFICULTY_MODIFIERS[difficulty];
  return Math.random() < diffMod.mistakeChance;
}

export function getThinkingTime(personality: BotPersonality, action: string): number {
  const baseTimes: Record<string, [number, number]> = {
    fold: [400, 800],
    check: [300, 700],
    call: [500, 1000],
    raise: [800, 1800],
    allin: [1000, 2200],
  };
  
  const [min, max] = baseTimes[action] || [500, 1200];
  
  // Personality affects thinking time
  const personalityMod: Record<BotPersonality, number> = {
    conservative: 1.2,
    aggressive: 0.8,
    caller: 0.7,
    trickster: 1.4,
    balanced: 1.0,
  };
  
  const mod = personalityMod[personality];
  const time = min + Math.random() * (max - min);
  return Math.round(time * mod);
}

export function getBotReaction(personality: BotPersonality, event: string): string | null {
  const reactions: Record<BotPersonality, Record<string, string[]>> = {
    conservative: {
      win: ['Solid hand.', 'Well played.', 'Nice cards.'],
      lose: ['Shouldn\'t have called.', 'Folded too late.', 'Tough break.'],
      bigRaise: ['Hmm, interesting...', 'That\'s bold.', 'Careful there.'],
    },
    aggressive: {
      win: ['Let\'s go!', 'Too easy.', 'Pressure works.'],
      lose: ['Lucky draw.', 'Next hand.', 'Won\'t happen again.'],
      bigRaise: ['Oh, a fight?', 'You sure about that?', 'Game on.'],
    },
    caller: {
      win: ['Called and delivered!', 'Worth the call.', 'Patience pays.'],
      lose: ['Should\'ve folded.', 'Expensive lesson.', 'Oof.'],
      bigRaise: ['Wow, big bet.', 'Interesting...', 'OK then.'],
    },
    trickster: {
      win: ['Didn\'t see that coming, did you?', 'Gotcha.', 'Smooth.'],
      lose: ['Well played.', 'You got me.', 'Respect.'],
      bigRaise: ['Oh really?', 'Bold move.', 'I see what you\'re doing.'],
    },
    balanced: {
      win: ['Good hand.', 'Nice.', 'Well done.'],
      lose: ['Good game.', 'Next time.', 'Fair enough.'],
      bigRaise: ['Interesting play.', 'Noted.', 'Hmm.'],
    },
  };

  const pool = reactions[personality]?.[event];
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function decideBotAction(ctx: BotContext): BotAction {
  const { player, communityCards, pot, currentBet, minRaise, bigBlind, opponentsRemaining, phase, difficulty } = ctx;
  const personality = player.personality || 'balanced';
  const config = PERSONALITY_CONFIGS[personality];
  
  const handStrength = getHandStrength(player.holeCards, communityCards);
  const callAmount = currentBet - player.currentBet;
  const potOdds = getPotOdds(currentBet, pot, callAmount);
  const diffMod = DIFFICULTY_MODIFIERS[difficulty];
  
  // Check if we should make a mistake
  if (makeMistake(difficulty)) {
    // Random mistake
    const mistakeRoll = Math.random();
    if (mistakeRoll < 0.3 && callAmount > 0) {
      return { type: 'fold' }; // Fold a good hand
    }
    if (mistakeRoll < 0.5 && handStrength < 0.4) {
      return { type: 'call', amount: callAmount }; // Call with bad hand
    }
  }
  
  // No call needed - can check
  if (callAmount === 0) {
    const effectiveStrength = getEffectiveStrength(handStrength, personality, difficulty, false);
    
    if (effectiveStrength >= config.raiseThreshold) {
      // Raise
      const raiseSize = calculateRaiseSize(handStrength, pot, bigBlind, minRaise, personality, difficulty, player.chips);
      if (raiseSize >= player.chips) {
        return { type: 'allin', amount: player.chips };
      }
      return { type: 'raise', amount: Math.min(raiseSize, player.chips) };
    }
    
    // Bluff check
    if (shouldBluff(personality, difficulty, phase)) {
      const bluffSize = Math.floor(pot * (0.5 + Math.random() * 0.5));
      const totalBet = bluffSize;
      if (totalBet >= player.chips) {
        return { type: 'allin', amount: player.chips };
      }
      return { type: 'raise', amount: Math.min(totalBet, player.chips) };
    }
    
    return { type: 'check' };
  }
  
  // Need to call something
  const effectiveStrength = getEffectiveStrength(handStrength, personality, difficulty, false);
  
  // Pot odds decision
  const adjustedPotOdds = potOdds * (1 + (1 - diffMod.potOddsAccuracy) * (Math.random() - 0.5));
  
  // Fold if hand is too weak
  if (effectiveStrength < config.foldThreshold && callAmount > bigBlind * 2) {
    return { type: 'fold' };
  }
  
  // Raise with strong hand
  if (effectiveStrength >= config.raiseThreshold) {
    const raiseSize = calculateRaiseSize(handStrength, pot, bigBlind, minRaise, personality, difficulty, player.chips);
    const totalNeeded = callAmount + raiseSize;
    if (totalNeeded >= player.chips) {
      return { type: 'allin', amount: player.chips };
    }
    return { type: 'raise', amount: Math.min(totalNeeded, player.chips) };
  }
  
  // Bluff raise
  if (shouldBluff(personality, difficulty, phase) && opponentsRemaining <= 2) {
    const bluffSize = Math.floor(pot * (0.5 + Math.random() * 0.7));
    const totalNeeded = callAmount + bluffSize;
    if (totalNeeded >= player.chips) {
      return { type: 'allin', amount: player.chips };
    }
    return { type: 'raise', amount: Math.min(totalNeeded, player.chips) };
  }
  
  // Call if pot odds are good or hand is decent
  if (effectiveStrength >= config.callThreshold || effectiveStrength >= adjustedPotOdds) {
    if (callAmount >= player.chips) {
      // All-in decision
      if (effectiveStrength >= 0.6) {
        return { type: 'allin', amount: player.chips };
      }
      return { type: 'fold' };
    }
    return { type: 'call', amount: callAmount };
  }
  
  // Fold
  return { type: 'fold' };
}

function calculateRaiseSize(
  handStrength: number,
  pot: number,
  bigBlind: number,
  minRaise: number,
  personality: BotPersonality,
  difficulty: Difficulty,
  chips: number
): number {
  const config = PERSONALITY_CONFIGS[personality];
  
  let raiseMultiplier: number;
  
  if (handStrength >= 0.8) {
    raiseMultiplier = 2.5 + config.aggressionFactor * 1.5;
  } else if (handStrength >= 0.6) {
    raiseMultiplier = 1.5 + config.aggressionFactor;
  } else {
    raiseMultiplier = 1.0 + config.aggressionFactor * 0.5;
  }
  
  // Add some randomness
  raiseMultiplier *= (0.8 + Math.random() * 0.4);
  
  let raiseAmount = Math.floor(pot * raiseMultiplier);
  raiseAmount = Math.max(raiseAmount, minRaise);
  raiseAmount = Math.max(raiseAmount, bigBlind * 2);
  
  // Round to nice numbers
  raiseAmount = Math.round(raiseAmount / bigBlind) * bigBlind;
  
  return Math.min(raiseAmount, chips);
}
