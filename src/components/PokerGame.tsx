import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card as CardType, Player } from '../poker/types';
import { usePokerGame } from '../poker/useGame';
import { soundSystem } from '../poker/sound';

function PlayingCard({ card, faceDown = false, delay = 0, small = false, highlighted = false }: {
  card?: CardType;
  faceDown?: boolean;
  delay?: number;
  small?: boolean;
  highlighted?: boolean;
}) {
  const suitSymbols: Record<string, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
  const suitColors: Record<string, string> = { hearts: '#dc2626', diamonds: '#dc2626', clubs: '#1f2937', spades: '#1f2937' };
  
  const w = small ? 40 : 56;
  const h = small ? 56 : 80;
  
  return (
    <motion.div
      initial={{ rotateY: 180, scale: 0.5, opacity: 0, y: -30 }}
      animate={{ rotateY: faceDown ? 180 : 0, scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.5, opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: delay * 0.18, type: 'spring', stiffness: 150, damping: 15 }}
      style={{ width: w, height: h, perspective: 800 }}
      className="relative flex-shrink-0"
    >
      <motion.div
        whileHover={!faceDown ? { y: -6, scale: 1.08, zIndex: 50 } : {}}
        className={`w-full h-full rounded-lg relative overflow-hidden`}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Card face */}
        <div
          className={`absolute inset-0 rounded-lg border-2 flex flex-col items-center justify-center ${
            faceDown
              ? 'bg-gradient-to-br from-indigo-800 via-blue-900 to-indigo-950 border-blue-600/50'
              : highlighted
                ? 'bg-gradient-to-b from-white to-yellow-50 border-yellow-400'
                : 'bg-gradient-to-b from-white to-gray-50 border-gray-300'
          }`}
          style={{
            boxShadow: highlighted
              ? '0 4px 12px rgba(234, 179, 8, 0.4), 0 0 20px rgba(234, 179, 8, 0.2)'
              : '0 2px 8px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)',
          }}
        >
          {!faceDown && card && (
            <>
              <div className="absolute top-1 left-1.5 leading-none" style={{ color: suitColors[card.suit] }}>
                <div className="font-bold" style={{ fontSize: small ? 10 : 12 }}>{card.rank}</div>
                <div style={{ fontSize: small ? 9 : 11 }}>{suitSymbols[card.suit]}</div>
              </div>
              <div style={{ color: suitColors[card.suit], fontSize: small ? 18 : 24 }}>
                {suitSymbols[card.suit]}
              </div>
              <div className="absolute bottom-1 right-1.5 leading-none rotate-180" style={{ color: suitColors[card.suit] }}>
                <div className="font-bold" style={{ fontSize: small ? 10 : 12 }}>{card.rank}</div>
                <div style={{ fontSize: small ? 9 : 11 }}>{suitSymbols[card.suit]}</div>
              </div>
            </>
          )}
          {faceDown && (
            <div className="w-[70%] h-[75%] rounded border border-blue-500/30 bg-gradient-to-br from-blue-800/50 to-blue-900/50 flex items-center justify-center">
              <div className="text-blue-400/30" style={{ fontSize: small ? 14 : 20 }}>♠♥</div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ChipDisplay({ amount, animate = true }: { amount: number; animate?: boolean }) {
  if (amount <= 0) return null;
  
  const getColor = (amt: number) => {
    if (amt >= 500) return { bg: 'from-purple-500 to-purple-700', border: 'border-purple-400', text: 'text-purple-100' };
    if (amt >= 100) return { bg: 'from-blue-500 to-blue-700', border: 'border-blue-400', text: 'text-blue-100' };
    if (amt >= 25) return { bg: 'from-green-500 to-green-700', border: 'border-green-400', text: 'text-green-100' };
    if (amt >= 5) return { bg: 'from-red-500 to-red-700', border: 'border-red-400', text: 'text-red-100' };
    return { bg: 'from-gray-200 to-gray-400', border: 'border-gray-300', text: 'text-gray-800' };
  };
  
  const color = getColor(amount);
  const numChips = Math.min(Math.ceil(Math.log10(amount + 1) * 1.5), 5);
  
  return (
    <motion.div
      initial={animate ? { scale: 0, y: 20 } : {}}
      animate={{ scale: 1, y: 0 }}
      className="relative flex items-end justify-center"
      style={{ height: 12 + numChips * 4, width: 32 }}
    >
      {Array.from({ length: numChips }).map((_, i) => (
        <motion.div
          key={i}
          initial={animate ? { y: -15, opacity: 0 } : {}}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="absolute w-7 h-7 rounded-full border-2 flex items-center justify-center"
          style={{
            bottom: i * 3,
            left: (i % 2) * 2 - 1,
            background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
            zIndex: numChips - i,
          }}
        >
          <div className={`w-5 h-5 rounded-full bg-gradient-to-b ${color.bg} border ${color.border} flex items-center justify-center shadow-inner`}>
            {i === numChips - 1 && (
              <span className={`text-[7px] font-bold ${color.text}`}>
                {amount >= 1000 ? `${(amount/1000).toFixed(1)}k` : amount}
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function PlayerSeat({ player, isActive, isDealer, isSmallBlind, isBigBlind, position, showdownRevealed, isWinner, handName }: {
  player: Player;
  isActive: boolean;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  position: { top: string; left: string };
  showdownRevealed: boolean;
  isWinner: boolean;
  handName?: string;
}) {
  const showCards = player.isHuman || (showdownRevealed && !player.folded);
  
  return (
    <motion.div
      className="absolute flex flex-col items-center"
      style={{ top: position.top, left: position.left, transform: 'translate(-50%, -50%)', zIndex: isWinner ? 20 : player.isHuman ? 15 : 10 }}
      animate={isWinner ? { scale: [1, 1.03, 1] } : {}}
      transition={{ duration: 1.5, repeat: isWinner ? Infinity : 0 }}
    >
      {/* Winner glow */}
      {isWinner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -inset-6 rounded-full bg-yellow-400/20 blur-xl pointer-events-none"
        />
      )}
      
      {/* Active turn ring */}
      {isActive && !player.folded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute -inset-4 rounded-full border-2 border-yellow-400/70 pointer-events-none"
        />
      )}
      
      {/* Cards */}
      <div className="flex gap-0.5 mb-1.5">
        {player.holeCards.length > 0 && player.holeCards.map((card, i) => (
          <PlayingCard
            key={`${card.rank}-${card.suit}-${i}`}
            card={card}
            faceDown={!showCards}
            delay={i}
            small={!player.isHuman}
            highlighted={isWinner}
          />
        ))}
      </div>
      
      {/* Hand name at showdown */}
      <AnimatePresence>
        {handName && showdownRevealed && !player.folded && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-medium text-yellow-300 mb-0.5 whitespace-nowrap"
          >
            {handName}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Player info box */}
      <div className={`relative px-3 py-1.5 rounded-xl text-center min-w-[90px] transition-all duration-300 ${
        player.folded 
          ? 'bg-gray-900/50 border border-gray-700/30 opacity-50'
          : player.isHuman 
            ? 'bg-gradient-to-b from-gray-700 to-gray-800 border border-gray-500/80 shadow-lg' 
            : 'bg-gradient-to-b from-gray-700/90 to-gray-800/90 border border-gray-600/60 shadow-md'
      }`}>
        {/* Name */}
        <div className={`text-xs font-semibold truncate ${player.isHuman ? 'text-white' : 'text-gray-200'}`}>
          {player.name}
        </div>
        {/* Chips */}
        <div className="text-xs font-bold text-yellow-400">
          ${player.chips.toLocaleString()}
        </div>
        
        {/* Badges */}
        <div className="absolute -top-2 -right-2 flex gap-0.5">
          {isDealer && (
            <motion.div 
              layoutId="dealer-btn"
              className="w-5 h-5 rounded-full bg-white text-gray-900 text-[8px] font-black flex items-center justify-center shadow-md border border-gray-200"
            >
              D
            </motion.div>
          )}
        </div>
        <div className="absolute -top-2 -left-2 flex gap-0.5">
          {isSmallBlind && (
            <div className="w-5 h-5 rounded-full bg-sky-500 text-white text-[7px] font-bold flex items-center justify-center shadow-md">
              SB
            </div>
          )}
          {isBigBlind && (
            <div className="w-5 h-5 rounded-full bg-rose-500 text-white text-[7px] font-bold flex items-center justify-center shadow-md">
              BB
            </div>
          )}
        </div>
        
        {/* Last action */}
        <AnimatePresence>
          {player.lastAction && !player.folded && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap"
            >
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                player.lastAction === 'fold' ? 'text-red-400 bg-red-900/30' :
                player.lastAction === 'all-in' ? 'text-purple-300 bg-purple-900/30' :
                player.lastAction === 'raise' ? 'text-yellow-300 bg-yellow-900/30' :
                'text-green-300 bg-green-900/30'
              }`}>
                {player.lastAction.toUpperCase()}
              </span>
            </motion.div>
          )}
          {player.folded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -bottom-5 left-1/2 -translate-x-1/2"
            >
              <span className="text-[10px] font-bold text-red-400/80 bg-red-900/20 px-1.5 py-0.5 rounded-full">
                FOLDED
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Thinking indicator */}
        {player.isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -top-7 left-1/2 -translate-x-1/2"
          >
            <div className="flex gap-0.5">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-yellow-400"
                />
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Reaction bubble */}
        <AnimatePresence>
          {player.reaction && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-800/95 border border-gray-600/80 rounded-lg px-2 py-0.5 shadow-lg"
            >
              <span className="text-[10px] text-gray-200 whitespace-nowrap">{player.reaction}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Bet in front of player */}
      {player.currentBet > 0 && (
        <motion.div
          initial={{ scale: 0, y: -10 }}
          animate={{ scale: 1, y: 0 }}
          className="mt-2 flex flex-col items-center"
        >
          <ChipDisplay amount={player.currentBet} />
        </motion.div>
      )}
    </motion.div>
  );
}

export default function PokerGame() {
  const { gameState, isProcessing, showdownRevealed, startNewHand, handlePlayerAction, resetGame, isGameOver, humanWon } = usePokerGame();
  const [betAmount, setBetAmount] = useState(0);
  const [showBetControls, setShowBetControls] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const currentPlayer = gameState?.players[gameState.activePlayerIndex];
  const isPlayerTurn = currentPlayer?.isHuman && !isProcessing && 
    gameState?.phase !== 'showdown' && gameState?.phase !== 'winner' && gameState?.phase !== 'dealing';
  
  const callAmount = gameState ? gameState.currentBet - (currentPlayer?.currentBet || 0) : 0;
  const canCheck = callAmount === 0;
  const canCall = callAmount > 0 && (currentPlayer?.chips || 0) > 0;
  const minRaiseAmount = gameState ? (gameState.currentBet + gameState.minRaise) : 0;
  const canRaise = (currentPlayer?.chips || 0) > callAmount + (gameState?.minRaise || 0);
  const canAllIn = (currentPlayer?.chips || 0) > 0 && gameState?.phase !== 'dealing';
  
  // Update bet amount when turn changes
  useEffect(() => {
    if (gameState && isPlayerTurn) {
      const min = gameState.currentBet + gameState.minRaise;
      setBetAmount(Math.min(min, currentPlayer?.chips || 0));
      setShowBetControls(false);
    }
  }, [gameState?.activePlayerIndex, isPlayerTurn]);
  
  // Sound effects
  useEffect(() => {
    soundSystem.setEnabled(soundEnabled);
  }, [soundEnabled]);
  
  // Trigger sounds on game events
  const prevPhaseRef = useRef(gameState?.phase);
  const prevCommunityCountRef = useRef(gameState?.communityCards.length || 0);
  const prevActionsRef = useRef<Record<string, string | undefined>>({});
  
  useEffect(() => {
    if (!gameState) return;
    
    // Card dealing sounds
    const newCount = gameState.communityCards.length;
    if (newCount > prevCommunityCountRef.current) {
      const cardsDealt = newCount - prevCommunityCountRef.current;
      for (let i = 0; i < cardsDealt; i++) {
        setTimeout(() => soundSystem.cardDeal(), i * 200);
      }
    }
    prevCommunityCountRef.current = newCount;
    
    // Detect player actions for sounds
    for (const player of gameState.players) {
      const prevAction = prevActionsRef.current[player.id];
      if (player.lastAction && player.lastAction !== prevAction) {
        if (player.lastAction === 'all-in') {
          soundSystem.allIn();
        } else if (player.lastAction === 'fold') {
          soundSystem.fold();
        } else if (player.lastAction === 'raise') {
          soundSystem.chipStack();
        } else if (player.lastAction === 'call') {
          soundSystem.chipPlace();
        }
      }
      prevActionsRef.current[player.id] = player.lastAction;
    }
    
    // Phase change sounds
    if (gameState.phase !== prevPhaseRef.current) {
      if (gameState.phase === 'showdown') {
        setTimeout(() => soundSystem.cardFlip(), 300);
      }
      if (gameState.phase === 'winner') {
        const isHumanWinner = gameState.winners.some(w => w.player.isHuman);
        setTimeout(() => {
          if (isHumanWinner) soundSystem.win();
          else soundSystem.lose();
        }, 500);
      }
    }
    prevPhaseRef.current = gameState.phase;
  }, [gameState?.phase, gameState?.communityCards.length, gameState?.winners, gameState?.players]);
  
  const handleRaise = () => {
    if (!showBetControls) {
      setShowBetControls(true);
      soundSystem.buttonClick();
    } else {
      handlePlayerAction('raise', betAmount);
      setShowBetControls(false);
      soundSystem.chipStack();
    }
  };
  
  const getPlayerPosition = (seatIndex: number, totalPlayers: number) => {
    if (totalPlayers <= 4) {
      const positions = [
        { top: '88%', left: '50%' },
        { top: '12%', left: '50%' },
        { top: '45%', left: '8%' },
        { top: '45%', left: '92%' },
      ];
      return positions[seatIndex] || positions[0];
    }
    const positions = [
      { top: '88%', left: '50%' },
      { top: '10%', left: '50%' },
      { top: '20%', left: '18%' },
      { top: '20%', left: '82%' },
      { top: '50%', left: '6%' },
      { top: '50%', left: '94%' },
    ];
    return positions[seatIndex] || positions[0];
  };
  
  // Get hand names for showdown
  const playerHandNames = useMemo(() => {
    if (!gameState) return {};
    const names: Record<string, string> = {};
    if (gameState.handResults) {
      for (const r of gameState.handResults) {
        names[r.playerId] = r.hand.name;
      }
    }
    return names;
  }, [gameState?.handResults]);
  
  // Start screen
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0f1a] via-[#0d1520] to-[#0a0f1a] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-md"
        >
          {/* Logo area */}
          <div className="mb-8">
            <motion.div
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              className="text-6xl mb-4"
            >
              ♠
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 mb-2">
              Texas
            </h1>
            <p className="text-gray-400 text-lg">Single Player Hold'em</p>
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-2 gap-3 mb-8 text-sm">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
              <div className="text-yellow-400 font-semibold">4 Opponents</div>
              <div className="text-gray-500 text-xs">Unique personalities</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
              <div className="text-yellow-400 font-semibold">$1,000</div>
              <div className="text-gray-500 text-xs">Starting chips</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
              <div className="text-yellow-400 font-semibold">$10/$20</div>
              <div className="text-gray-500 text-xs">Blinds</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
              <div className="text-yellow-400 font-semibold">Normal</div>
              <div className="text-gray-500 text-xs">Difficulty</div>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(34, 197, 94, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setGameStarted(true);
              startNewHand();
            }}
            className="px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-xl rounded-xl shadow-lg shadow-green-600/30 hover:from-green-500 hover:to-emerald-500 transition-all"
          >
            Sit Down
          </motion.button>
        </motion.div>
      </div>
    );
  }
  
  if (!gameState) return null;
  
  // Game over screen
  if (isGameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0f1a] via-[#0d1520] to-[#0a0f1a] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="text-6xl mb-4">
            {humanWon ? '🏆' : '💔'}
          </div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 mb-3">
            {humanWon ? 'You Won!' : 'Game Over'}
          </h2>
          <p className="text-gray-400 mb-6">
            {humanWon 
              ? 'Congratulations! You\'ve outlasted all opponents.' 
              : 'You\'ve run out of chips. Better luck next time!'}
          </p>
          <div className="mb-6 bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
            <div className="text-sm text-gray-400">Final Stack</div>
            <div className="text-2xl font-bold text-yellow-400">
              ${gameState.players.find(p => p.isHuman)?.chips.toLocaleString() || 0}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              resetGame();
              window.setTimeout(() => startNewHand(), 100);
            }}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:from-green-500 hover:to-emerald-500 transition-all"
          >
            New Game
          </motion.button>
        </motion.div>
      </div>
    );
  }
  
  const winnerIds = gameState.winners.map(w => w.player.id);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f1a] via-[#0d1520] to-[#0a0f1a] flex flex-col items-center justify-center p-2 md:p-4 overflow-hidden">
      {/* Sound toggle */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-3 right-3 z-50 text-gray-400 hover:text-white transition-colors text-sm"
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      
      {/* Table container */}
      <div className="relative w-full max-w-4xl" style={{ aspectRatio: '16/10' }}>
        {/* Table rail */}
        <div className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-amber-900 via-amber-800 to-amber-950 shadow-[0_0_60px_rgba(0,0,0,0.8)]" />
        
        {/* Table felt */}
        <div className="absolute inset-3 md:inset-4 rounded-[50%] bg-gradient-to-b from-green-800 via-green-700 to-green-800 shadow-[inset_0_0_80px_rgba(0,0,0,0.4)]">
          {/* Felt texture */}
          <div className="absolute inset-0 rounded-[50%] opacity-30"
            style={{
              backgroundImage: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.05) 0%, transparent 60%)',
            }}
          />
          {/* Inner border */}
          <div className="absolute inset-3 rounded-[50%] border border-green-600/20" />
          
          {/* Deck visualization */}
          <div className="absolute top-[36%] left-[12%] md:left-[15%] -translate-y-1/2">
            <div className="relative w-10 h-14 md:w-12 md:h-16">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="absolute inset-0 rounded-md bg-gradient-to-br from-indigo-800 via-blue-900 to-indigo-950 border border-blue-600/40 shadow-md"
                  style={{ transform: `translate(${i * 0.5}px, ${-i * 0.5}px) rotate(${i * 0.5}deg)` }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-[65%] h-[70%] rounded-sm border border-blue-500/20 bg-blue-900/30" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Community Cards */}
        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1.5 md:gap-2">
          <AnimatePresence mode="popLayout">
            {gameState.communityCards.map((card, i) => (
              <PlayingCard key={`${card.rank}-${card.suit}`} card={card} delay={i} />
            ))}
          </AnimatePresence>
          {Array.from({ length: 5 - gameState.communityCards.length }).map((_, i) => (
            <div key={`empty-${i}`} className="w-14 h-20 rounded-lg border border-green-600/20 bg-green-900/20" />
          ))}
        </div>
        
        {/* Pot display */}
        <div className="absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <AnimatePresence>
            {gameState.pot > 0 && (
              <motion.div
                key={gameState.pot}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <ChipDisplay amount={Math.min(gameState.pot, 500)} />
                <motion.div
                  key={gameState.pot}
                  initial={{ scale: 1.15 }}
                  animate={{ scale: 1 }}
                  className="mt-1 text-yellow-400 font-bold text-sm md:text-base whitespace-nowrap"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                >
                  Pot: ${gameState.pot.toLocaleString()}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Winner announcement */}
        <AnimatePresence>
          {gameState.phase === 'winner' && gameState.winners.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-[68%] left-1/2 -translate-x-1/2 text-center z-30"
            >
              <div className="bg-gray-900/95 border border-yellow-500/60 rounded-xl px-5 py-3 shadow-xl shadow-yellow-500/10">
                {gameState.winners[0].hand && (
                  <div className="text-xs text-gray-300 mb-1 font-medium">
                    {gameState.winners[0].hand.name}
                  </div>
                )}
                <div className="text-yellow-400 font-bold text-sm md:text-base">
                  {gameState.winners.map(w => w.player.name).join(' & ')} wins ${gameState.pot.toLocaleString()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Players */}
        {gameState.players.map((p, i) => (
          <PlayerSeat
            key={p.id}
            player={p}
            isActive={gameState.activePlayerIndex === i && gameState.phase !== 'showdown' && gameState.phase !== 'winner' && gameState.phase !== 'dealing'}
            isDealer={gameState.dealerIndex === i}
            isSmallBlind={gameState.smallBlindIndex === i}
            isBigBlind={gameState.bigBlindIndex === i}
            position={getPlayerPosition(p.seatIndex, gameState.players.length)}
            showdownRevealed={showdownRevealed}
            isWinner={winnerIds.includes(p.id)}
            handName={playerHandNames[p.id]}
          />
        ))}
      </div>
      
      {/* Controls area */}
      <div className="mt-2 md:mt-4 w-full max-w-2xl px-4">
        <AnimatePresence>
          {isPlayerTurn && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col items-center gap-3"
            >
              {/* Turn indicator */}
              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-yellow-400 font-bold text-sm tracking-wide"
              >
                YOUR TURN
              </motion.div>
              
              {/* Bet slider */}
              <AnimatePresence>
                {showBetControls && canRaise && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col items-center gap-2 w-full overflow-hidden"
                  >
                    <div className="flex items-center gap-3 w-full max-w-sm">
                      <button
                        onClick={() => {
                          const min = (gameState.currentBet || 0) + (gameState.minRaise || gameState.bigBlind);
                          setBetAmount(Math.max(min, betAmount - gameState.bigBlind));
                        }}
                        className="w-8 h-8 rounded-full bg-gray-700 text-white font-bold hover:bg-gray-600 transition-colors flex items-center justify-center"
                      >
                        −
                      </button>
                      <input
                        type="range"
                        min={(gameState.currentBet || 0) + (gameState.minRaise || gameState.bigBlind)}
                        max={currentPlayer?.chips || 0}
                        step={gameState.bigBlind}
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        className="flex-1 accent-yellow-400"
                      />
                      <button
                        onClick={() => setBetAmount(Math.min((currentPlayer?.chips || 0), betAmount + gameState.bigBlind))}
                        className="w-8 h-8 rounded-full bg-gray-700 text-white font-bold hover:bg-gray-600 transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setBetAmount((gameState.currentBet || 0) + (gameState.minRaise || gameState.bigBlind))}
                        className="px-2.5 py-1 text-[11px] bg-gray-700/80 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                      >
                        Min
                      </button>
                      <button
                        onClick={() => setBetAmount(Math.max(minRaiseAmount, Math.floor(gameState.pot / 2)))}
                        className="px-2.5 py-1 text-[11px] bg-gray-700/80 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                      >
                        ½ Pot
                      </button>
                      <button
                        onClick={() => setBetAmount(Math.max(minRaiseAmount, gameState.pot))}
                        className="px-2.5 py-1 text-[11px] bg-gray-700/80 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                      >
                        Pot
                      </button>
                      <button
                        onClick={() => setBetAmount(currentPlayer?.chips || 0)}
                        className="px-2.5 py-1 text-[11px] bg-purple-700/80 text-purple-200 rounded-md hover:bg-purple-600 transition-colors"
                      >
                        All-In
                      </button>
                    </div>
                    <div className="text-yellow-400 font-bold text-sm">
                      Raise to ${betAmount.toLocaleString()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => { handlePlayerAction('fold'); soundSystem.fold(); }}
                  className="px-4 md:px-5 py-2.5 bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-lg shadow-lg shadow-red-900/30 transition-all text-sm"
                >
                  Fold
                </motion.button>
                
                {canCheck && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => { handlePlayerAction('check'); soundSystem.buttonClick(); }}
                    className="px-4 md:px-5 py-2.5 bg-gradient-to-b from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-bold rounded-lg shadow-lg shadow-sky-900/30 transition-all text-sm"
                  >
                    Check
                  </motion.button>
                )}
                
                {canCall && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => { handlePlayerAction('call'); soundSystem.chipPlace(); }}
                    className="px-4 md:px-5 py-2.5 bg-gradient-to-b from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold rounded-lg shadow-lg shadow-green-900/30 transition-all text-sm"
                  >
                    Call ${Math.min(callAmount, currentPlayer?.chips || 0).toLocaleString()}
                  </motion.button>
                )}
                
                {canRaise && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={handleRaise}
                    className="px-4 md:px-5 py-2.5 bg-gradient-to-b from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-bold rounded-lg shadow-lg shadow-yellow-900/30 transition-all text-sm"
                  >
                    {showBetControls ? `Raise $${betAmount.toLocaleString()}` : 'Raise'}
                  </motion.button>
                )}
                
                {canAllIn && !canRaise && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => { handlePlayerAction('allin'); soundSystem.allIn(); }}
                    className="px-4 md:px-5 py-2.5 bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-lg shadow-lg shadow-purple-900/30 transition-all text-sm"
                  >
                    All-In ${currentPlayer?.chips.toLocaleString()}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Status messages */}
        {!isPlayerTurn && gameState.phase !== 'winner' && (
          <div className="text-center">
            {gameState.phase === 'dealing' && (
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-gray-400 text-sm"
              >
                Dealing cards...
              </motion.p>
            )}
            {gameState.phase === 'showdown' && (
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-yellow-400 text-sm font-medium"
              >
                Showdown...
              </motion.p>
            )}
            {(gameState.phase === 'preflop' || gameState.phase === 'flop' || gameState.phase === 'turn' || gameState.phase === 'river') && (
              <p className="text-gray-500 text-sm">
                Waiting for opponents...
              </p>
            )}
          </div>
        )}
        
        {/* Game info bar */}
        <div className="flex justify-between items-center mt-4 px-2 text-gray-500 text-[11px]">
          <span>Hand #{gameState.handNumber}</span>
          <span className="text-gray-600">•</span>
          <span>Blinds ${gameState.smallBlind}/${gameState.bigBlind}</span>
          <span className="text-gray-600">•</span>
          <span className="uppercase">{gameState.phase}</span>
        </div>
        
        {/* Winner phase - show next hand info */}
        {gameState.phase === 'winner' && (
          <div className="flex justify-center mt-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="text-xs text-gray-500"
            >
              Next hand starting soon...
            </motion.div>
            <button
              onClick={startNewHand}
              className="text-xs text-gray-600 hover:text-gray-300 underline transition-colors ml-3"
            >
              Skip →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
