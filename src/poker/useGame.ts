import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, GameState, GamePhase, Player, BotPersonality, Difficulty, HandResult } from './types';
import { createDeck, shuffleDeck, evaluateHand } from './evaluator';
import { decideBotAction, getThinkingTime, getBotReaction, BotAction } from './ai';

const BOT_NAMES = ['Viktor', 'Sofia', 'Marcus', 'Luna', 'Rex'];
const BOT_PERSONALITIES: BotPersonality[] = ['conservative', 'aggressive', 'caller', 'trickster', 'balanced'];

interface GameConfig {
  numBots: number;
  difficulty: Difficulty;
  startingChips: number;
  smallBlind: number;
  bigBlind: number;
}

const DEFAULT_CONFIG: GameConfig = {
  numBots: 4,
  difficulty: 'normal',
  startingChips: 1000,
  smallBlind: 10,
  bigBlind: 20,
};

function createPlayers(config: GameConfig): Player[] {
  const players: Player[] = [{
    id: 'human',
    name: 'You',
    chips: config.startingChips,
    holeCards: [],
    currentBet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    isHuman: true,
    lastAction: undefined,
    isThinking: false,
    reaction: undefined,
    seatIndex: 0,
  }];
  
  for (let i = 0; i < config.numBots; i++) {
    players.push({
      id: `bot-${i}`,
      name: BOT_NAMES[i],
      chips: config.startingChips,
      holeCards: [],
      currentBet: 0,
      totalBet: 0,
      folded: false,
      allIn: false,
      isHuman: false,
      personality: BOT_PERSONALITIES[i % BOT_PERSONALITIES.length],
      difficulty: config.difficulty,
      lastAction: undefined,
      isThinking: false,
      reaction: undefined,
      seatIndex: i + 1,
    });
  }
  
  return players;
}

function getNextActivePlayer(players: Player[], fromIndex: number): number {
  const len = players.length;
  for (let i = 1; i <= len; i++) {
    const idx = (fromIndex + i) % len;
    const p = players[idx];
    if (!p.folded && !p.allIn && p.chips > 0) return idx;
  }
  return -1;
}

function isBettingRoundComplete(players: Player[], currentBet: number): boolean {
  const canAct = players.filter(p => !p.folded && !p.allIn && p.chips > 0);
  if (canAct.length === 0) return true;
  return canAct.every(p => p.currentBet === currentBet && p.lastAction !== undefined);
}

function countActivePlayers(players: Player[]): number {
  return players.filter(p => !p.folded).length;
}

function canAnyoneAct(players: Player[]): boolean {
  return players.some(p => !p.folded && !p.allIn && p.chips > 0);
}

export function usePokerGame(config: GameConfig = DEFAULT_CONFIG) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showdownRevealed, setShowdownRevealed] = useState(false);
  const botTimerRef = useRef<number | null>(null);
  const advanceTimerRef = useRef<number | null>(null);
  const gameConfigRef = useRef(config);
  const processingRef = useRef(false);

  // Keep processingRef in sync
  useEffect(() => {
    processingRef.current = isProcessing;
  }, [isProcessing]);

  const clearTimers = () => {
    if (botTimerRef.current) { clearTimeout(botTimerRef.current); botTimerRef.current = null; }
    if (advanceTimerRef.current) { clearTimeout(advanceTimerRef.current); advanceTimerRef.current = null; }
  };

  const startNewHand = useCallback(() => {
    clearTimers();
    setIsProcessing(true);
    setShowdownRevealed(false);
    
    setGameState(prev => {
      let players: Player[];
      let dealerIndex: number;
      let handNumber: number;
      
      if (prev && prev.players.length > 0) {
        players = prev.players.map(p => ({
          ...p,
          holeCards: [],
          currentBet: 0,
          totalBet: 0,
          folded: p.chips <= 0,
          allIn: false,
          lastAction: undefined,
          isThinking: false,
          reaction: undefined,
        }));
        
        // Find next dealer
        const activePlayers = players.filter(p => p.chips > 0);
        if (activePlayers.length < 2) return prev;
        
        dealerIndex = prev.dealerIndex;
        for (let i = 0; i < players.length; i++) {
          dealerIndex = (dealerIndex + 1) % players.length;
          if (players[dealerIndex].chips > 0) break;
        }
        handNumber = prev.handNumber + 1;
      } else {
        players = createPlayers(gameConfigRef.current);
        dealerIndex = Math.floor(Math.random() * players.length);
        handNumber = 1;
      }
      
      const deck = shuffleDeck(createDeck());
      const numPlayers = players.length;
      const smallBlindIndex = (dealerIndex + 1) % numPlayers;
      const bigBlindIndex = (dealerIndex + 2) % numPlayers;
      
      // Post blinds
      const sbAmount = Math.min(gameConfigRef.current.smallBlind, players[smallBlindIndex].chips);
      const bbAmount = Math.min(gameConfigRef.current.bigBlind, players[bigBlindIndex].chips);
      
      players[smallBlindIndex] = {
        ...players[smallBlindIndex],
        currentBet: sbAmount,
        totalBet: sbAmount,
        chips: players[smallBlindIndex].chips - sbAmount,
      };
      if (players[smallBlindIndex].chips === 0) players[smallBlindIndex].allIn = true;
      
      players[bigBlindIndex] = {
        ...players[bigBlindIndex],
        currentBet: bbAmount,
        totalBet: bbAmount,
        chips: players[bigBlindIndex].chips - bbAmount,
      };
      if (players[bigBlindIndex].chips === 0) players[bigBlindIndex].allIn = true;
      
      // Deal hole cards
      let deckIdx = 0;
      for (let round = 0; round < 2; round++) {
        for (let i = 0; i < numPlayers; i++) {
          const playerIdx = (dealerIndex + 1 + i) % numPlayers;
          if (!players[playerIdx].folded) {
            players[playerIdx] = {
              ...players[playerIdx],
              holeCards: [...players[playerIdx].holeCards, deck[deckIdx]],
            };
            deckIdx++;
          }
        }
      }
      
      // First to act: after big blind
      let activePlayerIndex = getNextActivePlayer(players, bigBlindIndex);
      if (activePlayerIndex === -1) {
        // Everyone is all-in (including blinds)
        return {
          players,
          communityCards: [],
          deck: deck.slice(deckIdx),
          pot: sbAmount + bbAmount,
          currentBet: bbAmount,
          dealerIndex,
          smallBlindIndex,
          bigBlindIndex,
          smallBlind: gameConfigRef.current.smallBlind,
          bigBlind: gameConfigRef.current.bigBlind,
          phase: 'showdown' as GamePhase,
          activePlayerIndex: bigBlindIndex,
          minRaise: bbAmount,
          handNumber,
          winners: [],
          sidePots: [],
        };
      }
      
      return {
        players,
        communityCards: [],
        deck: deck.slice(deckIdx),
        pot: sbAmount + bbAmount,
        currentBet: bbAmount,
        dealerIndex,
        smallBlindIndex,
        bigBlindIndex,
        smallBlind: gameConfigRef.current.smallBlind,
        bigBlind: gameConfigRef.current.bigBlind,
        phase: 'dealing' as GamePhase,
        activePlayerIndex,
        minRaise: bbAmount,
        handNumber,
        winners: [],
        sidePots: [],
      };
    });
    
    // Transition from dealing to preflop
    setTimeout(() => {
      setGameState(prev => {
        if (!prev || prev.phase !== 'dealing') return prev;
        return { ...prev, phase: 'preflop' as GamePhase };
      });
      setIsProcessing(false);
    }, 1000);
  }, []);

  const advancePhase = useCallback(() => {
    setGameState(prev => {
      if (!prev) return prev;
      
      const phaseOrder: GamePhase[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];
      const currentIdx = phaseOrder.indexOf(prev.phase);
      
      if (currentIdx >= 3) {
        // After river → showdown
        return { ...prev, phase: 'showdown' as GamePhase };
      }
      
      const nextPhase = phaseOrder[currentIdx + 1];
      const cardsToDeal = nextPhase === 'flop' ? 3 : 1;
      const newCards = prev.deck.slice(0, cardsToDeal);
      const newDeck = prev.deck.slice(cardsToDeal);
      
      // Reset bets and actions
      const players = prev.players.map(p => ({
        ...p,
        currentBet: 0,
        lastAction: undefined,
      }));
      
      // Find first active player after dealer
      const nextActive = getNextActivePlayer(players, prev.dealerIndex);
      
      if (nextActive === -1) {
        // No one can act - check if we need more phases or showdown
        const activeCount = countActivePlayers(players);
        if (activeCount <= 1) {
          return { ...prev, players, phase: 'winner' as GamePhase, communityCards: [...prev.communityCards, ...newCards], deck: newDeck, currentBet: 0 };
        }
        // Everyone is all-in, keep advancing through phases
        if (nextPhase === 'river') {
          return { ...prev, players, phase: 'showdown' as GamePhase, communityCards: [...prev.communityCards, ...newCards], deck: newDeck, currentBet: 0 };
        }
        return { ...prev, players, phase: nextPhase, communityCards: [...prev.communityCards, ...newCards], deck: newDeck, currentBet: 0, minRaise: prev.bigBlind };
      }
      
      return {
        ...prev,
        phase: nextPhase,
        players,
        communityCards: [...prev.communityCards, ...newCards],
        deck: newDeck,
        currentBet: 0,
        activePlayerIndex: nextActive,
        minRaise: prev.bigBlind,
      };
    });
  }, []);

  const applyAction = useCallback((playerId: string, action: BotAction): { needsAdvance: boolean; handOver: boolean } => {
    let needsAdvance = false;
    let handOver = false;
    
    setGameState(prev => {
      if (!prev) return prev;
      
      const playerIdx = prev.players.findIndex(p => p.id === playerId);
      if (playerIdx === -1) return prev;
      
      const players = prev.players.map(p => ({ ...p }));
      const player = players[playerIdx];
      let pot = prev.pot;
      let currentBet = prev.currentBet;
      let minRaise = prev.minRaise;
      
      switch (action.type) {
        case 'fold':
          player.folded = true;
          player.lastAction = 'fold';
          break;
        case 'check':
          player.lastAction = 'check';
          break;
        case 'call': {
          const callAmt = Math.min(action.amount, player.chips);
          player.chips -= callAmt;
          player.currentBet += callAmt;
          player.totalBet += callAmt;
          pot += callAmt;
          player.lastAction = 'call';
          if (player.chips === 0) player.allIn = true;
          break;
        }
        case 'raise': {
          const raiseTotal = action.amount;
          const additional = raiseTotal - player.currentBet;
          const actualBet = Math.min(additional, player.chips);
          player.chips -= actualBet;
          player.currentBet += actualBet;
          player.totalBet += actualBet;
          pot += actualBet;
          currentBet = player.currentBet;
          minRaise = Math.max(minRaise, player.currentBet - prev.currentBet);
          player.lastAction = 'raise';
          if (player.chips === 0) player.allIn = true;
          // Reset other players' action status
          players.forEach((p, i) => {
            if (i !== playerIdx && !p.folded && !p.allIn && p.chips > 0) {
              p.lastAction = undefined;
            }
          });
          break;
        }
        case 'allin': {
          const allInAmt = player.chips;
          player.currentBet += allInAmt;
          pot += allInAmt;
          player.totalBet += allInAmt;
          player.chips = 0;
          player.allIn = true;
          if (player.currentBet > currentBet) {
            currentBet = player.currentBet;
            minRaise = Math.max(minRaise, player.currentBet - prev.currentBet);
            players.forEach((p, i) => {
              if (i !== playerIdx && !p.folded && !p.allIn && p.chips > 0) {
                p.lastAction = undefined;
              }
            });
          }
          player.lastAction = 'all-in';
          break;
        }
      }
      
      players[playerIdx] = player;
      
      // Check hand over
      const activeCount = countActivePlayers(players);
      if (activeCount <= 1) {
        handOver = true;
        const winner = players.find(p => !p.folded);
        return {
          ...prev,
          players,
          pot,
          currentBet,
          minRaise,
          phase: 'winner' as GamePhase,
          winners: winner ? [{ player: winner, hand: null, amount: pot }] : [],
        };
      }
      
      // Check betting round complete
      if (isBettingRoundComplete(players, currentBet)) {
        if (!canAnyoneAct(players)) {
          // All remaining are all-in → showdown
          return {
            ...prev,
            players,
            pot,
            currentBet,
            minRaise,
            phase: 'showdown' as GamePhase,
          };
        }
        // Need to advance phase
        needsAdvance = true;
        return {
          ...prev,
          players,
          pot,
          currentBet,
          minRaise,
        };
      }
      
      // Find next active player
      const nextIdx = getNextActivePlayer(players, playerIdx);
      
      return {
        ...prev,
        players,
        pot,
        currentBet,
        minRaise,
        activePlayerIndex: nextIdx !== -1 ? nextIdx : prev.activePlayerIndex,
      };
    });
    
    return { needsAdvance, handOver };
  }, []);

  const handlePlayerAction = useCallback((action: 'fold' | 'check' | 'call' | 'raise' | 'allin', amount?: number) => {
    if (!gameState) return;
    
    const player = gameState.players[gameState.activePlayerIndex];
    if (!player?.isHuman) return;
    
    setIsProcessing(true);
    
    let botAction: BotAction;
    switch (action) {
      case 'fold':
        botAction = { type: 'fold' };
        break;
      case 'check':
        botAction = { type: 'check' };
        break;
      case 'call':
        botAction = { type: 'call', amount: gameState.currentBet - player.currentBet };
        break;
      case 'raise':
        botAction = { type: 'raise', amount: amount || (gameState.currentBet + gameState.minRaise) };
        break;
      case 'allin':
        botAction = { type: 'allin', amount: player.chips };
        break;
    }
    
    const result = applyAction(player.id, botAction);
    
    if (result.needsAdvance) {
      advanceTimerRef.current = window.setTimeout(() => {
        advancePhase();
        setTimeout(() => setIsProcessing(false), 500);
      }, 600);
    } else {
      setTimeout(() => setIsProcessing(false), 300);
    }
  }, [gameState, applyAction, advancePhase]);

  // Bot turn processing
  useEffect(() => {
    if (!gameState || isProcessing) return;
    if (gameState.phase === 'showdown' || gameState.phase === 'winner' || gameState.phase === 'idle' || gameState.phase === 'dealing') return;
    
    const activePlayer = gameState.players[gameState.activePlayerIndex];
    if (!activePlayer || activePlayer.isHuman || activePlayer.folded || activePlayer.allIn) return;
    
    // Double-check someone can act
    if (!canAnyoneAct(gameState.players)) {
      setGameState(prev => prev ? { ...prev, phase: 'showdown' } : prev);
      return;
    }
    
    setIsProcessing(true);
    
    // Show thinking
    setGameState(prev => {
      if (!prev) return prev;
      const players = prev.players.map((p, i) => 
        i === prev.activePlayerIndex ? { ...p, isThinking: true } : p
      );
      return { ...prev, players };
    });
    
    const thinkingTime = getThinkingTime(activePlayer.personality || 'balanced', 'thinking');
    
    botTimerRef.current = window.setTimeout(() => {
      const botCtx = {
        player: activePlayer,
        communityCards: gameState.communityCards,
        pot: gameState.pot,
        currentBet: gameState.currentBet,
        minRaise: gameState.minRaise,
        bigBlind: gameState.bigBlind,
        opponentsRemaining: gameState.players.filter(p => !p.folded && p.id !== activePlayer.id).length,
        phase: gameState.phase,
        difficulty: activePlayer.difficulty || 'normal',
      };
      
      const action = decideBotAction(botCtx);
      
      // Clear thinking
      setGameState(prev => {
        if (!prev) return prev;
        const players = prev.players.map((p, i) => 
          i === prev.activePlayerIndex ? { ...p, isThinking: false } : p
        );
        return { ...prev, players };
      });
      
      const result = applyAction(activePlayer.id, action);
      
      if (result.needsAdvance) {
        advanceTimerRef.current = window.setTimeout(() => {
          advancePhase();
          setTimeout(() => setIsProcessing(false), 500);
        }, 600);
      } else {
        setTimeout(() => setIsProcessing(false), 200);
      }
    }, thinkingTime);
    
    return () => {
      if (botTimerRef.current) { clearTimeout(botTimerRef.current); botTimerRef.current = null; }
    };
  }, [gameState?.activePlayerIndex, gameState?.phase, isProcessing]);

  // Handle phase advancement when needed (for cases where betting round completes and we need to move on)
  useEffect(() => {
    if (!gameState || isProcessing) return;
    if (gameState.phase === 'showdown' || gameState.phase === 'winner' || gameState.phase === 'dealing') return;
    
    // Check if betting round is complete but we haven't advanced
    if (isBettingRoundComplete(gameState.players, gameState.currentBet) && canAnyoneAct(gameState.players)) {
      // This shouldn't normally happen if applyAction works correctly, but as a safety net:
      setIsProcessing(true);
      advanceTimerRef.current = window.setTimeout(() => {
        advancePhase();
        setTimeout(() => setIsProcessing(false), 500);
      }, 400);
    }
  }, [gameState?.players, gameState?.currentBet, gameState?.phase, isProcessing, advancePhase]);

  // Showdown processing
  useEffect(() => {
    if (!gameState || gameState.phase !== 'showdown' || isProcessing) return;
    
    setIsProcessing(true);
    setShowdownRevealed(false);
    
    // Deal remaining community cards if needed
    const cardsNeeded = 5 - gameState.communityCards.length;
    if (cardsNeeded > 0) {
      setGameState(prev => {
        if (!prev) return prev;
        const newCards = prev.deck.slice(0, cardsNeeded);
        return { ...prev, communityCards: [...prev.communityCards, ...newCards], deck: prev.deck.slice(cardsNeeded) };
      });
    }
    
    // Reveal cards
    const revealDelay = cardsNeeded > 0 ? 1200 : 400;
    setTimeout(() => {
      setShowdownRevealed(true);
      
      // Evaluate hands
      setTimeout(() => {
        setGameState(prev => {
          if (!prev) return prev;
          
          const activePlayers = prev.players.filter(p => !p.folded);
          const communityCards = prev.communityCards;
          
          if (communityCards.length < 5) return prev;
          
          const results = activePlayers.map(player => ({
            player,
            hand: evaluateHand(player.holeCards, communityCards),
            amount: 0,
          }));
          
          results.sort((a, b) => b.hand.value - a.hand.value);
          
          const bestValue = results[0].hand.value;
          const winners = results.filter(r => r.hand.value === bestValue);
          const share = Math.floor(prev.pot / winners.length);
          winners.forEach(w => { w.amount = share; });
          
          const handResults = results.map(r => ({ playerId: r.player.id, hand: r.hand }));
          
          return { ...prev, winners, phase: 'winner' as GamePhase, handResults };
        });
        
        setTimeout(() => setIsProcessing(false), 500);
      }, 1500);
    }, revealDelay);
  }, [gameState?.phase, isProcessing]);

  // Winner distribution and next hand
  useEffect(() => {
    if (!gameState || gameState.phase !== 'winner' || isProcessing) return;
    if (gameState.winners.length === 0) return;
    
    // Distribute chips and add reactions
    setGameState(prev => {
      if (!prev) return prev;
      
      const players = prev.players.map(p => {
        const winner = prev.winners.find(w => w.player.id === p.id);
        let updated = { ...p };
        
        if (winner) {
          updated.chips = p.chips + winner.amount;
        }
        
        if (!p.isHuman) {
          const isWinner = prev.winners.some(w => w.player.id === p.id);
          if (isWinner) {
            updated.reaction = getBotReaction(p.personality || 'balanced', 'win') || undefined;
          } else if (!p.folded) {
            updated.reaction = getBotReaction(p.personality || 'balanced', 'lose') || undefined;
          }
        }
        
        return updated;
      });
      
      return { ...prev, players };
    });
    
    // Auto-start next hand
    const timer = setTimeout(() => {
      startNewHand();
    }, 4500);
    
    return () => clearTimeout(timer);
  }, [gameState?.phase, isProcessing, startNewHand]);

  // Safety timeout - if game is stuck, allow manual next hand
  useEffect(() => {
    if (!gameState) return;
    if (gameState.phase === 'winner' || gameState.phase === 'idle') return;
    
    // If processing takes too long, reset
    const safetyTimer = setTimeout(() => {
      if (processingRef.current && gameState.phase !== 'showdown' && gameState.phase !== 'winner') {
        setIsProcessing(false);
      }
    }, 15000);
    
    return () => clearTimeout(safetyTimer);
  }, [gameState?.activePlayerIndex, gameState?.phase]);

  const resetGame = useCallback(() => {
    clearTimers();
    setGameState(null);
    setIsProcessing(false);
    setShowdownRevealed(false);
  }, []);

  // Check for game over conditions
  const isGameOver = gameState ? (
    (gameState.players.find(p => p.isHuman)?.chips ?? 0) <= 0 ||
    gameState.players.filter(p => p.chips > 0).length < 2
  ) : false;

  const humanWon = gameState ? (
    gameState.players.filter(p => p.chips > 0).length === 1 && 
    (gameState.players.find(p => p.isHuman)?.chips ?? 0) > 0
  ) : false;

  return {
    gameState,
    isProcessing,
    showdownRevealed,
    startNewHand,
    handlePlayerAction,
    resetGame,
    config: gameConfigRef.current,
    isGameOver,
    humanWon,
  };
}
