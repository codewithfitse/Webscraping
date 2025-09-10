import React from "react";
import { FiX } from "react-icons/fi";
import { FaTrophy } from "react-icons/fa";
import { BiSad } from "react-icons/bi";
import Hand from "./Hand";

const GameCompletionModal = ({
  isOpen,
  onClose,
  gameState,
  onPlayAgain,
  userInfo,
}) => {
  if (!isOpen || !gameState) return null;

  const isWinner = gameState.winner === userInfo?.username;
  const currentPlayer = gameState.players.find(
    (p) => p.username === userInfo?.username
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`rounded-2xl p-6 max-w-sm w-full relative border shadow-2xl ${
          isWinner
            ? "bg-gradient-to-br from-green-900 to-emerald-900 border-green-500/30"
            : "bg-gradient-to-br from-red-900 to-rose-900 border-red-500/30"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-full transition-colors duration-200 z-10"
        >
          <FiX className="h-5 w-5 text-white/70" />
        </button>

        {/* Result Section */}
        <div className="text-center mb-6">
          {isWinner ? (
            <>
              <FaTrophy className="h-16 w-16 text-yellow-400 mx-auto mb-3 animate-bounce" />
              <h2 className="text-3xl font-bold text-white mb-2">You Won!</h2>
              <p className="text-yellow-400 text-lg font-semibold">
                Congratulations!
              </p>
              <div className="mt-4 text-white/90 text-sm">
                Prize Pool:{" "}
                <span className="text-2xl font-bold block mt-1 text-green-400">
                  {((gameState?.betAmount || 0) * 2 * 0.9).toFixed(2)} ETB
                </span>
              </div>
            </>
          ) : (
            <>
              <BiSad className="h-16 w-16 text-red-400 mx-auto mb-3" />
              <h2 className="text-3xl font-bold text-white mb-2">You Lost</h2>
              <p className="text-red-400 text-lg font-semibold">
                Better luck next time!
              </p>
              <div className="mt-4 text-white/90 text-sm">
                Lost Bet:{" "}
                <span className="text-2xl font-bold block mt-1 text-red-400">
                  {(gameState?.betAmount || 0).toFixed(2)} ETB
                </span>
              </div>
            </>
          )}
        </div>

        {/* Stats Section */}
        <div className="bg-black/20 rounded-xl p-4 mb-6">
          <div className="text-center space-y-2">
            <p className="text-white/80 text-sm">Your Deadwood</p>
            <span
              className={`text-2xl font-bold ${
                isWinner ? "text-green-400" : "text-red-400"
              }`}
            >
              {currentPlayer?.deadwood || 0}
            </span>
          </div>
        </div>

        {/* Play Again Button */}
        <button
          onClick={onPlayAgain}
          className={`w-full px-6 py-3 rounded-xl transition-all duration-200 font-semibold text-base ${
            isWinner
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameCompletionModal;
