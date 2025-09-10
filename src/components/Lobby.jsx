import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGetUserInfo } from "../utils/getUserinfo";
import { apiUrl } from "../utils/apiUrl";
import {
  FiRefreshCw,
  FiPlus,
  FiAlertCircle,
  FiPlay,
  FiInfo,
  FiUser,
} from "react-icons/fi";
import { FaCoins } from "react-icons/fa";
import { BsClockHistory } from "react-icons/bs";
import Loading from "./Loading";
import TransactionHistory from "./TransactionHistory";
import Rules from "./Rules";
import avatarImg from "../assets/avatar.jpg";
import avatar2Img from "../assets/avatar2.jpg";
import moneyBagImg from "../assets/money-bag.png";

export default function Lobby() {
  const [games, setGames] = useState([]);
  const [activeGames, setActiveGames] = useState([]);
  const [error, setError] = useState(null);
  const [showBetModal, setShowBetModal] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [selectedBet, setSelectedBet] = useState(null);
  const [token, setToken] = useState(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [isLoadingActive, setIsLoadingActive] = useState(false);
  const [showGameModeModal, setShowGameModeModal] = useState(false);
  const [selectedGameToJoin, setSelectedGameToJoin] = useState(null);
  const [selectedGameMode, setSelectedGameMode] = useState('UP_AND_DOWN');

  // Bet options
  const betOptions = [20, 30, 50, 100, 200, 300, 500, 750, 1000];

  // Game mode options
  const gameModeOptions = [
    { value: 'UP_AND_DOWN', label: 'UP & DOWN', desc: 'Most popular' },
    { value: 'UP', label: 'UP', desc: 'Simple mode' },
    { value: 'DOWN', label: 'DOWN', desc: 'Master mode' },
    { value: 'SIDE', label: 'SIDE', desc: 'Advanced mode' }
  ];

  // Default game settings
  const defaultGameMode = 'UP_AND_DOWN';
  const defaultMaxPlayers = 2;

  useEffect(() => {
    // Extract token from URL parameters
    const params = new URLSearchParams(window.location.search);
    const newToken = params.get("token");

    // Store token in localStorage
    if (newToken) {
      localStorage.setItem("cardgametoken", newToken);
      setToken(newToken);
    }
  }, []);

  const { userInfo } = useGetUserInfo(token);

  const fetchGames = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("cardgametoken");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${apiUrl}/api/games/recent`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch games (Status: ${response.status})`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid response format from server");
      }

      setGames(data);
    } catch (error) {
      console.error("Error fetching games:", error);
      setError(error.message || "Failed to fetch games. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveGames = async () => {
    setIsLoadingActive(true);
    setError(null);

    try {
      const token = localStorage.getItem("cardgametoken");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${apiUrl}/api/games/active/${userInfo?.chatId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch active games (Status: ${response.status})`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid response format from server");
      }

      setActiveGames(data);
    } catch (error) {
      console.error("Error fetching active games:", error);
      setError(
        error.message || "Failed to fetch active games. Please try again."
      );
    } finally {
      setIsLoadingActive(false);
    }
  };

  useEffect(() => {
    fetchGames();
    if (userInfo) {
      fetchActiveGames();
    }
    const refreshInterval = setInterval(() => {
      fetchGames();
      if (userInfo) {
        fetchActiveGames();
      }
    }, 10000);
    return () => clearInterval(refreshInterval);
  }, [userInfo]);

  const handleRefresh = () => {
    fetchGames();
  };

  const openBetModal = () => {
    setSelectedBet(null);
    setShowBetModal(true);
  };

  const closeBetModal = () => {
    setShowBetModal(false);
  };

  const handleBetSelection = (amount) => {
    setSelectedBet(amount);
  };

  const handleCreateGame = async () => {
    if (!selectedBet) return;

    try {
      setIsCreatingGame(true);
      setError(null);

      if (userInfo && userInfo.balance < selectedBet) {
        setError(
          `Insufficient balance. You need ${selectedBet} ETB to create this game.`
        );
        closeBetModal();
        return;
      }

      const token = localStorage.getItem("cardgametoken");
      if (!token) {
        setError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch(`${apiUrl}/api/games/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          creator: userInfo.username,
          chatId: userInfo.chatId,
          gameType: defaultGameMode,
          maxPlayers: defaultMaxPlayers,
          betAmount: selectedBet,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create game");
      }

      const game = await response.json();
      closeBetModal();
      await fetchGames();
      navigate(`/game/${game.gameId}`);
    } catch (error) {
      console.error("Error creating game:", error);
      setError("Failed to create game. Please try again.");
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleJoinGame = async (gameId) => {
    // Find the game to join
    const gameToJoin = games.find(g => g.gameId === gameId);
    if (!gameToJoin) {
      setError("Game not found");
      return;
    }
    
    // Show game mode selection modal
    setSelectedGameToJoin(gameToJoin);
    setSelectedGameMode('UP_AND_DOWN'); // Reset to default
    setShowGameModeModal(true);
  };

  const handleConfirmJoinGame = async () => {
    if (!selectedGameToJoin || !selectedGameMode) return;

    try {
      setIsJoiningGame(true);
      setError(null);

      if (!userInfo?.username || !userInfo?.chatId) {
        throw new Error("Please log in to join a game");
      }

      const token = localStorage.getItem("cardgametoken");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${apiUrl}/api/games/${selectedGameToJoin.gameId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: userInfo.username,
          chatId: userInfo.chatId,
          selectedGameType: selectedGameMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join game");
      }

      const game = await response.json();
      setShowGameModeModal(false);
      setSelectedGameToJoin(null);
      navigate(`/game/${game.gameId}`);
    } catch (error) {
      console.error("Error joining game:", error);
      setError(error.message || "Failed to join game. Please try again.");
    } finally {
      setIsJoiningGame(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] px-4 sm:px-6 py-8">
      {(isCreatingGame || isJoiningGame) && <Loading />}
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header Section */}
        <div className="bg-[#161B22] rounded-xl p-4 border border-[#30363D]">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* User Info Section */}
            <div className="flex items-center gap-3">
              {userInfo ? (
                <>
                  <div className="w-9 h-9 rounded-lg overflow-hidden">
                    <img
                      src={avatarImg}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-white/90 text-sm font-medium">
                      @{userInfo.username}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <FaCoins className="text-[#A78BFA] text-xs" />
                      <span className="text-[#A78BFA] text-sm">
                        {userInfo.balance || 0} ETB
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="animate-pulse flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#1F2937]"></div>
                  <div>
                    <div className="h-4 w-24 bg-[#1F2937] rounded"></div>
                    <div className="h-3 w-16 bg-[#1F2937] rounded mt-2"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
              <button
                onClick={() => setShowRules(true)}
                className="px-3 py-1.5 text-xs text-[#8B949E] hover:text-white bg-[#21262D] hover:bg-[#30363D] rounded-md transition-colors"
              >
                <FiInfo className="text-base" />
                Rules
              </button>
              <button
                onClick={() => setShowTransactionHistory(true)}
                className="px-3 py-1.5 text-xs text-[#8B949E] hover:text-white bg-[#21262D] hover:bg-[#30363D] rounded-md transition-colors"
              >
                <BsClockHistory className="text-base" />
                History
              </button>
              <button
                onClick={openBetModal}
                disabled={isCreatingGame}
                className="px-3 py-1.5 text-xs text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiPlus className="text-base" />
                New Game
              </button>
            </div>
          </div>
        </div>

        {/* Available Games Grid */}
        <div className="bg-[#161B22] rounded-xl border border-[#30363D]">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white/90 text-sm font-medium">
                Available Games ({games.length})
              </h2>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 text-[#8B949E] hover:text-white bg-[#21262D] hover:bg-[#30363D] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiRefreshCw
                  className={`text-sm ${isLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            {isLoading && games.length === 0 ? (
              <div className="flex justify-center items-center py-6">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#A78BFA] border-t-transparent"></div>
              </div>
            ) : games.length === 0 ? (
              <div className="text-center py-6">
                <img
                  src={moneyBagImg}
                  alt="Money Bag"
                  className="w-16 h-16 mx-auto mb-4 opacity-80"
                />
                <p className="text-[#8B949E] text-sm mb-4">
                  No games available
                </p>
                <button
                  onClick={openBetModal}
                  className="px-4 py-2 text-xs text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-md transition-colors flex items-center gap-2 mx-auto"
                >
                  <FiPlus className="text-base" />
                  Create Game
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {games.map((game) => (
                  <div
                    key={game.gameId}
                    className="bg-[#1F2937] p-3 rounded-lg hover:bg-[#374151] transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden">
                          <img
                            src={
                              game.creator === userInfo?.username
                                ? avatarImg
                                : avatar2Img
                            }
                            alt={`${game.creator}'s avatar`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="text-white/90 text-xs font-medium">
                            @{game.creator}'s Game
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[#8B949E] text-xs flex items-center gap-1">
                              <FiUser className="text-xs" />
                              {game.players.length}/{game.maxPlayers}
                            </p>
                            {game.betAmount && (
                              <p className="text-[#A78BFA] text-xs flex items-center gap-1">
                                <FaCoins className="text-xs" />
                                {game.betAmount} ETB
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            game.status === "waiting"
                              ? "bg-[#1F2937] text-[#34D399] border border-[#34D399]/20"
                              : "bg-[#1F2937] text-[#A78BFA] border border-[#A78BFA]/20"
                          }`}
                        >
                          {game.status}
                        </span>
                        {game.status === "waiting" &&
                          !game.players.some(
                            (p) => p.username === userInfo?.username
                          ) && (
                            <button
                              onClick={() => handleJoinGame(game.gameId)}
                              className="px-3 py-1.5 text-xs text-white bg-[#059669] hover:bg-[#047857] rounded-md transition-colors"
                            >
                              Join
                            </button>
                          )}
                        {game.players.some(
                          (p) => p.username === userInfo?.username
                        ) && (
                          <Link
                            to={`/game/${game.gameId}`}
                            className="px-3 py-1.5 text-xs text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-md transition-colors"
                          >
                            Return
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Games Section */}
        <div className="bg-[#161B22] rounded-xl border border-[#30363D]">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white/90 text-sm font-medium flex items-center gap-2">
                <FiPlay className="text-sm" />
                Your Active Games ({activeGames.length})
              </h2>
              <button
                onClick={fetchActiveGames}
                disabled={isLoadingActive}
                className="p-2 text-[#8B949E] hover:text-white bg-[#21262D] hover:bg-[#30363D] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiRefreshCw
                  className={`text-sm ${isLoadingActive ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            {isLoadingActive && activeGames.length === 0 ? (
              <div className="flex justify-center items-center py-6">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#A78BFA] border-t-transparent"></div>
              </div>
            ) : activeGames.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-[#8B949E] text-sm">
                  You don't have any active games
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeGames.map((game) => (
                  <div
                    key={game.gameId}
                    className="bg-[#1F2937] p-3 rounded-lg hover:bg-[#374151] transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                      <div>
                        <h3 className="text-white/90 text-xs font-medium flex items-center gap-2">
                          Game #{game.gameId}
                          <span className="text-[#A78BFA] text-xs px-2 py-0.5 rounded bg-[#21262D] border border-[#A78BFA]/20">
                            Active
                          </span>
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded overflow-hidden">
                              <img
                                src={
                                  game.players[0]?.username ===
                                  userInfo?.username
                                    ? avatarImg
                                    : avatar2Img
                                }
                                alt={`${game.players[0]?.username}'s avatar`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-[#8B949E] text-xs">
                              @{game.players[0]?.username}
                              {game.players[0]?.username ===
                                userInfo.username && (
                                <span className="text-[#34D399] ml-1">
                                  (You)
                                </span>
                              )}
                            </p>
                          </div>
                          {game.players.length === 2 && (
                            <span className="text-[#4B5563] text-xs">vs</span>
                          )}
                          {game.players[1] ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded overflow-hidden">
                                <img
                                  src={
                                    game.players[1].username ===
                                    userInfo?.username
                                      ? avatarImg
                                      : avatar2Img
                                  }
                                  alt={`${game.players[1].username}'s avatar`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="text-[#8B949E] text-xs">
                                @{game.players[1].username}
                                {game.players[1].username ===
                                  userInfo.username && (
                                  <span className="text-[#34D399] ml-1">
                                    (You)
                                  </span>
                                )}
                              </p>
                            </div>
                          ) : (
                            <p className="text-[#8B949E] text-xs">Waiting...</p>
                          )}
                        </div>
                      </div>
                      <Link
                        to={`/game/${game.gameId}`}
                        className="w-full sm:w-auto px-3 py-1.5 text-xs text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-md transition-colors text-center"
                      >
                        Return to Game
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bet Modal */}
        {showBetModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#161B22] rounded-xl w-full max-w-md p-6 border border-[#30363D]">
              <h2 className="text-lg text-white font-medium mb-6">
                Create New Game
              </h2>



              {/* Bet Amount Selection */}
              <div className="mb-6">
                <label className="block text-white/80 text-sm mb-3 font-medium">
                  Bet Amount
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {betOptions.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleBetSelection(amount)}
                      className={`p-3 rounded-lg transition-colors text-center ${
                        selectedBet === amount
                          ? "bg-[#7C3AED] text-white"
                          : "bg-[#21262D] text-[#8B949E] hover:bg-[#30363D] hover:text-white"
                      }`}
                    >
                      <div className="text-sm font-medium flex items-center justify-center gap-1.5">
                        <FaCoins className="text-[#A78BFA]" />
                        {amount}
                      </div>
                      <div className="text-xs text-[#8B949E]">ETB</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={closeBetModal}
                  className="flex-1 px-4 py-2 text-sm text-[#8B949E] hover:text-white bg-[#21262D] hover:bg-[#30363D] rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGame}
                  disabled={!selectedBet || isCreatingGame}
                  className={`flex-1 px-4 py-2 text-sm transition-colors ${
                    !selectedBet || isCreatingGame
                      ? "bg-[#21262D] text-[#8B949E] cursor-not-allowed"
                      : "bg-[#7C3AED] text-white hover:bg-[#6D28D9]"
                  }`}
                >
                  {isCreatingGame ? (
                    <span className="flex items-center justify-center gap-2">
                      <FiRefreshCw className="animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create Game"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Mode Selection Modal */}
        {showGameModeModal && selectedGameToJoin && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#161B22] rounded-xl w-full max-w-md p-6 border border-[#30363D]">
              <h2 className="text-lg text-white font-medium mb-6">
                Join Game
              </h2>

              {/* Game Info */}
              <div className="mb-6 bg-[#1F2937] rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg overflow-hidden">
                    <img
                      src={avatar2Img}
                      alt={`${selectedGameToJoin.creator}'s avatar`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-white/90 text-sm font-medium">
                      @{selectedGameToJoin.creator}'s Game
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[#8B949E] text-xs flex items-center gap-1">
                        <FaCoins className="text-xs" />
                        {selectedGameToJoin.betAmount} ETB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Game Mode Selection */}
              <div className="mb-6">
                <label className="block text-white/80 text-sm mb-3 font-medium">
                  Choose Game Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {gameModeOptions.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setSelectedGameMode(mode.value)}
                      className={`p-3 rounded-lg transition-colors text-center ${
                        selectedGameMode === mode.value
                          ? "bg-[#7C3AED] text-white"
                          : "bg-[#21262D] text-[#8B949E] hover:bg-[#30363D] hover:text-white"
                      }`}
                    >
                      <div className="text-sm font-medium">{mode.label}</div>
                      <div className="text-xs text-[#8B949E]">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowGameModeModal(false);
                    setSelectedGameToJoin(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm text-[#8B949E] hover:text-white bg-[#21262D] hover:bg-[#30363D] rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmJoinGame}
                  disabled={isJoiningGame}
                  className={`flex-1 px-4 py-2 text-sm transition-colors ${
                    isJoiningGame
                      ? "bg-[#21262D] text-[#8B949E] cursor-not-allowed"
                      : "bg-[#059669] text-white hover:bg-[#047857]"
                  }`}
                >
                  {isJoiningGame ? (
                    <span className="flex items-center justify-center gap-2">
                      <FiRefreshCw className="animate-spin" />
                      Joining...
                    </span>
                  ) : (
                    "Join Game"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showTransactionHistory && (
          <TransactionHistory
            isOpen={showTransactionHistory}
            onClose={() => setShowTransactionHistory(false)}
          />
        )}

        {showRules && (
          <Rules
            isOpen={showRules}
            onClose={() => setShowRules(false)}
            playerDeadwood={0}
          />
        )}
      </div>
    </div>
  );
}
