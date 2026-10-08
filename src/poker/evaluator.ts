import { Card, HandResult, HandRank, Rank, Suit } from './types';

const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

const HAND_RANK_VALUES: Record<HandRank, number> = {
  'royal-flush': 9,
  'straight-flush': 8,
  'four-of-a-kind': 7,
  'full-house': 6,
  'flush': 5,
  'straight': 4,
  'three-of-a-kind': 3,
  'two-pair': 2,
  'pair': 1,
  'high-card': 0,
};

const HAND_NAMES: Record<HandRank, string> = {
  'royal-flush': 'Royal Flush',
  'straight-flush': 'Straight Flush',
  'four-of-a-kind': 'Four of a Kind',
  'full-house': 'Full House',
  'flush': 'Flush',
  'straight': 'Straight',
  'three-of-a-kind': 'Three of a Kind',
  'two-pair': 'Two Pair',
  'pair': 'Pair',
  'high-card': 'High Card',
};

export function createDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank, value: RANK_VALUES[rank] });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getCombinations(arr: Card[], size: number): Card[][] {
  if (size === 0) return [[]];
  if (arr.length === 0) return [];
  const [first, ...rest] = arr;
  const withFirst = getCombinations(rest, size - 1).map(combo => [first, ...combo]);
  const withoutFirst = getCombinations(rest, size);
  return [...withFirst, ...withoutFirst];
}

function getSuits(cards: Card[]): Record<Suit, Card[]> {
  const suits: Record<Suit, Card[]> = { hearts: [], diamonds: [], clubs: [], spades: [] };
  for (const card of cards) {
    suits[card.suit].push(card);
  }
  return suits;
}

function getRankCounts(cards: Card[]): Map<number, Card[]> {
  const counts = new Map<number, Card[]>();
  for (const card of cards) {
    const existing = counts.get(card.value) || [];
    existing.push(card);
    counts.set(card.value, existing);
  }
  return counts;
}

function checkFlush(cards: Card[]): Card[] | null {
  const suits = getSuits(cards);
  for (const suit of Object.values(suits)) {
    if (suit.length >= 5) {
      const sorted = suit.sort((a, b) => b.value - a.value);
      return sorted.slice(0, 5);
    }
  }
  return null;
}

function checkStraight(cards: Card[]): Card[] | null {
  const uniqueValues = [...new Set(cards.map(c => c.value))].sort((a, b) => b - a);
  
  // Check for ace-low straight (A-2-3-4-5)
  if (uniqueValues.includes(14)) {
    uniqueValues.push(1);
  }

  for (let i = 0; i <= uniqueValues.length - 5; i++) {
    if (uniqueValues[i] - uniqueValues[i + 4] === 4) {
      const straightValues = [uniqueValues[i], uniqueValues[i+1], uniqueValues[i+2], uniqueValues[i+3], uniqueValues[i+4]];
      // Check no duplicates in range
      if (new Set(straightValues).size === 5) {
        const straightCards: Card[] = [];
        for (const val of straightValues) {
          const actualVal = val === 1 ? 14 : val;
          const card = cards.find(c => c.value === actualVal);
          if (card) straightCards.push(card);
        }
        if (straightCards.length === 5) return straightCards;
      }
    }
  }
  return null;
}

function checkStraightFlush(cards: Card[]): Card[] | null {
  const suits = getSuits(cards);
  for (const suitCards of Object.values(suits)) {
    if (suitCards.length >= 5) {
      const straight = checkStraight(suitCards);
      if (straight) return straight;
    }
  }
  return null;
}

function evaluateFiveCards(cards: Card[]): HandResult {
  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const rankCounts = getRankCounts(cards);
  const counts = [...rankCounts.entries()].sort((a, b) => {
    if (b[1].length !== a[1].length) return b[1].length - a[1].length;
    return b[0] - a[0];
  });

  const flushCards = checkFlush(cards);
  const straightCards = checkStraight(cards);
  const straightFlushCards = checkStraightFlush(cards);

  // Royal Flush
  if (straightFlushCards && straightFlushCards[0].value === 14 && straightFlushCards[1].value === 13) {
    return { rank: 'royal-flush', name: HAND_NAMES['royal-flush'], cards: straightFlushCards, value: HAND_RANK_VALUES['royal-flush'] * 1000000, kickers: straightFlushCards.map(c => c.value) };
  }

  // Straight Flush
  if (straightFlushCards) {
    return { rank: 'straight-flush', name: HAND_NAMES['straight-flush'], cards: straightFlushCards, value: HAND_RANK_VALUES['straight-flush'] * 1000000 + straightFlushCards[0].value * 10000, kickers: straightFlushCards.map(c => c.value) };
  }

  // Four of a Kind
  if (counts[0][1].length === 4) {
    const kicker = sorted.find(c => c.value !== counts[0][0]);
    const kickers = kicker ? [kicker.value] : [0];
    return { rank: 'four-of-a-kind', name: HAND_NAMES['four-of-a-kind'], cards: sorted, value: HAND_RANK_VALUES['four-of-a-kind'] * 1000000 + counts[0][0] * 10000 + kickers[0], kickers: [counts[0][0], ...kickers] };
  }

  // Full House
  if (counts[0][1].length === 3 && counts[1] && counts[1][1].length >= 2) {
    return { rank: 'full-house', name: HAND_NAMES['full-house'], cards: sorted, value: HAND_RANK_VALUES['full-house'] * 1000000 + counts[0][0] * 10000 + counts[1][0], kickers: [counts[0][0], counts[1][0]] };
  }

  // Flush
  if (flushCards) {
    return { rank: 'flush', name: HAND_NAMES['flush'], cards: flushCards, value: HAND_RANK_VALUES['flush'] * 1000000 + flushCards.reduce((acc, c, i) => acc + c.value * Math.pow(100, 4 - i), 0), kickers: flushCards.map(c => c.value) };
  }

  // Straight
  if (straightCards) {
    return { rank: 'straight', name: HAND_NAMES['straight'], cards: straightCards, value: HAND_RANK_VALUES['straight'] * 1000000 + straightCards[0].value * 10000, kickers: straightCards.map(c => c.value) };
  }

  // Three of a Kind
  if (counts[0][1].length === 3) {
    const kickers = sorted.filter(c => c.value !== counts[0][0]).map(c => c.value).slice(0, 2);
    return { rank: 'three-of-a-kind', name: HAND_NAMES['three-of-a-kind'], cards: sorted, value: HAND_RANK_VALUES['three-of-a-kind'] * 1000000 + counts[0][0] * 10000 + kickers.reduce((acc, k, i) => acc + k * Math.pow(100, 1 - i), 0), kickers: [counts[0][0], ...kickers] };
  }

  // Two Pair
  if (counts[0][1].length === 2 && counts[1] && counts[1][1].length === 2) {
    const kicker = sorted.find(c => c.value !== counts[0][0] && c.value !== counts[1][0]);
    const highPair = Math.max(counts[0][0], counts[1][0]);
    const lowPair = Math.min(counts[0][0], counts[1][0]);
    const kickerVal = kicker ? kicker.value : 0;
    return { rank: 'two-pair', name: HAND_NAMES['two-pair'], cards: sorted, value: HAND_RANK_VALUES['two-pair'] * 1000000 + highPair * 10000 + lowPair * 100 + kickerVal, kickers: [highPair, lowPair, kickerVal] };
  }

  // Pair
  if (counts[0][1].length === 2) {
    const kickers = sorted.filter(c => c.value !== counts[0][0]).map(c => c.value).slice(0, 3);
    return { rank: 'pair', name: HAND_NAMES['pair'], cards: sorted, value: HAND_RANK_VALUES['pair'] * 1000000 + counts[0][0] * 10000 + kickers.reduce((acc, k, i) => acc + k * Math.pow(100, 2 - i), 0), kickers: [counts[0][0], ...kickers] };
  }

  // High Card
  return { rank: 'high-card', name: HAND_NAMES['high-card'], cards: sorted, value: HAND_RANK_VALUES['high-card'] * 1000000 + sorted.reduce((acc, c, i) => acc + c.value * Math.pow(100, 4 - i), 0), kickers: sorted.map(c => c.value) };
}

export function evaluateHand(holeCards: Card[], communityCards: Card[]): HandResult {
  const allCards = [...holeCards, ...communityCards];
  
  if (allCards.length < 5) {
    // Not enough cards - evaluate what we have
    return evaluateFiveCards(allCards);
  }

  // Get best 5-card combination from 7 cards
  const combinations = getCombinations(allCards, 5);
  let bestHand: HandResult | null = null;

  for (const combo of combinations) {
    const result = evaluateFiveCards(combo);
    if (!bestHand || result.value > bestHand.value) {
      bestHand = result;
    }
  }

  return bestHand!;
}

export function compareHands(a: HandResult, b: HandResult): number {
  return a.value - b.value;
}

export function getHandStrength(holeCards: Card[], communityCards: Card[]): number {
  if (communityCards.length === 0) {
    // Pre-flop hand strength (simplified Chen formula approximation)
    const [c1, c2] = holeCards;
    let strength = Math.max(c1.value, c2.value);
    if (c1.value === c2.value) strength *= 2;
    if (c1.suit === c2.suit) strength += 2;
    if (Math.abs(c1.value - c2.value) === 1) strength += 1;
    if (Math.abs(c1.value - c2.value) === 2) strength += 0.5;
    return Math.min(strength / 20, 1);
  }

  const hand = evaluateHand(holeCards, communityCards);
  const baseStrength = HAND_RANK_VALUES[hand.rank] / 9;
  const kickerBonus = hand.kickers[0] / 14 * 0.1;
  return Math.min(baseStrength + kickerBonus, 1);
}
