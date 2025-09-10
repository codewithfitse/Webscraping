import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiRefreshCw,
  FiX,
  FiArrowLeft,
  FiRotateCw,
  FiPlus,
  FiMinus,
} from "react-icons/fi";
import Card from "./Card";
import Hand from "./Hand";
import Loading from "./Loading";
import Rules from "./Rules";
import GameCompletionModal from "./GameCompletionModal";

import { useGetUserInfo } from "../utils/getUserinfo";
import { io } from "socket.io-client";
import { apiUrl } from "../utils/apiUrl";
import { FaTrophy, FaBell, FaHandPaper } from "react-icons/fa";
import boardBg from "../assets/board.jpg";
import { motion, AnimatePresence } from "framer-motion";


function Game() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameState, setGameState] = useState(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState(-1);
  const [socket, setSocket] = useState(null);
  const [isSorting, setIsSorting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [showLayoffModal, setShowLayoffModal] = useState(false);
  const [selectedCardsForMeld, setSelectedCardsForMeld] = useState([]);
  const [targetMeldIndex, setTargetMeldIndex] = useState(-1);
  const [showJokerSubstitutionModal, setShowJokerSubstitutionModal] = useState(false);
  const [selectedJokerMeld, setSelectedJokerMeld] = useState(null);
  const [selectedJokerIndex, setSelectedJokerIndex] = useState(-1);
  const [selectedReplacementCard, setSelectedReplacementCard] = useState(-1);
  const token = localStorage.getItem("cardgametoken");
  const { userInfo } = useGetUserInfo(token);
  const [showPokeWarning, setShowPokeWarning] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const handRef = useRef(null);
  const deckRef = useRef(null);
  const discardRef = useRef(null);
  const [showLayoffHistory, setShowLayoffHistory] = useState(false);
  const [removingLayoff, setRemovingLayoff] = useState(false);
  const [showPokeNotification, setShowPokeNotification] = useState(false);
  const [pokeNotificationMessage, setPokeNotificationMessage] = useState("");

  // Add error auto-dismiss effect
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Show modal when game is completed
  useEffect(() => {
    if (gameState?.status === "completed") {
      setShowModal(true);
    }
  }, [gameState?.status]);

  // Initialize socket connection
  useEffect(() => {
    if (!token || !userInfo) return;

    const newSocket = io(apiUrl, {
      auth: { token },
      query: { token },
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
      newSocket.emit("joinGame", { gameId });
    });

    newSocket.on("gameStateUpdate", ({ game }) => {
      setGameState(game);
      setError(null);
      setIsLoading(false);
      setIsSorting(false);
      
      // If game is completed, ensure modal stays open
      if (game.status === "completed") {
        setShowModal(true);
      }
    });

    newSocket.on("gameError", ({ message }) => {
      setError(message);
      setIsSorting(false);
    });

    newSocket.on("gameFinished", ({ game }) => {
      setGameState(game);
      setShowModal(true);
      setIsLoading(false);
      setIsSorting(false);
    });

    // Poke event listeners
    newSocket.on("pokeReceived", ({ sender, gameId, pokeCount }) => {
      console.log(`Poke received from ${sender} in game ${gameId}`);
      setPokeNotificationMessage(`${sender} is waiting for your move!`);
      setShowPokeNotification(true);
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setShowPokeNotification(false);
      }, 5000);
    });

    newSocket.on("pokeSent", ({ success, message }) => {
      if (success) {
        console.log("Poke sent successfully:", message);
        // Optional: Show success notification
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setError("Failed to connect to game server");
      setIsLoading(false);
      setIsSorting(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [gameId, token, userInfo]);



  const handlePokeUser = () => {
    if (gameState?.pokedBy === userInfo?.chatId) {
      setShowPokeWarning(true);
      return;
    }

    const opponent = gameState?.players?.find(
      (player) => player.chatId != userInfo?.chatId
    );
    if (!opponent) {
      console.error("Opponent not found");
      return;
    }

    if (!socket) {
      setError("Not connected to game server");
      return;
    }

    // Use socket to send poke
    socket.emit("pokeOpponent", {
          gameId: gameId,
      receiverId: opponent.chatId,
      senderId: userInfo?.chatId,
      senderUsername: userInfo?.username
    });
  };



  const handleLeaveGame = async (gameId) => {
    if (!socket) return;

    try {
      // Emit leave game event to server
      socket.emit("leaveGame", { gameId });

      // Disconnect from socket
      socket.disconnect();
    } catch (error) {
      console.error("Error leaving game:", error);
      // Even if there's an error, we should still redirect to lobby
    }
  };

  const handleCardSelect = (cardIndex) => {
    if (isReorderMode) {
      // Handle reordering logic
      return;
    }

    toggleCardSelection(cardIndex);
  };

  const handleDragStart = (index) => {
    setIsDragging(true);
    setSelectedCardIndex(index);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setSelectedCardIndex(-1);
  };

  const handleReorder = (newOrder) => {
    if (socket && gameState) {
      socket.emit("reorderHand", { gameId, newOrder });
    }
  };

  const handleBestSort = async () => {
    if (!socket || !gameState) return;

    setIsSorting(true);
    socket.emit("sortHand", { gameId });
  };

  const drawCard = (source) => {
    if (!socket || !gameState) return;
    socket.emit("drawCard", { gameId, source });
  };



  const [targetPlayerChatId, setTargetPlayerChatId] = useState(null);

  const handleLayoffCard = () => {
    if (!socket || !gameState || selectedCardsForMeld.length !== 1 || targetMeldIndex === -1) return;

    // Send layoff directly to server without validation
    socket.emit("layoffCard", {
      gameId,
      cardIndex: selectedCardsForMeld[0],
      targetMeldIndex,
      targetPlayerChatId
    });
    clearAllSelections();
    setTargetMeldIndex(-1);
    setTargetPlayerChatId(null);
    setShowLayoffModal(false);
  };

  const handleRemoveLayoff = async (layoffIndex) => {
    if (removingLayoff) return;

    setRemovingLayoff(true);
    try {
      const response = await fetch(`${apiUrl}/api/games/remove-layoff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          gameId: gameId,
          layoffIndex: layoffIndex
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the game state
        window.location.reload();
      } else {
        setError(data.error || 'Failed to remove layoff');
      }
    } catch (error) {
      console.error('Error removing layoff:', error);
      setError('Failed to remove layoff');
    } finally {
      setRemovingLayoff(false);
    }
  };






  // Universal card selection - works for both discard and meld
  const toggleCardSelection = (index) => {
    if (selectedCardsForMeld.includes(index)) {
      // Remove card from selection
      setSelectedCardsForMeld(selectedCardsForMeld.filter(i => i !== index));
    } else {
      // Add card to selection
      setSelectedCardsForMeld([...selectedCardsForMeld, index]);
    }

    // Clear single card selection since we're using multi-selection now
    setSelectedCardIndex(-1);
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedCardsForMeld([]);
    setSelectedCardIndex(-1);
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!gameState) {
    return <div>Game not found</div>;
  }

  const currentPlayer = gameState.players.find(
    (p) => p.chatId === userInfo?.chatId
  );
  const opponentPlayer = gameState.players.find(
    (p) => p?.username !== userInfo?.username
  );

  const isPlayerTurn = gameState.currentPlayer === userInfo?.username;
  const playerHand = currentPlayer?.hand || [];
  const playerMelds = currentPlayer?.melds || [];

  // Helper function to get rank value (matches backend)
  const getRankValue = (rank) => {
    const rankValues = {
      A: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10,
      J: 11, Q: 12, K: 13
    };
    return rankValues[rank] || 0;
  };

  // Helper function to get card value for scoring (matches backend logic)
  const getCardValue = (card, context = 'default', meldContext = null) => {
    if (card.isJoker) {
      // For jokers, we need to determine their value based on context
      if (meldContext && meldContext.type === 'set') {
        // In sets, joker takes the value of other cards
        const nonJokers = meldContext.cards.filter(c => !c.isJoker);
        if (nonJokers.length > 0) {
          const representedRank = nonJokers[0].rank;
          return getCardValue({ rank: representedRank, isJoker: false }, 'set');
        }
      } else if (meldContext && (meldContext.type === 'run' || meldContext.type === 'auto')) {
        // For runs, calculate joker's position value
        return calculateJokerValueInRun(card, meldContext);
      }
      return 0; // Fallback
    }
    
    if (card.rank === 'A') {
      if (context === 'set') {
        return 11; // A = 11 in sets
      } else if (context === 'exceptional' || context === 'high_run') {
        return 11; // A = 11 in J-Q-K-A sequences
      } else {
        return 1; // A = 1 in regular runs
      }
    }
    
    if (['J', 'Q', 'K'].includes(card.rank)) {
      return 10; // Face cards = 10 points
    }
    
    return parseInt(card.rank) || 0;
  };

  // Helper function to calculate joker value in a run
  const calculateJokerValueInRun = (jokerCard, meldContext) => {
    const nonJokers = meldContext.cards.filter(c => !c.isJoker);
    
    if (nonJokers.length === 0) return 0;
    
    // Get all non-joker values and sort them
    const nonJokerValues = nonJokers.map(c => getRankValue(c.rank)).sort((a, b) => a - b);
    
    // Simple approach: find the missing value in the sequence
    const minVal = nonJokerValues[0];
    const maxVal = nonJokerValues[nonJokerValues.length - 1];
    
    // Check if there's a gap in the sequence (most common case)
    for (let i = minVal; i <= maxVal; i++) {
      if (!nonJokerValues.includes(i)) {
        return i;
      }
    }
    
    // If no gap found, joker extends the sequence
    if (nonJokerValues.length === 2) {
      const gap = nonJokerValues[1] - nonJokerValues[0];
      
      // If there's a gap of 2, joker fills it
      if (gap === 2) {
        return nonJokerValues[0] + 1;
      }
      
      // If gap is 1, joker extends the sequence
      if (gap === 1) {
        const jokerIndex = meldContext.cards.indexOf(jokerCard);
        const firstNonJokerIndex = meldContext.cards.findIndex(c => !c.isJoker);
        const lastNonJokerIndex = meldContext.cards.map((c, i) => !c.isJoker ? i : -1).filter(i => i !== -1).pop();
        
        if (jokerIndex < firstNonJokerIndex) {
          return minVal - 1;
        } else if (jokerIndex > lastNonJokerIndex) {
          return maxVal + 1;
        }
      }
    }
    
    // For single non-joker, joker can be before or after
    if (nonJokerValues.length === 1) {
      const jokerIndex = meldContext.cards.indexOf(jokerCard);
      const nonJokerIndex = meldContext.cards.findIndex(c => !c.isJoker);
      
      if (jokerIndex < nonJokerIndex) {
        return nonJokerValues[0] - 1;
      } else {
        return nonJokerValues[0] + 1;
      }
    }
    
    return 9; // Fallback
  };

  // Check if player can discard (not blocked by rules)
  const canDiscard = () => {
    if (!isPlayerTurn) return false;
    if (selectedCardsForMeld.length !== 1) return false;

    // If player drew from discard, check for hidden melds and 41+ points OR 3+ melds
    if (currentPlayer?.hasDrawnFromDiscard) {
      const hiddenMelds = playerMelds.filter(meld => meld.isVisible === false);
      const visibleMelds = playerMelds.filter(meld => meld.isVisible === true);
      
      if (hiddenMelds.length > 0) return false;

      // Calculate total meld points using backend logic
      let totalPoints = 0;
      playerMelds.forEach(meld => {
        if (meld && meld.cards && Array.isArray(meld.cards)) {
          let context = 'default';
          
          if (meld.type === 'set') {
            context = 'set';
          } else if (meld.type === 'run' || meld.type === 'auto') {
            // For auto type, determine if it's actually a run or set
            if (meld.type === 'auto') {
              const nonJokers = meld.cards.filter(c => !c.isJoker);
              if (nonJokers.length > 0) {
                const ranks = nonJokers.map(c => c.rank);
                const uniqueRanks = new Set(ranks);
                if (uniqueRanks.size === 1) {
                  context = 'set';
                } else {
                  context = 'run';
                }
              } else {
                context = 'run';
              }
            } else {
              context = 'run';
            }
            
            // Check if it's a J-Q-K-A sequence
            const nonJokers = meld.cards.filter(c => !c.isJoker);
            const hasJack = nonJokers.some(c => c.rank === 'J');
            const hasQueen = nonJokers.some(c => c.rank === 'Q');
            const hasKing = nonJokers.some(c => c.rank === 'K');
            const hasAce = nonJokers.some(c => c.rank === 'A');
            
            if (hasJack && hasQueen && hasKing && hasAce) {
              context = 'exceptional';
            }
          }
          
          const meldPoints = meld.cards.reduce((sum, card) => {
            return sum + getCardValue(card, context, meld);
          }, 0);
          
          totalPoints += meldPoints;
        }
      });

      console.log(`Frontend meld calculation: ${totalPoints} points, ${visibleMelds.length} visible melds`);
      
      // Check if player has 41+ points OR 3+ visible melds
      const hasEnoughPoints = totalPoints >= 41;
      const hasEnoughMelds = visibleMelds.length >= 3;
      
      if (!hasEnoughPoints && !hasEnoughMelds) return false;
    }

    return true;
  };

  // Get game mode display name
  const getGameModeDisplay = (mode) => {
    switch (mode) {
      case 'UP_AND_DOWN': return 'UP & DOWN';
      case 'UP': return 'UP';
      case 'DOWN': return 'DOWN (Master)';
      case 'SIDE': return 'SIDE';
      default: return mode;
    }
  };

  // Check if player has laid off to a specific meld
  const hasPlayerLaidOffToMeld = (targetPlayerChatId, targetMeldIndex) => {
    if (!gameState?.layoffHistory) return false;

    return gameState.layoffHistory.some(record =>
      record.playerChatId === userInfo?.chatId &&
      record.targetPlayerChatId === targetPlayerChatId &&
      record.targetMeldIndex === targetMeldIndex
    );
  };

  // Get layoff index for a specific meld
  const getLayoffIndexForMeld = (targetPlayerChatId, targetMeldIndex) => {
    if (!gameState?.layoffHistory) return -1;

    const layoffIndex = gameState.layoffHistory.findIndex(record =>
      record.playerChatId === userInfo?.chatId &&
      record.targetPlayerChatId === targetPlayerChatId &&
      record.targetMeldIndex === targetMeldIndex
    );

    return layoffIndex;
  };

  return (
    <div
      className="flex flex-col items-center min-h-screen w-full max-w-md mx-auto relative"
      style={{
        backgroundImage: `url(${boardBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Waiting Modal - Render outside main layout */}
      {gameState?.status === "waiting" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-blue-900/95 to-purple-900/95 backdrop-blur-lg rounded-2xl border border-white/20 p-8 max-w-md w-full text-center shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center">
                <FaHandPaper className="text-4xl text-blue-300" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">
              Waiting for Players
            </h2>

            <p className="text-blue-200 text-sm leading-relaxed mb-6">
              {currentPlayer?.isHost
                ? "You're the host! Waiting for another player to join your game."
                : "Waiting for the host to start the game. Get ready to play some cards!"
              }
            </p>


            <div className="flex flex-col items-center gap-4">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>

              {/* Reload button for host */}
              {currentPlayer?.isHost && (
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors border border-blue-500/30"
                  title="Refresh page"
                >
                  <FiRotateCw className="h-4 w-4" />
                  <span className="text-sm">Refresh</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="w-full flex flex-col">
        {/* Game Completion Modal */}
        <GameCompletionModal
          isOpen={showModal && gameState?.status === "completed"}
          onClose={() => setShowModal(false)}
          gameState={gameState}
          onPlayAgain={() => navigate(`/lobby?token=${token}`)}
          userInfo={userInfo}
        />

        {/* Back Button and Game Info Display */}
        <div className="flex justify-between items-center w-full px-2 py-2">
          <button
            onClick={() => navigate(`/lobby?token=${token}`)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors duration-200 w-12 h-10"
          >
            <FiArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center justify-between">
            <span className="text-blue-200 text-sm">Game #</span>
            <span className="text-white font-mono text-sm bg-black/30 px-2 py-1 rounded">
              {gameState?.gameId}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            {/* Stake Display */}
            <div className="flex items-center justify-center gap-2 px-4 py-1 bg-yellow-500/20 text-yellow-200 rounded-md text-xs">
              <FaTrophy className="h-3 w-3" />
              <span>{((gameState?.betAmount || 0) * 2 * 0.9).toFixed(2)} ETB</span>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors duration-200 w-12 h-10"
          >
            <FiRotateCw className="h-4 w-4" />
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
            <div className="bg-red-500/90 backdrop-blur-lg rounded-lg border border-red-500/20 p-4 text-red-200 flex items-center gap-4 shadow-lg">
              <div className="flex items-center">
                <FiAlertCircle className="inline-block mr-2" />
                {error}
              </div>
              <button
                onClick={() => setError(null)}
                className="p-1 hover:bg-red-500/30 rounded-full transition-colors duration-200"
                title="Dismiss"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Poke Notification */}
        <AnimatePresence>
          {showPokeNotification && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.8 }}
              className="fixed top-4 right-4 z-50"
            >
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    "0 4px 20px rgba(251, 191, 36, 0.3)",
                    "0 8px 30px rgba(251, 191, 36, 0.5)",
                    "0 4px 20px rgba(251, 191, 36, 0.3)"
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 backdrop-blur-lg rounded-xl border border-yellow-400/30 p-4 text-white shadow-lg max-w-sm"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [-10, 10, -10, 10, 0] }}
                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <FaBell className="text-2xl" />
                  </motion.div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">🔔 Poke Received!</h4>
                    <p className="text-xs opacity-90">{pokeNotificationMessage}</p>
                  </div>
                  <button
                    onClick={() => setShowPokeNotification(false)}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
                    title="Dismiss"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col h-full px-4">
          {/* Top Section - Deck, Discard, Base Card */}
          <div className="flex justify-between items-center py-4">
            {/* Deck */}
            <div className="flex flex-col items-center">
              <div
                ref={deckRef}
                className={`relative ${isPlayerTurn && !(gameState.lastAction === 'game_started' && currentPlayer?.isHost) ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                onClick={() => isPlayerTurn && !(gameState.lastAction === 'game_started' && currentPlayer?.isHost) && drawCard('deck')}
              >
                <div className="w-12 h-16 bg-orange-800 border border-white/20 rounded-md flex items-center justify-center text-white text-xs font-bold">
                  {gameState.deck?.length || 26}
                </div>
              </div>
              <span className="text-white text-xs mt-1">Stock {gameState.deck?.length || 26}</span>
            </div>

            {/* Discard Pile */}
            <div className="flex flex-col items-center">
              <div
                ref={discardRef}
                className={`relative ${isPlayerTurn && !(gameState.lastAction === 'game_started' && currentPlayer?.isHost) ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                onClick={() => isPlayerTurn && !(gameState.lastAction === 'game_started' && currentPlayer?.isHost) && drawCard('discard')}
              >
                {gameState.discardPile?.length > 0 ? (
                  <div className="w-12 h-16">
                    <Card card={gameState.discardPile[gameState.discardPile.length - 1]} size={64} />
                  </div>
                ) : (
                  <div className="w-12 h-16 bg-gray-600 border border-white/20 rounded-md"></div>
                )}
              </div>
              <span className="text-white text-xs mt-1">Discard</span>
            </div>


            {/* Base Card */}
            {gameState.baseCard && (
              <div className="flex flex-col items-center">
                <div
                  className={`relative ${isPlayerTurn && !(gameState.lastAction === 'game_started' && currentPlayer?.isHost) ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                  onClick={() => isPlayerTurn && !(gameState.lastAction === 'game_started' && currentPlayer?.isHost) && drawCard('base')}
                >
                  <div className="w-12 h-16">
                    <Card card={gameState.baseCard} size={64} />
                  </div>
                </div>
                <span className="text-white text-xs mt-1">Base</span>

                {/* Game Mode Display - Below Base Card */}
                <div className="flex justify-center mb-3">
                  <div className="flex items-center justify-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-200 rounded-md text-xs">
                    <span>{getGameModeDisplay(gameState.gameType)}</span>
                  </div>
                </div>
              </div>


            )}



            {/* opponent melds */}
            <div className="flex flex-col items-center">
              {/* Opponent's Melds Section - Next to Deck Area */}
              {opponentPlayer?.melds?.filter(meld => meld.isVisible === true).length > 0 && (
                <div className="w-full max-w-[200px] max-h-32 overflow-y-auto overflow-x-hidden mb-3 scrollbar-thin scrollbar-thumb-blue-400/30 scrollbar-track-transparent">
                  <div className="flex flex-col gap-2 p-1">
                    {opponentPlayer.melds
                      .filter(meld => meld.isVisible === true)
                      .map((meld, meldIndex) => (
                        <div key={`opponent-${meldIndex}`} className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 flex-shrink-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-blue-300 text-xs capitalize">
                              {meld.type}
                            </div>
                            <div className="flex gap-1">
                              {hasPlayerLaidOffToMeld(opponentPlayer?.chatId, meldIndex) && (
                                <button
                                  onClick={() => {
                                    const layoffIndex = getLayoffIndexForMeld(opponentPlayer?.chatId, meldIndex);
                                    if (layoffIndex !== -1) {
                                      handleRemoveLayoff(layoffIndex);
                                    }
                                  }}
                                  disabled={removingLayoff}
                                  className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                  title="Remove your layoff"
                                >
                                  {removingLayoff ? 'Removing...' : 'Remove Layoff'}
                                </button>
                              )}
                              {meld.cards.some(card => card.isJoker) && (
                                <button
                                  onClick={() => {
                                    setSelectedJokerMeld({ meldIndex, playerChatId: opponentPlayer?.chatId, isOwnMeld: false });
                                    setShowJokerSubstitutionModal(true);
                                  }}
                                  className="text-yellow-400 hover:text-yellow-300 text-xs px-2 py-1 rounded bg-yellow-500/20 hover:bg-yellow-500/30 transition-colors"
                                  title="Substitute joker"
                                >
                                  Substitute Joker
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {meld.cards.map((card, cardIndex) => (
                              <Card key={cardIndex} card={card} size={32} />
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            </div>



          </div>



          {/* Layoff History Section */}
          {gameState?.layoffHistory && gameState.layoffHistory.length > 0 && (
            <div className="bg-black/20 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-white text-sm font-medium">
                  📋 Layoff History ({gameState.layoffHistory.length})
                </div>
                <button
                  onClick={() => setShowLayoffHistory(!showLayoffHistory)}
                  className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
                >
                  {showLayoffHistory ? 'Hide' : 'Show'} Details
                </button>
              </div>

              {showLayoffHistory && (
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {gameState.layoffHistory.map((record, index) => (
                    <div key={index} className="bg-white/10 rounded p-2 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium">
                          {record.playerUsername} → {record.targetPlayerUsername}
                        </span>
                        <span className="text-gray-400">
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-300">Card:</span>
                          <div className="w-6 h-8 bg-white rounded border flex items-center justify-center text-xs font-bold">
                            {record.card.isJoker ? 'J' : record.card.rank}
                          </div>
                          <span className="text-gray-300">{record.card.suit}</span>
                        </div>
                        <span className="text-gray-300">→</span>
                        <span className="text-gray-300">
                          {record.targetMeldType} Meld #{record.targetMeldIndex + 1}
                        </span>
                        {record.gameAction === 'player_won_by_layoff' && (
                          <span className="text-yellow-400 font-bold">🏆 WIN!</span>
                        )}
                        {record.playerChatId === userInfo?.chatId && record.gameAction !== 'player_won_by_layoff' && (
                          <button
                            onClick={() => handleRemoveLayoff(index)}
                            disabled={removingLayoff}
                            className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 transition-colors disabled:opacity-50 ml-2"
                            title="Remove this layoff"
                          >
                            {removingLayoff ? 'Removing...' : 'Remove'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Current Player's Melds Section - Only show visible melds */}
          {playerMelds.filter(meld => meld.isVisible === true).length > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-green-400 text-sm font-medium">
                  ✓ Your Visible Melds ({playerMelds.filter(meld => meld.isVisible === true).length})
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {playerMelds
                  .filter(meld => meld.isVisible === true)
                  .map((meld, meldIndex) => (
                    <div key={`player-${meldIndex}`} className="bg-green-500/10 border border-green-500/30 rounded-lg p-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-green-400 text-xs">
                          ✓ Visible
                        </div>
                        <div className="flex gap-1">
                          {hasPlayerLaidOffToMeld(userInfo?.chatId, meldIndex) && (
                            <button
                              onClick={() => {
                                const layoffIndex = getLayoffIndexForMeld(userInfo?.chatId, meldIndex);
                                if (layoffIndex !== -1) {
                                  handleRemoveLayoff(layoffIndex);
                                }
                              }}
                              disabled={removingLayoff}
                              className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                              title="Remove your layoff"
                            >
                              {removingLayoff ? 'Removing...' : 'Remove Layoff'}
                            </button>
                          )}
                          {meld.cards.some(card => card.isJoker) && (
                            <button
                              onClick={() => {
                                setSelectedJokerMeld({ meldIndex, playerChatId: userInfo?.chatId, isOwnMeld: true });
                                setShowJokerSubstitutionModal(true);
                              }}
                              className="text-yellow-400 hover:text-yellow-300 text-xs px-2 py-1 rounded bg-yellow-500/20 hover:bg-yellow-500/30 transition-colors"
                              title="Substitute joker"
                            >
                              Substitute Joker
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {meld.cards.map((card, cardIndex) => (
                          <Card key={cardIndex} card={card} size={32} />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Hidden Melds Section - Only show if player has hidden melds */}
          {playerMelds.filter(meld => meld.isVisible === false).length > 0 && (
            <div className="bg-black/20 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-yellow-400 text-xs font-medium">
                  🔒 Hidden Melds ({playerMelds.filter(meld => meld.isVisible === false).length})
                </div>
                <div className="text-yellow-300 text-xs">
                  Make visible to enable discard drawing
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {playerMelds
                  .filter(meld => meld.isVisible === false)
                  .map((meld, meldIndex) => {
                    // Find the actual index in the full melds array
                    const actualMeldIndex = playerMelds.findIndex(m => m === meld);
                    return (
                      <div key={`hidden-${actualMeldIndex}`} className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-yellow-300 text-xs capitalize">
                            {meld.type}
                          </div>
                          <button
                            onClick={() => {
                              if (socket && gameState) {
                                socket.emit("makeMeldVisible", { gameId, meldIndex: actualMeldIndex });
                              }
                            }}
                            className="text-yellow-400 hover:text-yellow-300 text-xs px-2 py-1 rounded bg-yellow-500/20 hover:bg-yellow-500/30 transition-colors"
                            title="Make visible for discard drawing"
                          >
                            Show
                          </button>
                        </div>
                        <div className="flex gap-1">
                          {meld.cards.map((card, cardIndex) => (
                            <Card key={cardIndex} card={card} size={28} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Turn Indicator */}
          <div className="bg-black/30 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isPlayerTurn ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                }`}></div>
              <span className={`text-sm font-medium ${isPlayerTurn ? 'text-green-400' : 'text-white/70'
                }`}>
                {isPlayerTurn ? "Your Turn" : `${opponentPlayer?.username || "Opponent"}'s Turn`}
              </span>
              <div className={`w-3 h-3 rounded-full ${!isPlayerTurn ? 'bg-blue-400 animate-pulse' : 'bg-gray-400'
                }`}></div>
            </div>
         
          </div>

          {/* Your Hand Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white text-sm">Your Hand</div>
              <div className="flex items-center gap-2">
                {selectedCardsForMeld.length === 1 ? (
                  <div className="text-red-300 text-xs bg-red-500/20 px-2 py-1 rounded">
                    1 Selected (Discard Ready)
                  </div>
                ) : selectedCardsForMeld.length >= 3 ? (
                  <div className="text-blue-300 text-xs bg-blue-500/20 px-2 py-1 rounded">
                    {selectedCardsForMeld.length} Selected (Meld Ready)
                  </div>
                ) : selectedCardsForMeld.length === 2 ? (
                  <div className="text-yellow-300 text-xs bg-yellow-500/20 px-2 py-1 rounded">
                    2 Selected (Need 1 more for meld)
                  </div>
                ) : (
                  <div className="text-gray-400 text-xs">
                    Click cards to select
                  </div>
                )}
              </div>
            </div>
            <div ref={handRef}>
              <Hand
                cards={playerHand}
                melds={playerMelds}
                onCardSelect={handleCardSelect}
                selectedIndex={selectedCardIndex}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onReorder={handleReorder}
                isOpponent={false}
                cardSize={80}
                selectedCardsForMeld={selectedCardsForMeld}
              />
            </div>
          </div>

          {/* Discard Warning Message */}
          {isPlayerTurn && currentPlayer?.hasDrawnFromDiscard && playerMelds.filter(meld => meld.isVisible === false).length > 0 && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="text-yellow-400 text-sm font-medium">
                  ⚠️ Discard Blocked
                </div>
              </div>
              <div className="text-yellow-300 text-xs mt-1">
                You cannot discard after drawing from discard pile while having hidden melds.
                Show your melds first or draw from deck/base card instead.
              </div>
            </div>
          )}

          {/* Action Buttons - Below Player's Hand */}
          <div className="bg-black/20 rounded-lg p-4 mb-4">
            <div className="flex justify-center gap-3 flex-wrap">
              {/* Layoff Button */}
              <button
                onClick={() => setShowLayoffModal(true)}
                disabled={selectedCardsForMeld.length !== 1}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Layoff
              </button>

              {/* Meld Button */}
              <button
                onClick={() => {
                  if (selectedCardsForMeld.length >= 3 && selectedCardsForMeld.length <= 4) {
                    // Send meld directly to server without validation
                    socket.emit("meldCards", {
                      gameId,
                      cardIndices: selectedCardsForMeld,
                      meldType: 'auto' // Let server determine type
                    });

                    clearAllSelections();
                  }
                }}
                disabled={selectedCardsForMeld.length < 3 || selectedCardsForMeld.length > 4}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Meld ({selectedCardsForMeld.length >= 3 ? selectedCardsForMeld.length : '3-4'} cards)
              </button>

              {/* Discard Button */}
              <button
                onClick={() => {
                  if (selectedCardsForMeld.length === 1) {
                    // Send discard directly to server without validation
                    socket.emit("discardCard", {
                      gameId,
                      cardIndex: selectedCardsForMeld[0]
                    });
                    clearAllSelections();
                  }
                }}
                disabled={!canDiscard()}
                className={`${canDiscard()
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-600 opacity-50'
                  } text-white px-4 py-2 rounded text-sm font-medium transition-colors`}
                title={
                  !canDiscard() && currentPlayer?.hasDrawnFromDiscard
                    ? 'Cannot discard: Need 41+ points OR 3+ visible melds after drawing from discard'
                    : !canDiscard()
                      ? 'Select 1 card to discard'
                      : 'Discard selected card'
                }
              >
                {!canDiscard() && currentPlayer?.hasDrawnFromDiscard
                  ? 'Discard Blocked'
                  : 'Discard'
                }
              </button>

              {/* Smart Sorted Button with refresh icon */}
              <button
                onClick={handleBestSort}
                disabled={isSorting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2"
              >
                <FiRefreshCw className={`w-4 h-4 ${isSorting ? 'animate-spin' : ''}`} />
                {isSorting ? 'Sorting...' : 'Sort '}
              </button>
            </div>

            {/* Poke Button - Show when it's NOT player's turn */}
            {!isPlayerTurn && gameState.status === "playing" && (
              <div className="flex justify-center mt-3">
                <button
                  onClick={handlePokeUser}
                  disabled={gameState?.pokedBy || gameState?.pokeCount > 0}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${
                    gameState?.pokedBy || gameState?.pokeCount > 0
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  <FaBell className="w-4 h-4" />
                  {gameState?.pokedBy || gameState?.pokeCount > 0 ? 'Poke Sent' : 'Poke Opponent'}
                </button>
              </div>
            )}
          </div>
        </div>


        {/* Layoff Modal */}
        {showLayoffModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-gradient-to-br from-[#1a1f35] to-[#2c1b47] rounded-2xl border border-white/10 shadow-2xl p-8 max-w-md w-full mx-4"
            >
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                Layoff Card
              </h2>

              <div className="mb-6">
                <label className="block text-white/80 text-sm mb-2">Card to Layoff</label>
                {selectedCardsForMeld.length === 1 && (
                  <div className="bg-white/10 rounded-lg p-3 mb-3">
                    <div className="text-white/60 text-xs mb-2">Selected Card</div>
                    <div className="flex justify-center">
                      <Card card={playerHand[selectedCardsForMeld[0]]} size={60} />
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-white/80 text-sm mb-2">Select Target Meld</label>
                <div className="space-y-4">
                  {/* Your melds */}
                  {playerMelds.length > 0 && (
                    <div>
                      <div className="text-white/60 text-xs mb-2">Your Melds</div>
                      <div className="bg-white/10 rounded-lg p-3 max-h-40 overflow-y-auto">
                        <div className="flex flex-wrap gap-2">
                          {playerMelds.map((meld, index) => (
                            <div key={`player-${index}`} className="relative">
                              <button
                                onClick={() => {
                                  setTargetPlayerChatId(userInfo?.chatId);
                                  setTargetMeldIndex(index);
                                }}
                                className={`bg-green-500/10 border rounded-lg p-2 transition-all ${targetPlayerChatId === userInfo?.chatId && targetMeldIndex === index
                                  ? 'border-green-400 bg-green-400/20'
                                  : 'border-green-500/30 hover:border-green-400 hover:bg-green-400/15'
                                  }`}
                              >
                                <div className="text-green-400 text-xs mb-1">
                                  {meld.type === 'set' ? 'Set' : 'Run'} ({meld.cards.length} cards)
                                </div>
                                <div className="flex gap-1">
                                  {meld.cards.map((card, cardIndex) => (
                                    <Card key={cardIndex} card={card} size={28} />
                                  ))}
                                </div>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Opponent melds if visible */}
                  {opponentPlayer?.melds?.length > 0 && (
                    <div>
                      <div className="text-white/60 text-xs mb-2">@{opponentPlayer.username}'s Melds</div>
                      {(() => {
                        const visibleMelds = playerMelds.filter(meld => meld.isVisible === true);
                        const canLayoffToOpponent = visibleMelds.length >= 2;
                        
                        return (
                          <div className="bg-white/10 rounded-lg p-3 max-h-40 overflow-y-auto">
                            {!canLayoffToOpponent && (
                              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-2 mb-3">
                                <div className="text-yellow-400 text-xs font-medium mb-1">
                                  ⚠️ Layoff to Opponent Blocked
                                </div>
                                <div className="text-yellow-300 text-xs">
                                  You need at least 2 visible melds to lay off to opponent's melds. 
                                  You currently have {visibleMelds.length} visible meld{visibleMelds.length === 1 ? '' : 's'}.
                                </div>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {opponentPlayer.melds.map((meld, index) => (
                                <div key={`opponent-${index}`} className="relative">
                                  <button
                                    onClick={() => {
                                      if (canLayoffToOpponent) {
                                        setTargetPlayerChatId(opponentPlayer.chatId);
                                        setTargetMeldIndex(index);
                                      }
                                    }}
                                    disabled={!canLayoffToOpponent}
                                    className={`border rounded-lg p-2 transition-all ${
                                      canLayoffToOpponent
                                        ? targetPlayerChatId === opponentPlayer.chatId && targetMeldIndex === index
                                          ? 'border-blue-400 bg-blue-400/20'
                                          : 'border-blue-500/30 hover:border-blue-400 hover:bg-blue-400/15 bg-blue-500/10'
                                        : 'border-gray-500/30 bg-gray-500/10 opacity-50 cursor-not-allowed'
                                    }`}
                                  >
                                    <div className={`text-xs mb-1 ${canLayoffToOpponent ? 'text-blue-400' : 'text-gray-400'}`}>
                                      {meld.type === 'set' ? 'Set' : 'Run'} ({meld.cards.length} cards)
                                    </div>
                                    <div className="flex gap-1">
                                      {meld.cards.map((card, cardIndex) => (
                                        <Card key={cardIndex} card={card} size={28} />
                                      ))}
                                    </div>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowLayoffModal(false);
                    setTargetMeldIndex(-1);
                    setTargetPlayerChatId(null);
                  }}
                  className="px-6 py-3 rounded-xl bg-white/5 text-white/80 text-sm font-medium hover:bg-white/10 transition-colors border border-white/5 min-w-[120px]"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLayoffCard}
                  disabled={selectedCardsForMeld.length !== 1 || targetMeldIndex === -1}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-sm font-medium hover:from-teal-600 hover:to-cyan-700 transition-all min-w-[120px] shadow-lg shadow-teal-500/20 disabled:opacity-50"
                >
                  Layoff
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setShowLayoffModal(false);
                  setTargetMeldIndex(-1);
                  setTargetPlayerChatId(null);
                }}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-colors"
              >
                <FiX className="w-5 h-5 text-white/60" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}


        {/* Enhanced Poke Warning Modal */}
        <AnimatePresence>
          {showPokeWarning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-gradient-to-br from-[#1A1B2E] to-[#2D1B69] p-8 rounded-2xl border border-white/20 max-w-md w-full shadow-2xl"
              >
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", damping: 10 }}
                    className="relative mb-4"
                  >
                    <motion.div
                      animate={{ 
                        rotate: [-10, 10, -10, 10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        repeatDelay: 1
                      }}
                      className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-lg"
                    >
                      <FaBell className="text-white text-2xl" />
                  </motion.div>
                    {/* Pulsing ring effect */}
                    <motion.div
                      className="absolute inset-0 border-4 border-yellow-400/30 rounded-full"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.7, 0, 0.7]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity
                      }}
                    />
                  </motion.div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3">
                    ⏰ Please Wait!
                  </h3>
                  
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                    <p className="text-yellow-200 text-sm leading-relaxed">
                      <strong>Reminder sent!</strong> Your opponent is in the middle of their turn. 
                      Please wait 1-2 minutes for them to return. If they don't come back, 
                      the money will be refunded automatically.
                  </p>
                </div>
                  
                  <div className="flex items-center justify-center gap-2 text-blue-300 text-sm">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span>Waiting for opponent to make their move...</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowPokeWarning(false)}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 text-blue-300 rounded-xl transition-all duration-300 border border-blue-500/30 font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                    Got it
                </motion.button>
                  
                  <motion.button
                    onClick={() => {
                      setShowPokeWarning(false);
                      window.location.reload();
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 text-green-300 rounded-xl transition-all duration-300 border border-green-500/30 font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Refresh Game
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Joker Substitution Modal */}
        {showJokerSubstitutionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-gradient-to-br from-[#1a1f35] to-[#2c1b47] rounded-2xl border border-white/10 shadow-2xl p-8 max-w-md w-full mx-4"
            >
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                Substitute Joker
              </h2>

              <div className="mb-6">
                <label className="block text-white/80 text-sm mb-2">Select Joker to Replace</label>
                {selectedJokerMeld && (
                  <div className="bg-white/10 rounded-lg p-3 mb-3">
                    <div className="text-white/60 text-xs mb-2">
                      {selectedJokerMeld.isOwnMeld ? 'Your Meld' : `${opponentPlayer?.username}'s Meld`}
                    </div>
                    <div className="flex gap-1">
                      {(() => {
                        const targetPlayer = selectedJokerMeld.isOwnMeld ? currentPlayer : opponentPlayer;
                        const targetMeld = targetPlayer?.melds?.[selectedJokerMeld.meldIndex];
                        return targetMeld?.cards?.map((card, cardIndex) => (
                          <div key={cardIndex} className="relative">
                            <Card card={card} size={40} />
                            {card.isJoker && (
                              <button
                                onClick={() => setSelectedJokerIndex(cardIndex)}
                                className={`absolute inset-0 border-2 rounded ${selectedJokerIndex === cardIndex
                                  ? 'border-yellow-400 bg-yellow-400/20'
                                  : 'border-transparent hover:border-yellow-300'
                                  }`}
                              />
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-white/80 text-sm mb-2">Select Replacement Card</label>
                <div className="bg-white/10 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="text-white/60 text-xs mb-2">Your Hand</div>
                  <div className="flex flex-wrap gap-1">
                    {playerHand.map((card, cardIndex) => (
                      <div key={cardIndex} className="relative">
                        <Card card={card} size={40} />
                        <button
                          onClick={() => setSelectedReplacementCard(cardIndex)}
                          className={`absolute inset-0 border-2 rounded ${selectedReplacementCard === cardIndex
                            ? 'border-green-400 bg-green-400/20'
                            : 'border-transparent hover:border-green-300'
                            }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowJokerSubstitutionModal(false);
                    setSelectedJokerMeld(null);
                    setSelectedJokerIndex(-1);
                    setSelectedReplacementCard(-1);
                  }}
                  className="px-6 py-3 rounded-xl bg-white/5 text-white/80 text-sm font-medium hover:bg-white/10 transition-colors border border-white/5 min-w-[120px]"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (selectedJokerIndex !== -1 && selectedReplacementCard !== -1 && selectedJokerMeld) {
                      // Send joker substitution to server
                      socket.emit("substituteJoker", {
                        gameId,
                        targetPlayerChatId: selectedJokerMeld.playerChatId,
                        meldIndex: selectedJokerMeld.meldIndex,
                        jokerIndex: selectedJokerIndex,
                        replacementCardIndex: selectedReplacementCard
                      });

                      // Close modal and reset state
                      setShowJokerSubstitutionModal(false);
                      setSelectedJokerMeld(null);
                      setSelectedJokerIndex(-1);
                      setSelectedReplacementCard(-1);
                    }
                  }}
                  disabled={selectedJokerIndex === -1 || selectedReplacementCard === -1}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-sm font-medium hover:from-yellow-600 hover:to-orange-700 transition-all min-w-[120px] shadow-lg shadow-yellow-500/20 disabled:opacity-50"
                >
                  Substitute
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setShowJokerSubstitutionModal(false);
                  setSelectedJokerMeld(null);
                  setSelectedJokerIndex(-1);
                  setSelectedReplacementCard(-1);
                }}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-colors"
              >
                <FiX className="w-5 h-5 text-white/60" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {/* Rules Modal */}
        <Rules
          isOpen={showRulesModal}
          onClose={() => setShowRulesModal(false)}
          gameMode={gameState.gameType}
        />
      </div>
    </div>
  );
}

export default Game;

